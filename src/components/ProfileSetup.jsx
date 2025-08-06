import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import NetLifeLogo from '@/components/NetLifeLogo';
import { useToast } from '@/components/ui/use-toast';
import { useUserData } from '@/contexts/UserDataContext';
import { useAuth } from '@/contexts/AuthContext';
import FileUpload from '@/components/FileUpload';
import { calculateAge } from '@/lib/utils';
import { profileService } from '@/services/profileService';

const ProfileSetup = ({ onBack, onContinue, authData, isNewDependent = false, onDependentCreate }) => {
  const { userData, updateUserData } = useUserData();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState({
    fullName: '',
    username: '',
    birthDate: '',
    gender: '',
    district: '',
    subCounty: '',
    avatar: 'avatar-2',
    profilePhoto: null,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [subCounties, setSubCounties] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [loadingSubCounties, setLoadingSubCounties] = useState(false);
  const { toast } = useToast();

  // Load districts on component mount
  useEffect(() => {
    const loadDistricts = async () => {
      setLoadingDistricts(true);
      const result = await profileService.getDistricts();
      if (result.success) {
        setDistricts(result.data);
      } else {
        // Use fallback districts from the service
        setDistricts(result.data || []);
        toast({
          title: "Districts Loading",
          description: "Using offline district list. Some districts may not be available.",
          variant: "default",
        });
      }
      setLoadingDistricts(false);
    };

    loadDistricts();
  }, [toast]);

  // Load sub counties when district changes
  useEffect(() => {
    const loadSubCounties = async () => {
      if (!profileData.district) {
        setSubCounties([]);
        return;
      }

      // Find district ID from selected district name
      const selectedDistrict = districts.find(d => d.name === profileData.district);
      if (!selectedDistrict) return;

      setLoadingSubCounties(true);
      const result = await profileService.getSubCounties(selectedDistrict.id);
      if (result.success) {
        setSubCounties(result.data);
      } else {
        setSubCounties([]);
      }
      setLoadingSubCounties(false);
    };

    loadSubCounties();
  }, [profileData.district, districts]);

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

  // Real-time field validation functions
  const validateFullName = useCallback((fullName) => {
    if (!fullName || fullName.trim().length < 2) {
      setErrors(prev => ({ ...prev, fullName: 'Full name must be at least 2 characters long' }));
    } else {
      setErrors(prev => ({ ...prev, fullName: null }));
    }
  }, []);

  const validateBirthDate = useCallback((birthDate) => {
    if (!birthDate) {
      setErrors(prev => ({ ...prev, birthDate: 'Birth date is required' }));
    } else {
      const birthDateObj = new Date(birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDateObj.getFullYear();
      
      if (birthDateObj > today) {
        setErrors(prev => ({ ...prev, birthDate: 'Birth date cannot be in the future' }));
      } else if (age < 15) {
        setErrors(prev => ({ ...prev, birthDate: 'You must be at least 15 years old to register' }));
      } else if (age > 120) {
        setErrors(prev => ({ ...prev, birthDate: 'Please enter a valid birth date' }));
      } else {
        setErrors(prev => ({ ...prev, birthDate: null }));
      }
    }
  }, []);

  const validateGender = useCallback((gender) => {
    if (!gender) {
      setErrors(prev => ({ ...prev, gender: 'Gender is required' }));
    } else {
      setErrors(prev => ({ ...prev, gender: null }));
    }
  }, []);

  const validateDistrict = useCallback((district) => {
    if (!district) {
      setErrors(prev => ({ ...prev, district: 'District is required' }));
    } else {
      setErrors(prev => ({ ...prev, district: null }));
    }
  }, []);

  // Real-time username validation with debouncing
  const checkUsername = useCallback(async (username) => {
    if (!username) {
      setErrors(prev => ({ ...prev, username: 'Username is required' }));
      return;
    }
    
    if (username.length < 3 || username.length > 30) {
      setErrors(prev => ({ ...prev, username: 'Username must be 3-30 characters long' }));
      return;
    }

    const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validUsernameRegex.test(username)) {
      setErrors(prev => ({ ...prev, username: 'Username can only contain letters, numbers, underscore, or hyphen' }));
      return;
    }
    
    setUsernameChecking(true);
    const result = await profileService.checkUsernameAvailability(username);
    setUsernameChecking(false);
    
    if (!result.available) {
      setErrors(prev => ({ 
        ...prev, 
        username: result.error || 'Username is not available. Please choose another.' 
      }));
    } else {
      setErrors(prev => ({ ...prev, username: null }));
    }
  }, []);

  // Real-time validation effects
  useEffect(() => {
    if (profileData.fullName) {
      validateFullName(profileData.fullName);
    }
  }, [profileData.fullName, validateFullName]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (profileData.username) {
        checkUsername(profileData.username);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [profileData.username, checkUsername]);

  useEffect(() => {
    if (profileData.birthDate) {
      validateBirthDate(profileData.birthDate);
    }
  }, [profileData.birthDate, validateBirthDate]);

  useEffect(() => {
    if (profileData.gender) {
      validateGender(profileData.gender);
    }
  }, [profileData.gender, validateGender]);

  useEffect(() => {
    if (profileData.district) {
      validateDistrict(profileData.district);
    }
  }, [profileData.district, validateDistrict]);

  const validateStep1 = () => {
    const validation = profileService.validateProfileData(profileData);
    setErrors(validation.errors);
    return validation.isValid;
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

  const handleComplete = async () => {
    if (isNewDependent) {
      // Handle dependent creation (keep existing logic for now)
      const newId = `dep_${Date.now()}`;
      const newDependentProfile = {
        id: newId,
        ...profileData,
        phoneNumber: authData?.phoneNumber || ''
      };
      const updatedDependents = [...(userData.dependents || []), newDependentProfile];
      updateUserData({ ...userData, dependents: updatedDependents });
      if(onDependentCreate) onDependentCreate(newId);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get user token from auth context
      const userToken = user?.access_token || authData?.access_token;
      
      if (!userToken) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Upload profile photo if provided
      let profilePhotoUrl = null;
      if (profileData.profilePhoto && user?.id) {
        // Convert data URL to File object for upload
        const response = await fetch(profileData.profilePhoto);
        const blob = await response.blob();
        const file = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });
        
        const photoResult = await profileService.uploadProfilePhoto(file, user.id);
        if (photoResult.success) {
          profilePhotoUrl = photoResult.url;
        } else {
          // Don't fail the entire process if photo upload fails
          toast({
            title: "Photo Upload Warning",
            description: "Profile photo couldn't be uploaded, but your profile will still be created.",
            variant: "default",
          });
        }
      }

      // Complete profile via API
      const profileResult = await profileService.completeProfile({
        ...profileData,
        profilePhotoUrl
      }, userToken);
      
      if (!profileResult.success) {
        throw new Error(profileService.formatErrorMessage(profileResult.error));
      }

      // Success - show confirmation and proceed
      toast({
        title: "Profile Created Successfully",
        description: "Your profile has been saved securely.",
      });

      // Store profile data locally for immediate use
      const completeProfile = {
        id: profileResult.data.id,
        ...profileResult.data,
        phoneNumber: authData?.phoneNumber || '',
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('netlife_profile', JSON.stringify(completeProfile));

      if (onContinue) {
        onContinue(completeProfile);
      }
      
    } catch (error) {
      console.error('Profile creation error:', error);
      
      toast({
        title: "Profile Creation Failed",
        description: error.message,
        variant: "destructive",
      });

      // Fallback to localStorage for offline support
      const fallbackProfile = {
        id: 'main',
        ...profileData,
        phoneNumber: authData?.phoneNumber || '',
        createdAt: Date.now(),
        needsSync: true // Flag for later synchronization
      };
      
      localStorage.setItem('netlife_profile_backup', JSON.stringify(fallbackProfile));
      
      toast({
        title: "Saved Offline",
        description: "Your profile has been saved locally and will sync when connection is restored.",
        variant: "default",
      });

      if (onContinue) {
        onContinue(fallbackProfile);
      }
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
                <label className="text-gray-800 font-medium">Full Name</label>
                <Input
                  placeholder="Enter your full name"
                  value={profileData.fullName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setProfileData(prev => ({ ...prev, fullName: value }));
                    // Clear error immediately when user starts typing
                    if (errors.fullName && value.trim().length >= 2) {
                      setErrors(prev => ({ ...prev, fullName: null }));
                    }
                  }}
                  onBlur={() => validateFullName(profileData.fullName)}
                />
                <ErrorMessage field="fullName" />
              </div>

              <div className="space-y-2">
                <label className="text-gray-800 font-medium">Username</label>
                <div className="relative">
                  <Input
                    placeholder="Choose a username"
                    value={profileData.username}
                    onChange={(e) => {
                      const value = e.target.value;
                      setProfileData(prev => ({ ...prev, username: value }));
                      // Clear error immediately when user starts typing valid characters
                      if (errors.username && value.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(value)) {
                        setErrors(prev => ({ ...prev, username: null }));
                      }
                    }}
                    onBlur={() => {
                      if (profileData.username) {
                        checkUsername(profileData.username);
                      }
                    }}
                  />
                  {usernameChecking && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                <ErrorMessage field="username" />
              </div>

              <div className="space-y-2">
                <label className="text-gray-800 font-medium">Birth Date</label>
                <Input
                  type="date"
                  value={profileData.birthDate}
                  onChange={(e) => {
                    const value = e.target.value;
                    setProfileData(prev => ({ ...prev, birthDate: value }));
                    // Clear error immediately when user selects a valid date
                    if (errors.birthDate && value) {
                      const birthDateObj = new Date(value);
                      const today = new Date();
                      const age = today.getFullYear() - birthDateObj.getFullYear();
                      if (birthDateObj <= today && age >= 15 && age <= 120) {
                        setErrors(prev => ({ ...prev, birthDate: null }));
                      }
                    }
                  }}
                  onBlur={() => validateBirthDate(profileData.birthDate)}
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
                      onClick={() => {
                        setProfileData(prev => ({ ...prev, gender }));
                        // Clear error immediately when user selects gender
                        if (errors.gender) {
                          setErrors(prev => ({ ...prev, gender: null }));
                        }
                      }}
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
                    onValueChange={(value) => {
                      setProfileData(prev => ({ ...prev, district: value, subCounty: '' }));
                      // Clear error immediately when user selects district
                      if (errors.district && value) {
                        setErrors(prev => ({ ...prev, district: null }));
                      }
                    }}
                    disabled={loadingDistricts}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingDistricts ? "Loading districts..." : "Select District"} />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem key={district.id} value={district.name}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={profileData.subCounty}
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, subCounty: value }))}
                    disabled={!profileData.district || loadingSubCounties}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !profileData.district 
                          ? "Select district first" 
                          : loadingSubCounties 
                            ? "Loading..." 
                            : "Sub County (Optional)"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {subCounties.map((subCounty) => (
                        <SelectItem key={subCounty.id} value={subCounty.name}>
                          {subCounty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
            disabled={isSubmitting || (step === 1 && usernameChecking)}
            className="w-full h-14 bg-primary text-white hover:bg-primary/90 font-semibold text-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Profile...
              </div>
            ) : (
              step === 1 ? 'Continue' : isNewDependent ? 'Continue to Health Survey' : 'Complete Profile'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;