import { supabase } from "@/lib/supabase";
import { logError } from "@/utils/errorHandling";

/**
 * Uploads an attachment to a user-specific folder in the 'service-attachments' bucket.
 * This is the primary function for handling file uploads before creating database records.
 * It follows the security policy of storing files in a folder named after the user's ID.
 * It also constructs a clean, human-readable, and unique filename.
 *
 * @param {File|Blob|null} file The file object to upload. Can be null.
 * @param {string} userId The UUID of the user who is uploading the file.
 * @param {string} username The username of the active profile (for filename).
 * @param {number|string} serviceNumber The number of the service being requested (for filename).
 * @returns {Promise<object|null>} A promise that resolves with metadata for the database record, or null if no file was provided.
 * @throws {Error} Throws a user-friendly error if the upload fails for any reason.
 */
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

  try {
    // --- START OF FILENAME FIX ---
    const originalName = file.name || "attachment";
    const extension = originalName.split(".").pop()?.toLowerCase() || "dat";
    const baseName = originalName
      .substring(0, originalName.lastIndexOf("."))
      .replace(/[^a-zA-Z0-9-]/g, "_"); // Sanitize base name

    const now = new Date();
    const dateString = `${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

    const serviceNumberFormatted = String(serviceNumber || 0).padStart(3, "0");

    // Generate a short, 6-character random string for uniqueness
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);

    // Construct the final, clean, and unique filename
    const newFileName =
      `${username}_${baseName}_${dateString}_${serviceNumberFormatted}_${uniqueSuffix}.${extension}`.toLowerCase();
    // --- END OF FILENAME FIX ---

    // The secure file path remains the same: <user_id>/<filename>
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

    // Return all data needed for the `user_attachments` table
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
