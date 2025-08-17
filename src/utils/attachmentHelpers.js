import { supabase } from "@/lib/supabase";
import { logError } from "@/utils/errorHandling";

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
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateString = `${year}${month}${day}`;

    const serviceNumberFormatted = String(serviceNumber || 0).padStart(3, "0");

    const newFileName =
      `${patientUsername}_${baseName}_${dateString}_${serviceNumberFormatted}.${extension}`.toLowerCase();
    const filePath = `user-attachments/${newFileName}`;

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

    return filePath;
  } catch (error) {
    logError(error, "processAndUploadAttachment", { fileName: file.name });
    return null;
  }
}
