import { supabase } from "@/lib/supabase";

const formatError = (error, message) => {
  console.error(message, error);
  return { success: false, error: { message: error.message || message } };
};

const formatSuccess = (data) => ({ success: true, data });

async function getUserData() {
  try {
    const { data, error } = await supabase.rpc("get_user_data_with_dependents");
    if (error) throw error;
    return formatSuccess(data);
  } catch (error) {
    return formatError(error, "Failed to fetch user data.");
  }
}

async function upsertProfile(profileData, userId, phoneNumber) {
  try {
    const profilePayload = {
      id: userId,
      username: profileData.username,
      date_of_birth: profileData.birthDate,
      gender: profileData.gender,
      district: profileData.district,
      sub_county: profileData.subCounty,
      profile_picture: profileData.profile_picture || profileData.avatar || null, // Support both profile_picture and avatar fields
      ...(phoneNumber && { whatsapp_number: phoneNumber }),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(profilePayload)
      .select()
      .single();
    if (error) throw error;
    return formatSuccess(data);
  } catch (error) {
    return formatError(error, "Failed to save profile.");
  }
}

async function uploadProfilePhoto(file, userId) {
  try {
    if (!file) return formatSuccess(null);

    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ profile_picture: data.publicUrl })
      .eq("id", userId);

    if (updateError) {
      throw updateError;
    }

    return formatSuccess({ url: data.publicUrl });
  } catch (error) {
    return formatError(error, `Failed to upload profile photo: ${error.message}`);
  }
}

async function uploadManagedProfilePhoto(file, managedProfileId) {
  try {
    if (!file) return formatSuccess(null);

    const fileExt = file.name.split(".").pop();
    const filePath = `managed-profiles/${managedProfileId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("managed_profiles")
      .update({ profile_picture: data.publicUrl })
      .eq("id", managedProfileId);

    if (updateError) {
      throw updateError;
    }

    return formatSuccess({ url: data.publicUrl });
  } catch (error) {
    return formatError(error, `Failed to upload managed profile photo: ${error.message}`);
  }
}

async function updateManagedProfile(profileId, profileData) {
  try {
    const { data, error } = await supabase
      .from("managed_profiles")
      .update({
        username: profileData.username,
        date_of_birth: profileData.date_of_birth,
        gender: profileData.gender,
        profile_picture: profileData.profile_picture,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId)
      .select()
      .single();

    if (error) throw error;
    return formatSuccess(data);
  } catch (error) {
    return formatError(error, "Failed to update managed profile.");
  }
}

async function updateMainProfile(userId, profileData) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        username: profileData.username,
        date_of_birth: profileData.date_of_birth,
        gender: profileData.gender,
        district: profileData.district,
        sub_county: profileData.sub_county,
        profile_picture: profileData.profile_picture,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return formatSuccess(data);
  } catch (error) {
    return formatError(error, "Failed to update main profile.");
  }
}

async function getDistricts() {
  try {
    const { data, error } = await supabase
      .from("districts")
      .select("id, name, region");
    if (error) throw error;
    return formatSuccess(data);
  } catch (error) {
    console.error("Failed to fetch districts:", error);
    return formatError(error, "Failed to fetch districts.");
  }
}

async function checkUsernameAvailability(username, profileIdToExclude = null) {
  try {
    const { data, error } = await supabase.rpc("check_username_availability", {
      username_to_check: username,
      profile_id_to_exclude: profileIdToExclude,
    });
    if (error) throw error;
    return { available: data };
  } catch (error) {
    console.error("Could not check username:", error);
    return { available: false, error: "Could not check username." };
  }
}

async function updatePhoneNumber(phone) {
  try {
    const { data, error } = await supabase.auth.updateUser(
      { phone },
      { channel: "whatsapp" }
    );
    if (error) throw error;
    return formatSuccess(data);
  } catch (error) {
    return formatError(
      error,
      "Failed to initiate phone number update via WhatsApp."
    );
  }
}

async function verifyPhoneUpdate(phone, token) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "phone_change",
    });
    if (error) throw error;
    return formatSuccess(data);
  } catch (error) {
    return formatError(error, "Invalid OTP or request expired.");
  }
}

export const profileService = {
  upsertProfile,
  uploadProfilePhoto,
  uploadManagedProfilePhoto,
  updateManagedProfile,
  updateMainProfile,
  getDistricts,
  checkUsernameAvailability,
  updatePhoneNumber,
  verifyPhoneUpdate,
  getUserData,
};
