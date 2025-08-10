import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ProfileSetup from "@/components/ProfileSetup";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

/**
 * AddProfileFlow is used to add a new DEPENDENT or MANAGED profile
 * to the currently logged-in user's account.
 */
const AddProfileFlow = () => {
    const [step, setStep] = useState('profile');
    const [newProfileId, setNewProfileId] = useState(null);
    const userDataContext = useUserData();
  const { switchProfile } = userDataContext || {};
    const navigate = useNavigate();
    const { toast } = useToast();
    const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const editProfileId = searchParams.get("edit");

  /**
   * This function is called by ProfileSetup when the form is submitted.
   * It saves the new dependent profile to the 'managed_profiles' table.
   * @param {object} dependentProfileData - The form data from ProfileSetup.
   */
  const handleCreateOrUpdateDependent = async (dependentProfileData) => {
    if (!profile) {
      toast({
        title: "Error",
        description: "You must be logged in.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      manager_id: profile.id,
      username: dependentProfileData.username,
      date_of_birth: dependentProfileData.birthDate,
      gender: dependentProfileData.gender,
      profile_picture: dependentProfileData.avatar,
      updated_at: new Date().toISOString(),
    };

    let response;
    if (editProfileId) {
      // Update an existing managed profile
      response = await supabase
        .from("managed_profiles")
        .update(payload)
        .eq("id", editProfileId)
        .select()
        .single();
    } else {
      // Insert a new managed profile
      response = await supabase
        .from("managed_profiles")
        .insert(payload)
        .select()
        .single();
    }

    const { data, error } = response;

    if (error) {
      toast({
        title: "Failed to save profile",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: `Profile ${editProfileId ? "Updated" : "Created"}!`,
        description: `${data.username}'s profile is now ready.`,
      });
      await fetchManagedProfiles();
      navigate("/account/manage-profiles");
    }
  };

  const existingData = location.state?.profileData;

  return (
    <ProfileSetup
      isNewDependent={true}
      onComplete={handleCreateOrUpdateDependent}
      onBack={() => navigate("/account/manage-profiles")}
      existingData={editProfileId ? existingData : null}
    />
  );
};

export default AddProfileFlow;
