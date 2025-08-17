import { createClient } from "@supabase/supabase-js";
import { serve } from "std/http/server.ts";
import { encodeBase64 } from "std/encoding/base64.ts";
import {
  ADMIN_LIST,
  ADMIN_WHATSAPP_LIST,
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
    if (type !== "INSERT") return new Response("OK", { status: 200 });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const zeptoToken = Deno.env.get("ZEPTOMAIL_TOKEN");
    if (!zeptoToken) throw new Error("ZEPTOMAIL_TOKEN not set");

    if (table === "service_requests") {
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

      const pdfBytes = await createRequestPdf(pdfPayload);
      const now = new Date();
      const dateString = `${now.getFullYear()}${String(
        now.getMonth() + 1
      ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      const serviceSlug = service.slug.toUpperCase() || "Service";
      const serviceNumberFormatted = String(
        service.service_number || 0
      ).padStart(3, "0");
      const pdfFilename = `${patientName}_${serviceSlug}_Request_${dateString}_${serviceNumberFormatted}.pdf`;
      const pdfBase64 = encodeBase64(pdfBytes);
      const emailAttachments = [
        { name: pdfFilename, content: pdfBase64, mime_type: "application/pdf" },
      ];

      // --- DYNAMIC TEMPLATE SELECTION LOGIC ---
      const serviceSlugKey = service.slug.toUpperCase().replace(/-/g, "_");
      const zeptoTemplateKey = Deno.env.get(
        `ZEPTOMAIL_TEMPLATE_${serviceSlugKey}`
      );
      const twilioUserTemplateSid = Deno.env.get(
        `TWILIO_TEMPLATE_USER_${serviceSlugKey}`
      );

      // Send Admin Email with the dynamic template
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
          await fetch(ZEPTOMAIL_API_URL_TEMPLATE, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: zeptoToken,
            },
            body: JSON.stringify(emailApiPayload),
          });
        }
      } else {
        console.warn(
          `No ZeptoMail template key found for service: ${service.slug}`
        );
      }

      // Send User WhatsApp with the dynamic template
      const recipientPhoneNumber = formatPhoneNumberE164(
        requesterProfile.whatsapp_number
      );
      if (recipientPhoneNumber && twilioUserTemplateSid) {
        await sendWhatsappTemplate(
          recipientPhoneNumber,
          twilioUserTemplateSid,
          {
            "1": requesterName,
          }
        );
      } else {
        console.warn(
          `No Twilio template SID or phone number for user. Service: ${service.slug}`
        );
      }

      // const adminTemplateSid = Deno.env.get("TWILIO_TEMPLATE_ADMIN_ALERT_SID")!;
      // const adminMessage = `${requesterName} has requested "${
      //   service?.name || "a service"
      // }" for ${patientName}. Check email for PDF.`;
      // if (adminTemplateSid) {
      //   await Promise.all(
      //     ADMIN_WHATSAPP_LIST.map((p) =>
      //       sendWhatsappTemplate(p, adminTemplateSid, { "1": adminMessage })
      //     )
      //   );
      // }

      return new Response("OK - PDF Email and WhatsApp sent", { status: 200 });
    }

    return new Response("OK - Unhandled event", { status: 200 });
  } catch (error) {
    console.error("Error in Edge Function:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
