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
      `[WhatsApp Welcome] Missing Twilio credentials, template SID, or recipient. SID: ${templateSid}, To: ${to}`
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
    ShortenUrls: "false",
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

    const responseData = await response.json();
    if (!response.ok) {
      console.error(
        `[WhatsApp Welcome] Twilio API error for ${to}:`,
        responseData
      );
    } else {
      console.log(
        `[WhatsApp Welcome] Successfully sent template ${templateSid} to ${to}. SID: ${responseData.sid}`
      );
    }
  } catch (error) {
    console.error(
      `[WhatsApp Welcome] Failed to send template to ${to}:`,
      error.message
    );
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { record } = await req.json();
    const userId = record.id;
    const username = record.username;

    if (!userId || !username) {
      throw new Error("Missing user ID or username in the trigger payload.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError) throw userError;
    if (!user) throw new Error(`Auth user not found for ID: ${userId}`);
    if (!user.phone) {
      console.warn(
        `User ${userId} has no phone number. Cannot send welcome message.`
      );
      return new Response("OK - No phone number for user", { status: 200 });
    }

    const recipientPhoneNumber = formatPhoneNumberE164(user.phone);
    const templateSid = Deno.env.get("TWILIO_TEMPLATE_WELCOME_SID");

    if (!templateSid) {
      throw new Error(
        "TWILIO_TEMPLATE_WELCOME_SID environment variable is not set!"
      );
    }

    if (recipientPhoneNumber) {
      await sendWhatsappTemplate(recipientPhoneNumber, templateSid, {
        "1": username,
      });
      return new Response("OK - Welcome message sent", { status: 200 });
    } else {
      throw new Error("Recipient phone number is missing or invalid.");
    }
  } catch (error) {
    console.error("Error in send-welcome-message function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
