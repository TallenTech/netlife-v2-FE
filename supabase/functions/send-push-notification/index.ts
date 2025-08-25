import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails(
  "mailto:support@netlife.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const notificationRecord = payload.record;

    if (!notificationRecord || !notificationRecord.user_id) {
      throw new Error("Invalid notification record in payload.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("subscription_details")
      .eq("user_id", notificationRecord.user_id);

    if (subsError) throw subsError;

    if (!subscriptions || subscriptions.length === 0) {
      await supabaseAdmin
        .from("push_notifications")
        .update({ is_sent: true, sent_at: new Date().toISOString() })
        .eq("id", notificationRecord.id);
      return new Response(
        JSON.stringify({ message: "No subscriptions for user." }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const notificationPayload = JSON.stringify({
      title: notificationRecord.title,
      body: notificationRecord.body,
      link_url: notificationRecord.link_url,
    });

    const sendPromises = subscriptions.map((sub) =>
      webpush
        .sendNotification(sub.subscription_details, notificationPayload)
        .catch(async (error) => {
          if (error.statusCode === 410) {
            await supabaseAdmin
              .from("push_subscriptions")
              .delete()
              .eq("user_id", notificationRecord.user_id)
              .eq(
                "subscription_details->>endpoint",
                sub.subscription_details.endpoint
              );
          }
        })
    );

    await Promise.all(sendPromises);

    await supabaseAdmin
      .from("push_notifications")
      .update({ is_sent: true, sent_at: new Date().toISOString() })
      .eq("id", notificationRecord.id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
