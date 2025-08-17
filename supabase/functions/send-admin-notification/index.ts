import { createClient } from "@supabase/supabase-js";
import { serve } from "std/http/server.ts";
import { encodeBase64, decodeBase64 } from "std/encoding/base64.ts";
import mime from "mime";
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

serve(async (req) => {
  try {
    const { type, table, record } = await req.json();
    if (type !== "INSERT" || table !== "service_requests") {
      return new Response("OK - Unhandled event", { status: 200 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const zeptoToken = Deno.env.get("ZEPTOMAIL_TOKEN");
    if (!zeptoToken) throw new Error("ZEPTOMAIL_TOKEN not set");

    // --- 1. Fetch Core Data ---
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
    if (!patientProfile) {
      throw new Error(`Could not find patient profile for ID: ${patientId}`);
    }

    const { data: requesterProfile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", record.user_id)
      .single();
    if (!requesterProfile) {
      throw new Error(
        `Could not find requester profile for ID: ${record.user_id}`
      );
    }

    const patientName = patientProfile.username || "user";
    const requesterName = requesterProfile.username || "user";
    const deliveryDate = record.preferred_date
      ? new Date(record.preferred_date)
      : null;

    const emailAttachments = [];
    const uploadedAttachmentPaths = [];

    // --- 2. Process User Attachment from Base64 Data ---
    const userAttachmentData = requestData.attachment;
    if (
      userAttachmentData &&
      userAttachmentData.name &&
      userAttachmentData.data
    ) {
      console.log(
        "Processing user attachment received in Edge Function:",
        userAttachmentData.name
      );
      const parts = userAttachmentData.data.split(",");
      const base64Data = parts[1];

      if (base64Data) {
        const decodedFile = decodeBase64(base64Data);
        const newFileName = `user-attachments/${patientName}_${Date.now()}_${
          userAttachmentData.name
        }`
          .toLowerCase()
          .replace(/[^a-z0-9-_\.\/]/g, ""); // Sanitize filename

        const { data: uploadData, error: uploadError } =
          await supabaseAdmin.storage
            .from("attachments")
            .upload(newFileName, decodedFile, {
              contentType:
                mime.getType(userAttachmentData.name) ||
                "application/octet-stream",
              upsert: true,
            });

        if (uploadError) {
          console.error(
            "EDGE FUNCTION ERROR: Failed to upload attachment to bucket:",
            uploadError
          );
        } else {
          console.log(
            "Attachment successfully saved to bucket. Path:",
            uploadData.path
          );
          uploadedAttachmentPaths.push(uploadData.path);
          emailAttachments.push({
            name: userAttachmentData.name,
            content: base64Data,
            mime_type:
              mime.getType(userAttachmentData.name) ||
              "application/octet-stream",
          });

          // Update the original request with the path of the saved attachment
          await supabaseAdmin
            .from("service_requests")
            .update({ attachments: uploadedAttachmentPaths })
            .eq("id", record.id);
        }
      } else {
        console.warn(
          "Attachment data was found but the Base64 content was empty."
        );
      }
    }

    // --- 3. Generate and Save PDF ---
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

    const pdfBytes = await createRequestPdf(pdfPayload);
    const now = new Date();
    const dateString = `${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const serviceSlug = service.slug.toLowerCase() || "service";
    const serviceNumberFormatted = String(service.service_number || 0).padStart(
      3,
      "0"
    );
    const pdfFilename =
      `${patientName}_${serviceSlug}_request_${dateString}_${serviceNumberFormatted}.pdf`.toLowerCase();

    const { data: pdfUploadData, error: pdfUploadError } =
      await supabaseAdmin.storage
        .from("generated-service-pdfs")
        .upload(pdfFilename, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });

    if (pdfUploadError) {
      console.error(
        "EDGE FUNCTION ERROR: Failed to upload generated PDF:",
        pdfUploadError
      );
    } else if (pdfUploadData) {
      await supabaseAdmin.from("generated_pdfs").insert({
        service_request_id: record.id,
        file_path: pdfUploadData.path,
        file_name: pdfFilename,
      });
    }

    emailAttachments.push({
      name: pdfFilename,
      content: encodeBase64(pdfBytes),
      mime_type: "application/pdf",
    });

    // --- 4. Send Notifications ---
    const serviceSlugKey = service.slug.toUpperCase().replace(/-/g, "_");
    const zeptoTemplateKey = Deno.env.get(
      `ZEPTOMAIL_TEMPLATE_${serviceSlugKey}`
    );

    if (zeptoTemplateKey) {
      console.log(`Sending email with ${emailAttachments.length} attachments.`);
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
        await fetch(ZEPTOMAIL_API_URL_TEMPLATE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: zeptoToken,
          },
          body: JSON.stringify(emailApiPayload),
        });
      }
    }

    const twilioUserTemplateSid = Deno.env.get(
      `TWILIO_TEMPLATE_USER_${serviceSlugKey}`
    );
    const recipientPhoneNumber = formatPhoneNumberE164(
      requesterProfile.whatsapp_number
    );
    if (recipientPhoneNumber && twilioUserTemplateSid) {
      await sendWhatsappTemplate(recipientPhoneNumber, twilioUserTemplateSid, {
        "1": requesterName,
      });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error in Edge Function:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
