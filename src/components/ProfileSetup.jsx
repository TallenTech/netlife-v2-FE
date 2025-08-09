import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, MapPin, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import NetLifeLogo from "@/components/NetLifeLogo";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import FileUpload from "@/components/FileUpload";
import { profileService } from "@/services/profileService";
import { Step1Details } from "@/components/profile/Step1Details";
import { Step2Avatar } from "@/components/profile/Step2Avatar";

const ProfileSetup = ({ onBack, onContinue }) => {
  const { user, refreshProfile } = useAuth();
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
    let isMounted = true;
    const loadDistricts = async () => {
      setLoadingDistricts(true);
      const result = await profileService.getDistricts();
      if (isMounted) {
        if (result.success) {
          setDistricts(result.data);
        } else {
          setDistricts([]);
          toast({
            title: "Could not load districts.",
            description: result.error?.message,
            variant: "destructive",
          });
        }
        setLoadingDistricts(false);
      }
    };
    loadDistricts();
    return () => {
      isMounted = false;
    };
  }, [toast]);

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

  const validateField = useCallback((name, value) => {
    let error = null;
    if (name === "fullName" && (!value || value.trim().length < 2))
      error = "Full name must be at least 2 characters.";
    if (name === "username" && (!value || value.length < 3))
      error = "Username must be at least 3 characters.";
    if (name === "birthDate" && !value) error = "Birth date is required.";
    if (name === "gender" && !value) error = "Gender is required.";
    if (name === "district" && !value) error = "District is required.";
    setErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  }, []);

  const checkUsername = useCallback(async (username) => {
    if (username.length < 3) return;
    setUsernameChecking(true);
    const result = await profileService.checkUsernameAvailability(username);
    setUsernameChecking(false);
    if (!result.available)
      setErrors((prev) => ({
        ...prev,
        username: result.error || "Username is not available.",
      }));
  }, []);

  const handleNext = () => {
    const isStep1Valid = [
      "fullName",
      "username",
      "birthDate",
      "gender",
      "district",
    ].every((field) => validateField(field, profileData[field]));
    if (step === 1 && isStep1Valid && !errors.username) {
      setStep(2);
    } else if (step === 2) {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!user || !user.phone) {
      toast({
        title: "Authentication Error",
        description: "Your phone number is missing. Please log in again.",
        variant: "destructive",
      });
      return navigate("/welcome/auth");
    }

    setIsSubmitting(true);

    // --- THIS IS THE FIX ---
    // We now ONLY use the phone number from the authenticated user object.
    // This is the single source of truth and is guaranteed to be correct.
    const phoneNumber = user.phone;
    // --- END OF FIX ---

    try {
      const profileResult = await profileService.upsertProfile(
        profileData,
        user.id,
        phoneNumber
      );
      if (!profileResult.success) throw profileResult.error;

      if (profilePhotoFile) {
        await profileService.uploadProfilePhoto(profilePhotoFile, user.id);
      }

      toast({ title: "Profile Created!", description: "Welcome to NetLife." });
      await refreshProfile();
      if (onContinue) onContinue(profileResult.data);
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
    if (step === 2) {
      setStep(1);
    } else {
      onBack();
    }
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
    <div className="mobile-container bg-white">
      <div className="h-screen flex flex-col">
        <div className="flex items-center justify-between p-6 pt-12">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <NetLifeLogo className="w-12 h-12" />
        </div>
        <div className="px-6 mb-6 mt-12">
          <h1 className="text-xl font-bold text-gray-900">
            Tell us about yourself
          </h1>
          <Progress value={step * 50} className="h-2 mt-2" />
          <p className="text-gray-600 text-sm mt-2">Step {step} of 2</p>
        </div>
        <div className="flex-1 px-6 pb-6 overflow-y-auto no-scrollbar">
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
        <div className="p-6">
          <Button
            onClick={handleNext}
            disabled={isSubmitting || usernameChecking}
            className="w-full h-14 bg-primary text-white font-semibold text-lg rounded-xl"
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
  );
};

export default ProfileSetup;
