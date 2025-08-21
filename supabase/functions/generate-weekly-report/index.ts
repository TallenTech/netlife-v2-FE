import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { generatePdf } from "./pdf.ts";
import { sendReportEmail } from "./email.ts";
import { ASSETS_BUCKET_NAME, LOGO_PATH } from "./constants.ts";

serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response("Unauthorized: Invalid credentials", { status: 401 });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey!
    );

    // STEP 1: Call the master SQL function to get all data
    console.log("Calling master SQL function 'get_weekly_report_payload'...");
    const { data: reportData, error: rpcError } = await supabaseAdmin.rpc(
      "get_weekly_report_payload"
    );

    if (rpcError) {
      throw new Error(
        `Failed to get report data from database: ${rpcError.message}`
      );
    }
    console.log("Successfully fetched report data.");

    // STEP 2: Create a signed URL for the logo (this part is unchanged)
    const { data: signedUrlData, error: signedUrlError } =
      await supabaseAdmin.storage
        .from(ASSETS_BUCKET_NAME)
        .createSignedUrl(LOGO_PATH, 60);
    if (signedUrlError) {
      throw new Error(
        `Could not create signed URL for logo: ${signedUrlError.message}`
      );
    }
    const signedLogoUrl = signedUrlData.signedUrl;

    // STEP 3: Generate the PDF with the data
    console.log("Generating PDF report...");
    const pdfBytes = await generatePdf(reportData, signedLogoUrl);
    console.log("PDF generated successfully.");

    // STEP 4: Send the email
    console.log("Sending report email...");
    await sendReportEmail(pdfBytes);

    return new Response(
      JSON.stringify({ message: "Report generated and sent successfully." }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in generate-weekly-report function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
