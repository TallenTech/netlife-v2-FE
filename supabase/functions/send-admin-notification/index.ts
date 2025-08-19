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

    const { data: service } = await supabaseAdmin
      .from("services")
      .select("name, slug, service_number")
      .eq("id", record.service_id)
      .single();
    if (!service)
      throw new Error(`Service with ID ${record.service_id} not found.`);

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

    const { data: requesterProfile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", record.user_id)
      .single();
    if (!requesterProfile)
      throw new Error(
        `Could not find requester profile for ID: ${record.user_id}`
      );

    const patientName = patientProfile.username || "user";
    const requesterName = requesterProfile.username || "user";
    const deliveryDate = record.preferred_date
      ? new Date(record.preferred_date)
      : null;

    const emailAttachments = [];

    const { data: attachmentRecord, error: attachmentError } =
      await supabaseAdmin
        .from("user_attachments")
        .select("file_path, original_name, mime_type")
        .eq("service_request_id", record.id)
        .maybeSingle();

    if (attachmentError) {
      console.error(
        "EDGE FUNCTION ERROR: Failed to query user_attachments table:",
        attachmentError
      );
    }

    if (attachmentRecord && attachmentRecord.file_path) {
      const { data: fileData, error: downloadError } =
        await supabaseAdmin.storage
          .from("service-attachments")
          .download(attachmentRecord.file_path);

      if (downloadError) {
        console.error(
          `EDGE FUNCTION ERROR: Failed to download file from storage path ${attachmentRecord.file_path}:`,
          downloadError
        );
      } else {
        const fileBase64 = encodeBase64(await fileData.arrayBuffer());
        const structuredFilename =
          attachmentRecord.file_path.split("/").pop() ||
          attachmentRecord.original_name;
        emailAttachments.push({
          name: structuredFilename,
          content: fileBase64,
          mime_type: attachmentRecord.mime_type || "application/octet-stream",
        });
      }
    }

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
    const serviceNumberFormatted = String(service.service_number || 0).padStart(
      3,
      "0"
    );

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    const capitalizedPatientName = capitalize(patientName);

    const serviceSlug = service.slug || "service";
    let formattedServiceSlug: string;

    if (serviceSlug === "sti-screening") {
      formattedServiceSlug = "STI-Screening";
    } else if (serviceSlug === "counselling-services") {
      formattedServiceSlug = "Counselling-Services";
    } else {
      formattedServiceSlug = serviceSlug.toUpperCase();
    }

    const uniqueSuffix = Math.random().toString(36).substring(2, 8);

    const pdfFilename =
      `${capitalizedPatientName}_${formattedServiceSlug}_request_${dateString}_${serviceNumberFormatted}_${uniqueSuffix}.pdf`;

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

    const serviceSlugKey = service.slug.toUpperCase().replace(/-/g, "_");
    const zeptoTemplateKey = Deno.env.get(
      `ZEPTOMAIL_TEMPLATE_${serviceSlugKey}`
    );

    if (zeptoTemplateKey) {
      for (const admin of ADMIN_LIST) {
        const subject = `New ${
          service.name
        } Request from ${patientName} - #${record.id.slice(0, 8)}`;
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
        const response = await fetch(ZEPTOMAIL_API_URL_TEMPLATE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: zeptoToken,
          },
          body: JSON.stringify(emailApiPayload),
        });
        if (!response.ok) {
          console.error(
            `Failed to send email to ${admin.email}:`,
            await response.json()
          );
        }
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
    console.error("FATAL ERROR in Edge Function:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});