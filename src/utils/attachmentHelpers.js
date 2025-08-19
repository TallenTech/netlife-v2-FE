import { supabase } from "@/lib/supabase";
import { logError } from "@/utils/errorHandling";

const capitalize = (s) => {
  if (typeof s !== 'string' || s.length === 0) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

const formatServiceSlugForFilename = (slug) => {
    if (!slug) return 'General';
    if (slug === 'sti-screening') return 'STI-Screening';
    if (slug === 'counselling-services') return 'Counselling-Services';
    return slug.toUpperCase();
};

export async function uploadServiceAttachment(
  file,
  userId,
  username,
  serviceNumber,
  serviceSlug
) {
  if (!file || !(file instanceof File || file instanceof Blob)) {
    return null;
  }

  if (!userId || !username) {
    logError(
      new Error("Missing userId or username for upload"),
      "uploadServiceAttachment.precondition"
    );
    throw new Error("Cannot upload file: User information is missing.");
  }

  try {
    const extension = file.name ? file.name.split(".").pop()?.toLowerCase() : "dat";
    const capitalizedUsername = capitalize(username);
    const formattedSlug = formatServiceSlugForFilename(serviceSlug);
    
    const now = new Date();
    const dateString = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const serviceNumberFormatted = String(serviceNumber || 0).padStart(3, "0");
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);

    const newFileName =
      `${capitalizedUsername}_${formattedSlug}_Report_${dateString}_${serviceNumberFormatted}_${uniqueSuffix}.${extension}`;
      
    const filePath = `${userId}/${newFileName}`;

    const { data, error } = await supabase.storage
      .from("service-attachments")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (error) {
      logError(error, "uploadServiceAttachment.supabaseUpload", { userId, filePath });
      throw error;
    }
    
    return {
      file_path: data.path,
      original_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    };
  } catch (error) {
    logError(error, "uploadServiceAttachment.catchAll", { userId, fileName: file?.name });
    throw new Error(`Failed to process the attachment. Reason: ${error.message}`);
  }
}