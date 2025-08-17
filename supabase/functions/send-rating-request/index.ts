import { createClient } from "@supabase/supabase-js";
import { serve } from "std/http/server.ts";

function formatPhoneNumberE164(
  phoneNumber: string | null | undefined
): string | null {
  if (!phoneNumber || phoneNumber.trim() === "") {
    return null;
  }
  const trimmedNumber = phoneNumber.trim().replace(/\s/g, "");
  if (trimmedNumber.startsWith("+")) {
    return trimmedNumber;
  }
  return `+${trimmedNumber}`;
}

async function sendWhatsappTemplate(
  to: string,
  templateSid: string,
  contentVariables: Record<string, string>
) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_WHATSAPP_FROM");

  if (!accountSid || !authToken || !from || !templateSid || !to) {
    console.error(
      `[WhatsApp Rating] Missing Twilio credentials, SID, or recipient. SID: ${templateSid}, To: ${to}`
    );
    return;
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = btoa(`${accountSid}:${authToken}`);
  const bodyParams = new URLSearchParams({
    To: `whatsapp:${to}`,
    From: `whatsapp:${from}`,
    ContentSid: templateSid,
    ContentVariables: JSON.stringify(contentVariables),
  });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: bodyParams,
    });
    if (!response.ok) {
      console.error(
        `[WhatsApp Rating] Twilio API error for ${to}:`,
        await response.json()
      );
    }
  } catch (error) {
    console.error(
      `[WhatsApp Rating] Failed to send template to ${to}:`,
      error.message
    );
  }
}

serve(async (req) => {
  try {
    const { record: serviceRequest } = await req.json();
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: service } = await supabaseAdmin
      .from("services")
      .select("name")
      .eq("id", serviceRequest.service_id)
      .single();
    if (!service)
      throw new Error(`Service not found for request ID: ${serviceRequest.id}`);

    const { data: requesterProfile } = await supabaseAdmin
      .from("profiles")
      .select("username, whatsapp_number")
      .eq("id", serviceRequest.user_id)
      .single();
    if (!requesterProfile)
      throw new Error(
        `Requester profile not found for user ID: ${serviceRequest.user_id}`
      );

    const ratingTemplateSid = Deno.env.get(
      "TWILIO_TEMPLATE_RATING_REQUEST_SID"
    );
    const recipientPhoneNumber = formatPhoneNumberE164(
      requesterProfile.whatsapp_number
    );

    if (recipientPhoneNumber && ratingTemplateSid) {
      await sendWhatsappTemplate(recipientPhoneNumber, ratingTemplateSid, {
        "1": requesterProfile.username,
        "2": service.name,
      });
      return new Response("OK - Interactive rating request sent", {
        status: 200,
      });
    } else {
      let missingInfo = [];
      if (!recipientPhoneNumber) missingInfo.push("phone number");
      if (!ratingTemplateSid) missingInfo.push("rating template SID");
      throw new Error(
        `Cannot send rating request for user ${
          serviceRequest.user_id
        }. Missing: ${missingInfo.join(", ")}.`
      );
    }
  } catch (error) {
    console.error("Error in send-rating-request function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
