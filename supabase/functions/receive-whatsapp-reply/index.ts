import { createClient } from "@supabase/supabase-js";
import { serve } from "std/http/server.ts";

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
      `[WhatsApp Reply] Missing Twilio credentials, SID, or recipient. SID: ${templateSid}, To: ${to}`
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
        `[WhatsApp Reply] Twilio API error for ${to}:`,
        await response.json()
      );
    }
  } catch (error) {
    console.error(
      `[WhatsApp Reply] Failed to send template to ${to}:`,
      error.message
    );
  }
}

serve(async (req) => {
  try {
    const formData = await req.formData();
    const fromPhoneNumber = formData
      .get("From")
      ?.toString()
      .replace("whatsapp:", "");
    const rating = formData.get("Body")?.toString();

    if (!fromPhoneNumber || !rating) {
      throw new Error("Missing 'From' or 'Body' in Twilio webhook payload.");
    }

    if (!["Excellent", "Good", "Poor"].includes(rating)) {
      console.log(
        `Ignoring non-rating message from ${fromPhoneNumber}: "${rating}"`
      );
      return new Response(null, {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, username")
      .eq("whatsapp_number", fromPhoneNumber)
      .single();

    if (profileError || !profile) {
      throw new Error(`User not found for phone number: ${fromPhoneNumber}`);
    }

    const { data: latestRequest, error: requestError } = await supabaseAdmin
      .from("service_requests")
      .select(
        "id, (select count(*) from service_feedback where service_request_id = service_requests.id) as feedback_count"
      )
      .eq("user_id", profile.id)
      .eq("status", "completed")
      .eq("feedback_count", 0)
      .order("completed_at", { ascending: false })
      .limit(1)
      .single();

    if (requestError || !latestRequest) {
      console.warn(
        `No pending feedback request found for user ${profile.id}. Ignoring rating.`
      );
      return new Response(null, {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    const { error: insertError } = await supabaseAdmin
      .from("service_feedback")
      .insert({
        user_id: profile.id,
        service_request_id: latestRequest.id,
        rating: rating,
      });

    if (insertError) {
      if (insertError.code === "23505") {
        console.warn(
          `Feedback for request ${latestRequest.id} already exists.`
        );
      } else {
        throw insertError;
      }
    }

    const thanksTemplateSid = Deno.env.get("TWILIO_TEMPLATE_RATING_THANKS_SID");
    if (thanksTemplateSid) {
      await sendWhatsappTemplate(fromPhoneNumber, thanksTemplateSid, {
        "1": profile.username,
      });
    }

    return new Response(null, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("Error processing Twilio webhook:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
