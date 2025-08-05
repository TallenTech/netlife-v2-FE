import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import NetLifeLogo from '@/components/NetLifeLogo';
import { useToast } from '@/components/ui/use-toast';
import { useUserData } from '@/contexts/UserDataContext';
import FileUpload from '@/components/FileUpload';
import { calculateAge } from '@/lib/utils';

const ProfileSetup = ({ onBack, onContinue, authData, isNewDependent = false, onDependentCreate }) => {
  const { userData, updateUserData } = useUserData();
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState({
    username: '',
    birthDate: '',
    gender: '',
    district: '',
    subCounty: '',
    avatar: 'avatar-2',
    profilePhoto: null,
  });
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  const districts = [
    'Kampala', 'Wakiso', 'Mukono', 'Mpigi', 'Luwero', 'Mityana', 'Nakaseke',
    'Mubende', 'Kiboga', 'Kyankwanzi', 'Masaka', 'Kalangala', 'Rakai'
  ];

  const avatars = [
    'avatar-1', 'avatar-2', 'avatar-3', 'avatar-4',
    'avatar-5', 'avatar-6', 'avatar-7', 'avatar-8',
    'avatar-9', 'avatar-10', 'avatar-11', 'avatar-12'
  ];

  const getAvatarEmoji = (avatarId) => {
    const emojiMap = {
      'avatar-1': '👨🏻', 'avatar-2': '👩🏻', 'avatar-3': '👨🏽', 'avatar-4': '👩🏽',
      'avatar-5': '👨🏿', 'avatar-6': '👩🏿', 'avatar-7': '👦🏻', 'avatar-8': '👧🏽',
      'avatar-9': '👨🏿‍🦱', 'avatar-10': '👩🏿‍🦱', 'avatar-11': '👨🏽‍🦲', 'avatar-12': '👩🏿‍🦲'
    };
    return emojiMap[avatarId] || '👤';
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!profileData.username) newErrors.username = "Username is required.";
    if (!profileData.birthDate) {
      newErrors.birthDate = "Birth date is required.";
    } else {
      const age = calculateAge(profileData.birthDate);
      if (age < 15) {
        newErrors.birthDate = "You must be at least 15 years old to register.";
      }
      const year = new Date(profileData.birthDate).getFullYear();
      if (year < 1900 || year > new Date().getFullYear()) {
        newErrors.birthDate = "Please enter a valid birth year.";
      }
    }
    if (!profileData.gender) newErrors.gender = "Gender is required.";
    if (!profileData.district) newErrors.district = "District is required.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    if (isNewDependent) {
        const newId = `dep_${Date.now()}`;
        const newDependentProfile = {
            id: newId,
            ...profileData,
            phoneNumber: authData?.phoneNumber || '' // or a specific phone number for the dependent
        };
        const updatedDependents = [...(userData.dependents || []), newDependentProfile];
        updateUserData({ ...userData, dependents: updatedDependents });
        if(onDependentCreate) onDependentCreate(newId);
    } else {
        const completeProfile = {
            id: 'main',
            ...profileData,
            phoneNumber: authData?.phoneNumber || '',
            createdAt: Date.now()
        };
        localStorage.setItem('netlife_profile', JSON.stringify(completeProfile));
        if (onContinue) {
          onContinue(completeProfile);
        }
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      onBack();
    }
  };
  
  const onFileSelect = useCallback((file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, profilePhoto: reader.result, avatar: null }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const ErrorMessage = ({ field }) => {
    return errors[field] ? (
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-red-600 flex items-center gap-1 mt-1"
      >
        <AlertCircle size={14} /> {errors[field]}
      </motion.p>
    ) : null;
  }

  return (
    <div className="mobile-container bg-white">
      <div className="h-screen flex flex-col">
        {onBack && (
          <div className="flex items-center justify-between p-6 pt-12">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <NetLifeLogo className="w-12 h-12" />
          </div>
        )}

        <div className="px-6 mb-6 mt-12">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-gray-900">{isNewDependent ? "Add New Profile" : "Tell us about yourself"}</h1>
          </div>
          <Progress value={step === 1 ? 50 : 100} className="h-2" />
          <p className="text-gray-600 text-sm mt-2">Step {step} of 2</p>
        </div>

        <div className="flex-1 px-6 pb-6 overflow-y-auto">
          {step === 1 ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-gray-800 font-medium">Username</label>
                <Input
                  placeholder="Choose a username"
                  value={profileData.username}
                  onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                />
                <ErrorMessage field="username" />
              </div>

              <div className="space-y-2">
                <label className="text-gray-800 font-medium">Birth Date</label>
                <Input
                  type="date"
                  value={profileData.birthDate}
                  onChange={(e) => setProfileData(prev => ({ ...prev, birthDate: e.target.value }))}
                  max={new Date().toISOString().split("T")[0]}
                />
                <ErrorMessage field="birthDate" />
              </div>

              <div className="space-y-2">
                <label className="text-gray-800 font-medium">Gender</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Male', 'Female', 'Other'].map((gender) => (
                    <button
                      key={gender}
                      onClick={() => setProfileData(prev => ({ ...prev, gender }))}
                      className={`p-3 rounded-lg font-medium transition-all border-2 ${
                        profileData.gender === gender
                          ? 'bg-primary/10 text-primary border-primary'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent'
                      }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
                 <ErrorMessage field="gender" />
              </div>

              <div className="space-y-4">
                <label className="text-gray-800 font-medium flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-primary" />
                  Location
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={profileData.district}
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, district: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Sub County (Optional)"
                    value={profileData.subCounty}
                    onChange={(e) => setProfileData(prev => ({ ...prev, subCounty: e.target.value }))}
                  />
                </div>
                <ErrorMessage field="district" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Choose an Avatar or Upload a Photo</h2>
                <p className="text-gray-600">This will be the profile icon. You can change it later.</p>
              </div>

              <div className="avatar-grid">
                {avatars.map((avatarId) => (
                  <button
                    key={avatarId}
                    onClick={() => setProfileData(prev => ({ ...prev, avatar: avatarId, profilePhoto: null }))}
                    className="relative avatar-option"
                  >
                    {getAvatarEmoji(avatarId)}
                    {profileData.avatar === avatarId && (
                      <div className="absolute top-0 right-0 h-5 w-5 bg-primary rounded-full flex items-center justify-center text-white">
                        <Check size={12} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <FileUpload onFileSelect={onFileSelect} previewUrl={profileData.profilePhoto} />

            </motion.div>
          )}
        </div>

        <div className="p-6">
          <Button
            onClick={handleNext}
            className="w-full h-14 bg-primary text-white hover:bg-primary/90 font-semibold text-lg rounded-xl"
          >
            {step === 1 ? 'Continue' : isNewDependent ? 'Continue to Health Survey' : 'Complete Profile'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;