import { createClient } from "@supabase/supabase-js";
import { serve } from "std/http/server.ts";
import { encodeBase64 } from "std/encoding/base64.ts";
import {
  ADMIN_LIST,
  FROM_ADDRESS,
  ZEPTOMAIL_API_URL_TEMPLATE,
} from "./constants.ts";
import {
  calculateAge,
  formatPhoneNumberE164,
  dateOnlyOptions,
  dateTimeOptions,
  timeOnlyOptions,
} from "./utils.ts";
import { createRequestPdf } from "./pdf.ts";
import { sendWhatsappTemplate } from "./whatsapp.ts";
import { getMimeType } from "std/media_types/mod.ts";

serve(async (req) => {
  try {
    const { type, table, record } = await req.json();
    if (type !== "INSERT") return new Response("OK", { status: 200 });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const zeptoToken = Deno.env.get("ZEPTOMAIL_TOKEN");
    if (!zeptoToken) throw new Error("ZEPTOMAIL_TOKEN not set");

    if (table === "service_requests") {
      // --- Fetch Service, Patient, and Requester Data ---
      const { data: service } = await supabaseAdmin
        .from("services")
        .select("name, slug, service_number")
        .eq("id", record.service_id)
        .single();

      if (!service) {
        throw new Error(`Service with ID ${record.service_id} not found.`);
      }

      const requestData = record.request_data || {};
      const profileInfo = requestData._profileInfo || {};
      const patientId = profileInfo.profileId;
      if (!patientId)
        throw new Error("Patient profileId missing in request_data");

      let patientProfile: any = null;
      const { data: mainPatientProfile } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", patientId)
        .single();
      if (mainPatientProfile) {
        patientProfile = mainPatientProfile;
      } else {
        const { data: managedPatientProfile } = await supabaseAdmin
          .from("managed_profiles")
          .select("*")
          .eq("id", patientId)
          .single();
        patientProfile = managedPatientProfile;
      }
      if (!patientProfile)
        throw new Error(`Could not find patient profile for ID: ${patientId}`);

      const requesterId = record.user_id;
      const { data: requesterProfile } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", requesterId)
        .single();
      if (!requesterProfile)
        throw new Error(
          `Could not find requester profile for ID: ${requesterId}`
        );

      // --- Prepare Data for PDF and Email ---
      const patientName = patientProfile.username || "N/A";
      const requesterName = requesterProfile.username || "N/A";
      const deliveryDate = record.preferred_date
        ? new Date(record.preferred_date)
        : null;

      const pdfPayload = {
        patient_name: patientName,
        patient_gender: patientProfile.gender,
        patient_age: calculateAge(patientProfile.date_of_birth),
        requester_name: requesterName,
        requester_phone: requesterProfile.whatsapp_number,
        requester_whatsapp: requesterProfile.whatsapp_number,
        requester_email: requesterProfile.email || "N/A",
        requester_district: requesterProfile.district,
        requester_sub_county: requesterProfile.sub_county,
        service_request_id: record.id,
        service_name: service?.name,
        service_created_at: new Date(record.created_at).toLocaleString(
          "en-US",
          dateTimeOptions
        ),
        status: record.status,
        quantity: record.quantity,
        delivery_method: record.delivery_method,
        delivery_location: record.delivery_location?.address,
        delivery_date: deliveryDate
          ? deliveryDate.toLocaleDateString("en-US", dateOnlyOptions)
          : null,
        delivery_time: deliveryDate
          ? deliveryDate.toLocaleTimeString("en-US", timeOnlyOptions)
          : null,
        counselling_support: record.counselling_required ? "Yes" : "No",
        counselling_channel: record.counselling_channel,
        additional_comments: requestData.comments,
      };

      // --- 1. Generate PDF ---
      const pdfBytes = await createRequestPdf(pdfPayload);
      const now = new Date();
      const dateString = `${now.getFullYear()}${String(
        now.getMonth() + 1
      ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      const serviceSlug = service.slug.toLowerCase() || "service";
      const serviceNumberFormatted = String(
        service.service_number || 0
      ).padStart(3, "0");
      const pdfFilename = `${patientName}_${serviceSlug}_request_${dateString}_${serviceNumberFormatted}.pdf`;

      // --- 2. Upload Generated PDF to Storage ---
      console.log(`Uploading PDF: ${pdfFilename} to storage...`);
      const { data: uploadData, error: uploadError } =
        await supabaseAdmin.storage
          .from("generated-service-pdfs")
          .upload(pdfFilename, pdfBytes, {
            contentType: "application/pdf",
            upsert: true,
          });

      if (uploadError) {
        console.error("Error uploading PDF to storage:", uploadError);
        throw new Error("Failed to upload generated PDF to storage.");
      }
      console.log("PDF uploaded successfully. Path:", uploadData.path);

      // --- 3. Save PDF reference in the database ---
      const { error: dbError } = await supabaseAdmin
        .from("generated_pdfs")
        .insert({
          service_request_id: record.id,
          file_path: uploadData.path,
          file_name: pdfFilename,
        });

      if (dbError) {
        console.error("Error saving PDF metadata to database:", dbError);
      } else {
        console.log("PDF metadata saved to database successfully.");
      }

      // --- 4. Prepare Email Attachments (starting with the generated PDF) ---
      const pdfBase64 = encodeBase64(pdfBytes);
      const emailAttachments = [
        { name: pdfFilename, content: pdfBase64, mime_type: "application/pdf" },
      ];

      // --- 5. Fetch and Add User Attachments to Email ---
      const userAttachments = record.attachments;
      let attachmentPaths: string[] = [];
      if (Array.isArray(userAttachments)) {
        attachmentPaths = userAttachments;
      }

      if (attachmentPaths.length > 0) {
        console.log(
          `Found ${attachmentPaths.length} user attachments to process.`
        );
        for (const attachmentPath of attachmentPaths) {
          if (!attachmentPath) continue;

          try {
            console.log(`Downloading attachment: ${attachmentPath}`);
            const { data: fileBlob, error: downloadError } =
              await supabaseAdmin.storage
                .from("attachments")
                .download(attachmentPath);

            if (downloadError) {
              console.error(
                `Failed to download attachment ${attachmentPath}:`,
                downloadError
              );
              continue;
            }

            if (fileBlob) {
              const fileBytes = new Uint8Array(await fileBlob.arrayBuffer());
              const fileBase64 = encodeBase64(fileBytes);
              const fileName = attachmentPath.split("/").pop() || "attachment";
              const mimeType =
                getMimeType(fileName) || "application/octet-stream";

              emailAttachments.push({
                name: fileName,
                content: fileBase64,
                mime_type: mimeType,
              });
              console.log(
                `Successfully added ${fileName} to email attachments.`
              );
            }
          } catch (e) {
            console.error(
              `An error occurred while processing attachment ${attachmentPath}:`,
              e
            );
          }
        }
      }

      // --- 6. Dynamic Template Selection & Email Sending ---
      const serviceSlugKey = service.slug.toUpperCase().replace(/-/g, "_");
      const zeptoTemplateKey = Deno.env.get(
        `ZEPTOMAIL_TEMPLATE_${serviceSlugKey}`
      );

      if (zeptoTemplateKey) {
        for (const admin of ADMIN_LIST) {
          const subject = `New ${service.name} Request from ${patientName} - #${record.id}`;
          const mergeInfo = {
            admin_name: admin.name,
            requester_name: requesterName,
            patient_name: patientName,
            service_request_id: record.id,
          };
          const emailApiPayload = {
            template_key: zeptoTemplateKey,
            from: { address: FROM_ADDRESS, name: "NetLife Platform" },
            to: [{ email_address: { address: admin.email, name: admin.name } }],
            subject: subject,
            merge_info: mergeInfo,
            attachments: emailAttachments,
          };

          console.log(
            `Sending email to admin: ${admin.email} with ${emailAttachments.length} attachment(s).`
          );
          const response = await fetch(ZEPTOMAIL_API_URL_TEMPLATE, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: zeptoToken,
            },
            body: JSON.stringify(emailApiPayload),
          });

          if (!response.ok) {
            const errorBody = await response.text();
            console.error(
              `Failed to send email to ${admin.email}:`,
              response.status,
              errorBody
            );
          }
        }
      } else {
        console.warn(
          `No ZeptoMail template key found for service: ${service.slug}`
        );
      }

      // --- 7. Send User WhatsApp Notification ---
      const twilioUserTemplateSid = Deno.env.get(
        `TWILIO_TEMPLATE_USER_${serviceSlugKey}`
      );
      const recipientPhoneNumber = formatPhoneNumberE164(
        requesterProfile.whatsapp_number
      );

      if (recipientPhoneNumber && twilioUserTemplateSid) {
        await sendWhatsappTemplate(
          recipientPhoneNumber,
          twilioUserTemplateSid,
          { "1": requesterName }
        );
      } else {
        console.warn(
          `No Twilio template SID or phone number for user. Service: ${service.slug}`
        );
      }

      return new Response("OK - Processed request successfully", {
        status: 200,
      });
    }

    return new Response("OK - Unhandled event", { status: 200 });
  } catch (error) {
    console.error("Error in Edge Function:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
