import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch pending notifications (batch of 20)
    const { data: pending, error: fetchError } = await supabase
      .from("notification_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(20);

    if (fetchError) throw fetchError;
    if (!pending?.length) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    const errors: string[] = [];

    for (const notification of pending) {
      try {
        if (notification.channel === "email") {
          // Real email sending via Resend-compatible API
          const resendApiKey = Deno.env.get("RESEND_API_KEY");
          const senderEmail = Deno.env.get("SENDER_EMAIL") || "noreply@notify.parceiros.playbet.app.br";

          if (!resendApiKey) {
            // Fallback: log only when no API key configured
            console.log(
              `[EMAIL-NO-KEY] To: ${notification.recipient} | Subject: ${notification.subject} | Body: ${notification.body}`
            );
            await supabase
              .from("notification_queue")
              .update({ status: "failed", error_message: "RESEND_API_KEY not configured" })
              .eq("id", notification.id);
            errors.push(`Notification ${notification.id}: RESEND_API_KEY missing`);
            continue;
          }

          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: senderEmail,
              to: [notification.recipient],
              subject: notification.subject || "Notificação",
              text: notification.body,
            }),
          });

          if (emailRes.ok) {
            await supabase
              .from("notification_queue")
              .update({ status: "sent", sent_at: new Date().toISOString() })
              .eq("id", notification.id);
            processed++;
          } else {
            const errBody = await emailRes.text();
            await supabase
              .from("notification_queue")
              .update({ status: "failed", error_message: errBody })
              .eq("id", notification.id);
            errors.push(`Notification ${notification.id}: ${errBody}`);
          }
        } else if (notification.channel === "telegram") {
          const telegramToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
          if (!telegramToken) {
            await supabase
              .from("notification_queue")
              .update({ status: "failed", error_message: "TELEGRAM_BOT_TOKEN not configured" })
              .eq("id", notification.id);
            errors.push(`Notification ${notification.id}: Telegram token missing`);
            continue;
          }

          const res = await fetch(
            `https://api.telegram.org/bot${telegramToken}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: notification.recipient,
                text: `${notification.subject ? `*${notification.subject}*\n\n` : ""}${notification.body}`,
                parse_mode: "Markdown",
              }),
            }
          );

          if (res.ok) {
            await supabase
              .from("notification_queue")
              .update({ status: "sent", sent_at: new Date().toISOString() })
              .eq("id", notification.id);
            processed++;
          } else {
            const errBody = await res.text();
            await supabase
              .from("notification_queue")
              .update({ status: "failed", error_message: errBody })
              .eq("id", notification.id);
            errors.push(`Notification ${notification.id}: ${errBody}`);
          }
        } else if (notification.channel === "webhook") {
          // Webhook: POST to the recipient URL
          const webhookRes = await fetch(notification.recipient, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject: notification.subject,
              body: notification.body,
              alert_id: notification.alert_id,
              channel: "webhook",
              sent_at: new Date().toISOString(),
            }),
          });

          if (webhookRes.ok) {
            await supabase
              .from("notification_queue")
              .update({ status: "sent", sent_at: new Date().toISOString() })
              .eq("id", notification.id);
            processed++;
          } else {
            const errBody = await webhookRes.text();
            await supabase
              .from("notification_queue")
              .update({ status: "failed", error_message: errBody })
              .eq("id", notification.id);
            errors.push(`Notification ${notification.id}: ${errBody}`);
          }
        } else {
          await supabase
            .from("notification_queue")
            .update({ status: "failed", error_message: `Unknown channel: ${notification.channel}` })
            .eq("id", notification.id);
        }
      } catch (err) {
        await supabase
          .from("notification_queue")
          .update({ status: "failed", error_message: String(err) })
          .eq("id", notification.id);
        errors.push(`Notification ${notification.id}: ${err}`);
      }
    }

    return new Response(
      JSON.stringify({ processed, errors: errors.length ? errors : undefined }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
