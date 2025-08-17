export async function sendWhatsappTemplate(
  to: string,
  templateSid: string,
  contentVariables: Record<string, string>
) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_WHATSAPP_FROM");
  if (!accountSid || !authToken || !from || !templateSid || !to) {
    console.error(
      `[WhatsApp] Missing credentials, SID, or recipient. SID: ${templateSid}, To: ${to}`
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
        `[WhatsApp] Twilio API error for ${to}:`,
        await response.json()
      );
    }
  } catch (error) {
    console.error(
      `[WhatsApp] Failed to send template to ${to}:`,
      error.message
    );
  }
}
