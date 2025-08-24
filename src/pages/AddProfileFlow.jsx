import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ProfileSetup from "@/components/ProfileSetup";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { profileService } from "@/services/profileService";


const AddProfileFlow = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, refreshAuthAndProfiles } = useAuth();
  const location = useLocation();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const editProfileId = searchParams.get("edit");

  const handleCreateOrUpdateDependent = async (
    dependentProfileData,
    photoFile
  ) => {
    if (!profile) {
      toast({
        title: "Error",
        description: "You must be logged in.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        manager_id: profile.id,
        username: dependentProfileData.username,
        date_of_birth: dependentProfileData.birthDate,
        gender: dependentProfileData.gender,
        profile_picture: photoFile ? null : dependentProfileData.avatar,
        updated_at: new Date().toISOString(),
      };

      let response;
      if (editProfileId) {
        response = await supabase
          .from("managed_profiles")
          .update(payload)
          .eq("id", editProfileId)
          .select()
          .single();
      } else {
        response = await supabase
          .from("managed_profiles")
          .insert(payload)
          .select()
          .single();
      }

      const { data, error } = response;

      if (error) {
        throw new Error(error.message);
      }



      if (photoFile && data.id) {
        const uploadResult = await profileService.uploadManagedProfilePhoto(
          photoFile,
          data.id
        );
        if (!uploadResult.success) {
          toast({
            title: "Profile saved, but photo upload failed.",
            description: uploadResult.error.message,
            variant: "destructive",
          });
        }
      }

      toast({
        title: `Profile ${editProfileId ? "Updated" : "Created"}!`,
        description: `${data.username}'s profile is now ready.`,
      });

      await refreshAuthAndProfiles();
      navigate("/account/manage-profiles");
    } catch (error) {
      toast({
        title: "Failed to save profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const existingData = location.state?.profileData;

  return (
    <ProfileSetup
      isNewDependent={true}
      onComplete={handleCreateOrUpdateDependent}
      onBack={() => navigate("/account/manage-profiles")}
      existingData={editProfileId ? existingData : null}
      isSubmitting={isSubmitting}
    />
  );
};

export default AddProfileFlow;
