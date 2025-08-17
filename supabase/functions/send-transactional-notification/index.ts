import { createClient } from "@supabase/supabase-js";
import { serve } from "std/http/server.ts";

const ADMIN_WHATSAPP_LIST = ["+256775627358", "+256772416701", "+256756306001"];

async function sendWhatsappTemplate(
  to: string,
  templateName: string,
  contentVariables: Record<string, string>
) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_WHATSAPP_FROM");

  if (!accountSid || !authToken || !from || !templateName) {
    console.error(`Missing Twilio credentials or template name for ${to}`);
    return;
  }

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

serve(async (req) => {
  try {
    const { type, table, record } = await req.json();
    if (type !== "INSERT") return new Response("OK", { status: 200 });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const adminTemplate = Deno.env.get("TWILIO_TEMPLATE_ADMIN_ALERT")!;

    if (table === "profiles") {
      const welcomeTemplate = Deno.env.get("TWILIO_TEMPLATE_WELCOME")!;
      await sendWhatsappTemplate(record.whatsapp_number, welcomeTemplate, {
        "1": record.full_name,
      });

      const adminMsg = `New user: ${record.full_name} (${record.whatsapp_number}). Check email for details.`;
      await Promise.all(
        ADMIN_WHATSAPP_LIST.map((p) =>
          sendWhatsappTemplate(p, adminTemplate, { "1": adminMsg })
        )
      );
    } else if (table === "managed_profiles") {
      const { data: manager } = await supabaseAdmin
        .from("profiles")
        .select("full_name, whatsapp_number")
        .eq("id", record.manager_id)
        .single();
      if (manager) {
        const managedTemplate = Deno.env.get("TWILIO_TEMPLATE_MANAGED")!;
        await sendWhatsappTemplate(manager.whatsapp_number, managedTemplate, {
          "1": manager.full_name,
          "2": record.username,
        });
      }
    } else if (table === "service_requests") {
      const { data: service } = await supabaseAdmin
        .from("services")
        .select("name")
        .eq("id", record.service_id)
        .single();
      const { data: requester } = await supabaseAdmin
        .from("profiles")
        .select("full_name, whatsapp_number")
        .eq("id", record.user_id)
        .single();
      if (requester && service) {
        const serviceTemplate = Deno.env.get("TWILIO_TEMPLATE_SERVICE")!;
        await sendWhatsappTemplate(requester.whatsapp_number, serviceTemplate, {
          "1": requester.full_name,
          "2": service.name,
          "3": record.id,
        });

        const adminMsg = `New request for "${service.name}" from ${requester.full_name}. Check email for PDF.`;
        await Promise.all(
          ADMIN_WHATSAPP_LIST.map((p) =>
            sendWhatsappTemplate(p, adminTemplate, { "1": adminMsg })
          )
        );
      }
    }
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
