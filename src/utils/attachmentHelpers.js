import { supabase } from "@/lib/supabase";
import { logError } from "@/utils/errorHandling";

/**
 * Processes and uploads a single file to a PRIVATE Supabase Storage bucket
 * using a secure signed upload URL.
 * @param {File|Blob} file - The file to upload.
 * @param {string} patientUsername - The username of the patient for the filename.
 * @param {number} serviceNumber - The 3-digit number of the service for the filename.
 * @returns {Promise<string|null>} The PERMANENT file PATH, or null if it fails.
 */
export async function processAndUploadAttachment(
  file,
  patientUsername,
  serviceNumber
) {
  if (!file || !(file instanceof File || file instanceof Blob)) {
    return null;
  }

  try {
    // --- 1. Construct the permanent file path ---
    const originalName = file.name || "attachment";
    const extension = originalName.split(".").pop()?.toLowerCase() || "dat";
    const baseName = originalName
      .substring(0, originalName.lastIndexOf("."))
      .replace(/[^a-zA-Z0-9-]/g, "_");

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateString = `${year}${month}${day}`;

    const serviceNumberFormatted = String(serviceNumber || 0).padStart(3, "0");

    const newFileName = `${patientUsername}_${baseName}_${dateString}_${serviceNumberFormatted}.${extension}`;
    const filePath = `user-attachments/${newFileName}`;

    // --- 2. Get a secure, signed URL from Supabase to upload TO ---
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from("attachments")
        .createSignedUploadUrl(filePath);

    if (signedUrlError) {
      logError(
        signedUrlError,
        "processAndUploadAttachment.createSignedUploadUrl"
      );
      return null;
    }

    const { signedUrl } = signedUrlData;

    // --- 3. Upload the file directly to the signed URL using fetch ---
    const uploadResponse = await fetch(signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadResponse.ok) {
      const errorBody = await uploadResponse.text();
      throw new Error(
        `File upload failed with status ${uploadResponse.status}: ${errorBody}`
      );
    }

    // --- 4. Return the permanent path of the file, NOT the temporary signed URL ---
    return filePath;
  } catch (error) {
    logError(error, "processAndUploadAttachment", { fileName: file.name });
    return null;
  }
}
