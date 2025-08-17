import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  const { refreshSession } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState({
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
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (existingData) {
      setProfileData({
        username: existingData.username || "",
        birthDate: existingData.date_of_birth || "",
        gender: existingData.gender || "",
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
    if (!isNewDependent) {
      loadDistricts();
    } else {
      setLoadingDistricts(false);
    }
    return () => {
      isMounted = false;
    };
  }, [isNewDependent]);

  const validateField = useCallback(
    (name, value) => {
      let error = null;
      if (name === "username" && (!value || value.trim().length < 3))
        error = "Username must be at least 3 characters.";
      if (name === "birthDate" && !value)
        error = "You must be at least 15 years old to register.";
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
    if (step === 2) {
      handleSubmit();
      return;
    }

    if (step === 1) {
      const fieldsToValidate = isNewDependent
        ? ["username", "birthDate", "gender"]
        : ["username", "birthDate", "gender", "district"];

      let isStep1Valid = true;
      const newErrors = {};
      fieldsToValidate.forEach((field) => {
        if (!validateField(field, profileData[field])) {
          isStep1Valid = false;
          if (!profileData[field]) {
            if (field === "birthDate")
              newErrors[field] =
                "You must be at least 15 years old to register.";
            else
              newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)
                } is required.`;
          }
        }
      });

      if (errors.username) {
        isStep1Valid = false;
      }

      setErrors((prev) => ({ ...prev, ...newErrors }));

      if (isStep1Valid) {
        setStep(2);
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    if (onComplete && isNewDependent) {
      await onComplete(profileData, profilePhotoFile);
      setIsSubmitting(false);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return navigate("/welcome/auth");
      }

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

      await refreshSession();

      toast({ title: "Profile Created!", description: "Welcome to NetLife." });

      if (onComplete) {
        onComplete();
      } else {
        navigate("/");
      }
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
    <div className="w-full min-h-screen bg-gray-50 flex flex-col">
      <div className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-900">
            {isNewDependent ? "Add Profile" : "Profile Setup"}
          </h1>
          <p className="text-gray-500 text-sm">Step {step} of 2</p>
        </div>
        <div className="w-10" />
      </div>

      <div className="md:hidden px-4 py-3 bg-white border-b">
        <Progress value={step * 50} className="h-2" />
      </div>

      <div className="flex-1 flex flex-col md:items-center md:justify-center md:p-4">
        <div className="w-full md:max-w-4xl md:mx-auto">
          <div className="bg-white md:rounded-2xl md:border md:shadow-sm flex flex-col md:flex-row overflow-hidden min-h-0 flex-1 md:flex-none">
            <div className="hidden md:flex w-full md:w-1/3 bg-gray-100 p-6 flex-col justify-between">
              <div>
                <button
                  onClick={handleBack}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 mb-8"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isNewDependent
                    ? "Add New Profile"
                    : "Tell us about yourself"}
                </h1>
                <p className="text-gray-600 text-sm mt-2">Step {step} of 2</p>
              </div>
              <div className="w-full">
                <Progress value={step * 50} className="h-2 mt-4" />
              </div>
            </div>

            <div className="w-full md:w-2/3 flex flex-col flex-1">
              <div
                className={`flex-1 overflow-y-auto p-4 md:p-8 ${step === 2 ? "pb-8 md:pb-8" : ""
                  }`}
              >
                {step === 1 ? (
                  <Step1Details
                    profileData={profileData}
                    setProfileData={setProfileData}
                    errors={errors}
                    validateField={validateField}
                    checkUsername={checkUsername}
                    usernameChecking={usernameChecking}
                    districts={districts}
                    loadingDistricts={loadingDistricts}
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

              <div
                className={`p-4 md:p-8 bg-white ${step === 2
                  ? "pt-6 md:pt-4 border-t md:border-t-0"
                  : "pt-0 md:pt-4 border-t md:border-t-0"
                  }`}
              >
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting || usernameChecking}
                  className="w-full h-12 md:h-14 bg-primary text-white font-semibold text-base md:text-lg rounded-xl"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : step === 1 ? (
                    "Continue"
                  ) : (
                    "Complete Profile"
                  )}
                </Button>

                {/* Contact Us Button */}
                <div className="mt-4 text-center">
                  <Link
                    to="/contact-us"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    <span className="mr-2">📞</span>
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
