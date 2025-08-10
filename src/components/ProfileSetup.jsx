import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";
import { Step1Details } from "@/components/profile/Step1Details";
import { Step2Avatar } from "@/components/profile/Step2Avatar";
import { supabase } from "@/lib/supabase";

const ProfileSetup = ({
  onBack,
  onComplete,
  isInitialSetup = false,
  isNewDependent = false,
  existingData = null,
}) => {
  const { user, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState({
    fullName: "",
    username: "",
    birthDate: "",
    gender: "",
    district: "",
    subCounty: "",
    avatar: "avatar-2",
  });
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [subCounties, setSubCounties] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [loadingSubCounties, setLoadingSubCounties] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (existingData) {
      setProfileData({
        fullName: existingData.full_name || existingData.username,
        username: existingData.username,
        birthDate: existingData.date_of_birth,
        gender: existingData.gender,
        district: existingData.district || "",
        subCounty: existingData.sub_county || "",
        avatar: existingData.profile_picture,
      });
      if (existingData.profile_picture?.startsWith("http")) {
        setPreviewUrl(existingData.profile_picture);
      }
    }
  }, [existingData]);

  useEffect(() => {
    let isMounted = true;
    const loadDistricts = async () => {
      setLoadingDistricts(true);
      const result = await profileService.getDistricts();
      if (isMounted) {
        if (result.success) setDistricts(result.data);
        else setDistricts([]);
        setLoadingDistricts(false);
      }
    };
    loadDistricts();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (profileData.district && districts.length > 0) {
      const loadSubCounties = async () => {
        const selectedDistrict = districts.find(
          (d) => d.name === profileData.district
        );
        if (!selectedDistrict) return;
        setLoadingSubCounties(true);
        const result = await profileService.getSubCounties(selectedDistrict.id);
        if (result.success) setSubCounties(result.data);
        setLoadingSubCounties(false);
      };
      loadSubCounties();
    }
  }, [profileData.district, districts]);

  const validateField = useCallback(
    (name, value) => {
      let error = null;
      if (name === "fullName" && (!value || value.trim().length < 2))
        error = "Full name must be at least 2 characters.";
      if (name === "username" && (!value || value.length < 3))
        error = "Username must be at least 3 characters.";
      if (name === "birthDate" && !value) error = "Birth date is required.";
      if (name === "gender" && !value) error = "Gender is required.";
      if (name === "district" && !value && !isNewDependent)
        error = "District is required.";
      setErrors((prev) => ({ ...prev, [name]: error }));
      return !error;
    },
    [isNewDependent]
  );

  const checkUsername = useCallback(
    async (username) => {
      if (username.length < 3) return;
      if (existingData && existingData.username === username) {
        setErrors((prev) => ({ ...prev, username: null }));
        return;
      }
      setUsernameChecking(true);
      const profileIdToExclude = existingData ? existingData.id : null;
      const result = await profileService.checkUsernameAvailability(
        username,
        profileIdToExclude
      );
      setUsernameChecking(false);
      if (result.available) {
        setErrors((prev) => ({ ...prev, username: null }));
      } else {
        setErrors((prev) => ({
          ...prev,
          username: result.error || "Username is not available.",
        }));
      }
    },
    [existingData]
  );

  const handleNext = () => {
    const fieldsToValidate = isNewDependent
      ? ["fullName", "username", "birthDate", "gender"]
      : ["fullName", "username", "birthDate", "gender", "district"];
    const isStep1Valid = fieldsToValidate.every((field) =>
      validateField(field, profileData[field])
    );

    if (step === 1 && isStep1Valid && !errors.username) {
      setStep(2);
    } else if (step === 2) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in again.",
        variant: "destructive",
      });
      return navigate("/welcome/auth");
    }
    setIsSubmitting(true);

    if (isNewDependent) {
      if (onComplete) await onComplete(profileData);
      setIsSubmitting(false);
      return;
    }

    try {
      const profileResult = await profileService.upsertProfile(
        profileData,
        user.id,
        user.phone
      );
      if (!profileResult.success) throw profileResult.error;

      if (profilePhotoFile) {
        await profileService.uploadProfilePhoto(profilePhotoFile, user.id);
      }

      const { error: updateUserError } = await supabase.auth.updateUser({
        data: { display_name: profileData.username },
      });
      if (updateUserError) throw updateUserError;

      toast({ title: "Profile Created!", description: "Welcome to NetLife." });

      if (refreshSession) await refreshSession();
      if (onComplete) onComplete(profileResult.data);
    } catch (error) {
      toast({
        title: "Profile Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (onBack) onBack();
  };

  const onFileSelect = useCallback((file, isReset = false) => {
    if (isReset) {
      setProfilePhotoFile(null);
      setPreviewUrl(null);
      return;
    }
    setProfilePhotoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setProfileData((prev) => ({ ...prev, avatar: null }));
  }, []);

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border shadow-sm flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-1/3 bg-gray-100 p-6 flex flex-col justify-between">
            <div>
              <button
                onClick={handleBack}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 mb-8"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNewDependent ? "Add New Profile" : "Tell us about yourself"}
              </h1>
              <p className="text-gray-600 text-sm mt-2">Step {step} of 2</p>
            </div>
            <div className="w-full">
              <Progress value={step * 50} className="h-2 mt-4" />
            </div>
          </div>

          <div className="w-full md:w-2/3 p-6 md:p-8 flex flex-col">
            <div className="flex-1 overflow-y-auto no-scrollbar pr-2 -mr-2">
              {step === 1 ? (
                <Step1Details
                  profileData={profileData}
                  setProfileData={setProfileData}
                  errors={errors}
                  validateField={validateField}
                  checkUsername={checkUsername}
                  usernameChecking={usernameChecking}
                  districts={districts}
                  subCounties={subCounties}
                  loadingDistricts={loadingDistricts}
                  loadingSubCounties={loadingSubCounties}
                  isNewDependent={isNewDependent}
                />
              ) : (
                <Step2Avatar
                  profileData={profileData}
                  setProfileData={setProfileData}
                  onFileSelect={onFileSelect}
                  previewUrl={previewUrl}
                />
              )}
            </div>
            <div className="mt-8">
              <Button
                onClick={handleNext}
                disabled={isSubmitting || usernameChecking}
                className="w-full h-12 bg-primary text-white font-semibold text-lg rounded-xl"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : step === 1 ? (
                  "Continue"
                ) : (
                  "Complete Profile"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
