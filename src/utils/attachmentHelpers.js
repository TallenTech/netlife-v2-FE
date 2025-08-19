import { supabase } from "@/lib/supabase";
import { logError } from "@/utils/errorHandling";

export async function uploadServiceAttachment(
  file,
  userId,
  username,
  serviceNumber
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

  const capitalize = (s) => {
    if (typeof s !== 'string' || s.length === 0) return '';
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  };

  try {
    const originalName = file.name || "attachment";
    const extension = originalName.split(".").pop()?.toLowerCase() || "dat";
    const rawBaseName = originalName
      .substring(0, originalName.lastIndexOf("."))
      .replace(/[^a-zA-Z0-9-]/g, "_");

    const capitalizedUsername = capitalize(username);
    const capitalizedBaseName = rawBaseName.split('_').map(capitalize).join('_');

    const now = new Date();
    const dateString = `${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

    const serviceNumberFormatted = String(serviceNumber || 0).padStart(3, "0");

    const uniqueSuffix = Math.random().toString(36).substring(2, 8);

    const newFileName =
      `${capitalizedUsername}_${capitalizedBaseName}_${dateString}_${serviceNumberFormatted}_${uniqueSuffix}.${extension}`;
      
    const filePath = `${userId}/${newFileName}`;

    const { data, error } = await supabase.storage
      .from("service-attachments")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      logError(error, "uploadServiceAttachment.supabaseUpload", {
        userId,
        filePath,
      });
      throw error;
    }
    return {
      file_path: data.path,
      original_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    };
  } catch (error) {
    logError(error, "uploadServiceAttachment.catchAll", {
      userId,
      fileName: file?.name,
    });
    throw new Error(
      `Failed to process the attachment. Please try again. Reason: ${error.message}`
    );
  }
}