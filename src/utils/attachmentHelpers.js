import { supabase } from "@/lib/supabase";
import { logError } from "@/utils/errorHandling";

export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

export async function processAndUploadAttachment(
  file,
  patientUsername,
  serviceNumber
) {
  if (!file || !(file instanceof File || file instanceof Blob)) {
    return null;
  }

  try {
    const originalName = file.name || "attachment";
    const extension = originalName.split(".").pop()?.toLowerCase() || "dat";
    const baseName = originalName
      .substring(0, originalName.lastIndexOf("."))
      .replace(/[^a-zA-Z0-9-]/g, "_");

    const now = new Date();
    const dateString = `${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const serviceNumberFormatted = String(serviceNumber || 0).padStart(3, "0");

    const newFileName =
      `${patientUsername}_${baseName}_${dateString}_${serviceNumberFormatted}.${extension}`.toLowerCase();

    const filePath = `user-attachments/${newFileName}`;

    console.log("Attempting to upload file to:", filePath);
    const { data, error } = await supabase.storage
      .from("attachments")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      logError(error, "processAndUploadAttachment.supabaseUpload");
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    console.log("File uploaded successfully, path:", data.path);

    return data.path;
  } catch (error) {
    logError(error, "processAndUploadAttachment", { fileName: file?.name });
    throw error;
  }
}
