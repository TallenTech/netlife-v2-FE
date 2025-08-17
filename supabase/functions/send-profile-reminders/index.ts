import { createClient } from "@supabase/supabase-js";
import { serve } from "std/http/server.ts";

const PROFILE_URL = "https://dev.netlife.cc/";

async function sendWhatsappTemplate(
  to: string,
  templateName: string,
  contentVariables: Record<string, string>
) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_WHATSAPP_FROM");

  if (!accountSid || !authToken || !from || !templateName) return;

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = btoa(`${accountSid}:${authToken}`);

  const bodyParams = new URLSearchParams({
    To: `whatsapp:${to}`,
    From: `whatsapp:${from}`,
    ContentSid: templateName,
    ContentVariables: JSON.stringify(contentVariables),
  });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyParams,
    });
    if (!response.ok) {
      console.error(`Twilio error for ${to}:`, await response.json());
    }
  } catch (error) {
    console.error(`Failed to send WhatsApp to ${to}:`, error.message);
  }
}

serve(async (_req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const dayBefore = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("full_name, whatsapp_number")
      .is("district", null)
      .gt("created_at", dayBefore)
      .lt("created_at", yesterday);

    if (error) throw error;
    if (!profiles || profiles.length === 0)
      return new Response("No incomplete profiles to remind.", { status: 200 });

    const reminderTemplate = Deno.env.get("TWILIO_TEMPLATE_REMINDER")!;

    for (const profile of profiles) {
      await sendWhatsappTemplate(profile.whatsapp_number, reminderTemplate, {
        "1": profile.full_name,
        "2": PROFILE_URL,
      });
    }

    return new Response("Reminders sent successfully.", { status: 200 });
  } catch (error) {
    console.error("Error sending reminders:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
