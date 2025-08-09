import { supabase } from "@/lib/supabase";

const formatError = (error, message) => {
  console.error(message, error);
  return { success: false, error: { message: error.message || message } };
};

const formatSuccess = (data) => ({ success: true, data });

async function upsertProfile(profileData, userId, phoneNumber) {
  try {
    const profilePayload = {
      id: userId,
      full_name: profileData.fullName,
      username: profileData.username,
      date_of_birth: profileData.birthDate,
      gender: profileData.gender,
      district: profileData.district,
      sub_county: profileData.subCounty,
      profile_picture: profileData.avatar,
      whatsapp_number: phoneNumber,
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
      .from("profile-pictures")
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("profile-pictures")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ profile_picture: data.publicUrl })
      .eq("id", userId);
    if (updateError) throw updateError;

    return formatSuccess({ url: data.publicUrl });
  } catch (error) {
    return formatError(error, "Failed to upload profile photo.");
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
    const fallbackDistricts = [{ id: 1, name: "Kampala", region: "Central" }];
    return formatError(error, fallbackDistricts);
  }
}

async function getSubCounties(districtId) {
  try {
    const { data, error } = await supabase
      .from("sub_counties")
      .select("id, name")
      .eq("district_id", districtId);
    if (error) throw error;
    return formatSuccess(data);
  } catch (error) {
    return formatError(error, []);
  }
}

async function checkUsernameAvailability(username) {
  try {
    const { data, error } = await supabase.rpc("check_username_availability", {
      username_to_check: username,
    });
    if (error) throw error;
    return { available: data };
  } catch (error) {
    return { available: false, error: "Could not check username." };
  }
}

export const profileService = {
  upsertProfile,
  uploadProfilePhoto,
  getDistricts,
  getSubCounties,
  checkUsernameAvailability,
};
