import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogOut, Heart, ChevronsRight, Users, FolderOpen } from "lucide-react";
import { getAvatarEmoji } from "@/lib/utils";
import { DateOfBirthPicker } from "@/components/ui/DateOfBirthPicker";
import { ProfilePictureEditor } from "@/components/profile/ProfilePictureEditor";
import { profileService } from "@/services/profileService";
import { useDistricts } from "@/hooks/useSettingsQueries";
import { PhoneNumberManager } from "@/components/account/PhoneNumberManager";

export const ProfileTab = ({
  activeProfile,
  isMainProfile,
  user,
  updateProfile,
  refreshAuthAndProfiles,
  logout,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    username: "",
    date_of_birth: "",
    gender: "",
    profile_picture: null,
  });

  const [district, setDistrict] = useState("");
  const [subCounty, setSubCounty] = useState("");
  const [isEditingPicture, setIsEditingPicture] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const { data: districts, isLoading: loadingDistricts } = useDistricts();

  useEffect(() => {
    if (activeProfile) {
      setProfileData({
        username: activeProfile.username || "",
        date_of_birth: activeProfile.date_of_birth || "",
        gender: activeProfile.gender || "",
        profile_picture: activeProfile.profile_picture || null,
      });
      if (isMainProfile) {
        setDistrict(activeProfile.district || "");
        setSubCounty(activeProfile.sub_county || "");
      }
    }
  }, [activeProfile, isMainProfile]);

  const handleProfileSave = async () => {
    try {
      const dataToUpdate = { ...profileData };
      if (isMainProfile) {
        dataToUpdate.district = district;
        dataToUpdate.sub_county = subCounty;
      }
      await updateProfile(dataToUpdate);
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message || "Could not save your profile.",
        variant: "destructive",
      });
    }
  };

  const handleProfilePictureChange = async (file) => {
    setIsEditingPicture(false);
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const uploadResult = isMainProfile
        ? await profileService.uploadProfilePhoto(file, activeProfile.id)
        : await profileService.uploadManagedProfilePhoto(
            file,
            activeProfile.id
          );

      if (!uploadResult.success)
        throw new Error(
          uploadResult.error?.message || "Failed to upload photo"
        );

      if (uploadResult.data?.url) {
        setProfileData((prev) => ({
          ...prev,
          profile_picture: uploadResult.data.url,
        }));
      }
      await refreshAuthAndProfiles();
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload your profile picture.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleAvatarSelect = async (avatarId) => {
    try {
      setIsUploadingPhoto(true);
      setProfileData((prev) => ({ ...prev, profile_picture: avatarId }));
      await updateProfile({ profile_picture: avatarId });
      await refreshAuthAndProfiles();
      setIsEditingPicture(false);
      toast({
        title: "Avatar Updated",
        description: `Your avatar has been updated to ${getAvatarEmoji(
          avatarId
        )}.`,
      });
    } catch (error) {
      setProfileData((prev) => ({
        ...prev,
        profile_picture: activeProfile?.profile_picture || null,
      }));
      toast({
        title: "Update Failed",
        description: error.message || "Could not update your avatar.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (isUploadingPhoto) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Uploading your profile picture...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-4 md:p-6 rounded-2xl border mb-6">
        <div className="flex flex-col items-center text-center space-y-4 mb-6">
          <ProfilePictureEditor
            currentPicture={profileData.profile_picture}
            username={profileData.username}
            onPictureChange={handleProfilePictureChange}
            onAvatarSelect={handleAvatarSelect}
            isEditing={isEditingPicture}
            onToggleEdit={() => setIsEditingPicture(!isEditingPicture)}
            isUploading={isUploadingPhoto}
            className="mb-6"
          />
          <div>
            <h2 className="text-lg font-bold">Personal Information</h2>
            <p className="text-sm text-gray-500">
              View and update your profile
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Username
            </label>
            <Input
              value={profileData.username}
              onChange={(e) =>
                setProfileData({ ...profileData, username: e.target.value })
              }
            />
          </div>

          {isMainProfile ? (
            <PhoneNumberManager
              user={user}
              refreshAuthAndProfiles={refreshAuthAndProfiles}
            />
          ) : (
            <div className="p-3 border rounded-lg text-center text-sm text-gray-600 bg-gray-50">
              Phone number can only be changed for the main account holder.
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">
              Date of Birth
            </label>
            <DateOfBirthPicker
              value={profileData.date_of_birth}
              onChange={(date) =>
                setProfileData((p) => ({ ...p, date_of_birth: date }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Gender</label>
            <Select
              value={profileData.gender}
              onValueChange={(value) =>
                setProfileData({ ...profileData, gender: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
                <SelectItem value="Prefer not to say">
                  Prefer not to say
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isMainProfile && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  District
                </label>
                <Select
                  value={district}
                  onValueChange={setDistrict}
                  disabled={loadingDistricts}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingDistricts ? "Loading..." : "Select District"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(districts || []).map((d) => (
                      <SelectItem key={d.id} value={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Sub County
                </label>
                <Input
                  placeholder="e.g. Kawempe"
                  value={subCounty}
                  onChange={(e) => setSubCounty(e.target.value)}
                />
              </div>
            </div>
          )}
          <Button onClick={handleProfileSave} className="w-full">
            Save Profile Changes
          </Button>
        </div>
      </div>
      <div className="bg-white p-4 rounded-2xl border mb-6 space-y-2">
        <button
          onClick={() => navigate("/account/manage-profiles")}
          className="flex items-center w-full text-left space-x-4 p-3 rounded-lg hover:bg-gray-50"
        >
          <Users className="text-primary" size={20} />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">
              Manage & Switch Profiles
            </h3>
            <p className="text-sm text-gray-500">
              Currently browsing as:{" "}
              <span className="font-bold">{activeProfile?.username}</span>
            </p>
          </div>
          <ChevronsRight className="text-gray-400" size={16} />
        </button>
        <div className="border-t"></div>
        <button
          onClick={() => navigate("/account/health-interests")}
          className="flex items-center w-full text-left space-x-4 p-3 rounded-lg hover:bg-gray-50"
        >
          <Heart className="text-primary" size={20} />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">Health Interests</h3>
            <p className="text-sm text-gray-500">
              Tailor content to your preferences
            </p>
          </div>
          <ChevronsRight className="text-gray-400" size={16} />
        </button>
        <div className="border-t"></div>
        <button
          onClick={() => navigate("/my-files")}
          className="flex items-center w-full text-left space-x-4 p-3 rounded-lg hover:bg-gray-50"
        >
          <FolderOpen className="text-primary" size={20} />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">My Files</h3>
            <p className="text-sm text-gray-500">
              Store and manage your documents
            </p>
          </div>
          <ChevronsRight className="text-gray-400" size={16} />
        </button>
      </div>
      <Button
        onClick={logout}
        variant="ghost"
        className="w-full flex items-center space-x-2 text-red-500 hover:text-red-600 hover:bg-red-50"
      >
        <LogOut size={16} />
        <span>Logout</span>
      </Button>
    </>
  );
};
