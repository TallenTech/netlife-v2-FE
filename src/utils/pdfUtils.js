import { supabase } from "@/lib/supabase";
import { logError } from "@/utils/errorHandling";

/**
 * Downloads the official generated PDF for a service request from Supabase Storage.
 * This is the single source of truth for all PDF downloads.
 * @param {object} serviceRequest The full service request object, which must include the `generated_pdfs` array.
 * @returns {Promise<{success: boolean, error?: string}>} An object indicating success or failure.
 */
export async function downloadGeneratedPdf(serviceRequest) {
  // Find the first PDF record associated with the request.
  const pdfRecord = serviceRequest?.generated_pdfs?.[0];

  // Check if a PDF record exists and has a file path.
  if (!pdfRecord || !pdfRecord.file_path) {
    const message =
      "A downloadable PDF summary is not yet available for this record.";
    console.warn(message, { serviceRequest });
    return { success: false, error: message };
  }

  try {
    const { data: blob, error } = await supabase.storage
      .from("generated-service-pdfs")
      .download(pdfRecord.file_path);

    if (error) throw error;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = pdfRecord.file_name || "service-request.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    logError(error, "downloadGeneratedPdf", { path: pdfRecord.file_path });
    const message =
      "Could not fetch the PDF. Please check your permissions or try again.";
      console.log("message:" message);
    return { success: false, error: message };
  }
}
