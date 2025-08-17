import { createClient } from "@supabase/supabase-js";
import { serve } from "std/http/server.ts";

function formatPhoneNumberE164(
  phoneNumber: string | null | undefined
): string | null {
  if (!phoneNumber || phoneNumber.trim() === "") return null;
  const trimmedNumber = phoneNumber.trim().replace(/\s/g, "");
  return trimmedNumber.startsWith("+") ? trimmedNumber : `+${trimmedNumber}`;
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
      `[WhatsApp Managed Profile] Missing Twilio credentials, SID, or recipient. SID: ${templateSid}, To: ${to}`
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
    if (!response.ok) {
      console.error(
        `[WhatsApp Managed Profile] Twilio API error for ${to}:`,
        await response.json()
      );
    } else {
      console.log(
        `[WhatsApp Managed Profile] Successfully sent template ${templateSid} to ${to}.`
      );
    }
  } catch (error) {
    console.error(
      `[WhatsApp Managed Profile] Failed to send template to ${to}:`,
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
    const { record: newManagedProfile } = await req.json();
    const managerId = newManagedProfile.manager_id;
    const managedProfileName = newManagedProfile.username;

    if (!managerId || !managedProfileName) {
      throw new Error(
        "Missing manager_id or username in the managed_profile payload."
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the manager's profile to get their name and WhatsApp number
    const { data: managerProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("username, whatsapp_number")
      .eq("id", managerId)
      .single();

    if (profileError) throw profileError;
    if (!managerProfile)
      throw new Error(`Manager profile not found for ID: ${managerId}`);
    if (!managerProfile.whatsapp_number) {
      console.warn(
        `Manager ${managerId} has no WhatsApp number. Cannot send notification.`
      );
      return new Response("OK - No WhatsApp number for manager", {
        status: 200,
      });
    }

    const managerName = managerProfile.username;
    const recipientPhoneNumber = formatPhoneNumberE164(
      managerProfile.whatsapp_number
    );
    const templateSid = Deno.env.get("TWILIO_TEMPLATE_MANAGED_PROFILE_SID");

    if (!templateSid) {
      throw new Error(
        "TWILIO_TEMPLATE_MANAGED_PROFILE_SID environment variable is not set!"
      );
    }

    if (recipientPhoneNumber) {
      await sendWhatsappTemplate(recipientPhoneNumber, templateSid, {
        "1": managerName,
        "2": managedProfileName,
      });
      return new Response("OK - Managed profile notification sent", {
        status: 200,
      });
    } else {
      throw new Error("Manager's phone number is missing or invalid.");
    }
  } catch (error) {
    console.error(
      "Error in send-managed-profile-alert function:",
      error.message
    );
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
