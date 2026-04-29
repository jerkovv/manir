// Worker: nalazi porudžbine starije od review_delay_days (default 14) bez
// poslatog review email-a, kreira tokene preko create_review_tokens_for_order,
// i šalje 1 mejl po porudžbini sa listom proizvoda (svaki ima svoj review URL).
// deploy-touch: 2026-04-29
//
// Pozivan od cron-tick svakih 15 min. Interno throttle: jedan run obrađuje
// najviše BATCH_SIZE porudžbina, da SMTP ne pukne.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { loadSmtpSender } from "../_shared/smtp-runner.ts";
import { reviewReminderHtml, type ReviewEmailItem } from "../_shared/recovery-emails.ts";

const BATCH_SIZE = 25;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Pristup samo iz cron-tick (interna funkcija); proverava CRON_SECRET header.
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== Deno.env.get("CRON_SECRET")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const siteUrl = (Deno.env.get("PUBLIC_SITE_URL") || "https://0202skin.com").replace(/\/+$/, "");

  // 1. Učitaj recovery_settings (delay)
  const { data: rs } = await admin
    .from("recovery_settings").select("*").eq("id", 1).maybeSingle();
  if (!rs?.review_emails_enabled) {
    return json({ skipped: true, reason: "review_emails_enabled=false" }, 200);
  }
  const delayDays = Number(rs.review_delay_days ?? 14);

  // 2. Pronađi kandidate
  const cutoff = new Date(Date.now() - delayDays * 86400_000).toISOString();
  const { data: orders, error: oErr } = await admin
    .from("orders")
    .select("id, customer_email, customer_name, created_at")
    .eq("review_email_sent", false)
    .lte("created_at", cutoff)
    .not("customer_email", "is", null)
    .neq("status", "cancelled")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);
  if (oErr) return json({ error: oErr.message }, 500);
  if (!orders || orders.length === 0) {
    return json({ processed: 0 }, 200);
  }

  // 3. SMTP
  const sender = await loadSmtpSender(admin);
  if ("error" in sender) return json({ error: sender.error }, 200);

  const results: Array<{ order_id: string; status: string; error?: string }> = [];

  for (const order of orders) {
    try {
      // Kreiraj tokene (idempotentno preko UNIQUE(order_id, product_id))
      const { data: tokens, error: tErr } = await admin
        .rpc("create_review_tokens_for_order", { _order_id: order.id });
      if (tErr) throw tErr;

      const items: ReviewEmailItem[] = (tokens ?? []).map((t: { token: string; product_name: string; product_image: string | null }) => ({
        product_name: t.product_name,
        product_image: t.product_image,
        review_url: `${siteUrl}/oceni?token=${t.token}`,
      }));

      if (items.length === 0) {
        // Nema proizvoda — markiraj kao poslato da ne pingujemo svaki cron
        await admin.from("orders").update({ review_email_sent: true }).eq("id", order.id);
        results.push({ order_id: order.id, status: "skipped_no_items" });
        continue;
      }

      const html = reviewReminderHtml({
        customerName: order.customer_name || "",
        items,
        siteUrl,
      });

      // htmlOnly: true → čist text/html, bez multipart/alternative.
      // Sprečava duplikat-render i `=20` artefakte u Gmail web klijentu.
      await sender.send({
        to: order.customer_email,
        subject: "Kako ste se snašli? · 0202skin",
        html,
        htmlOnly: true,
      });

      await admin.from("orders").update({
        review_email_sent: true,
        review_email_sent_at: new Date().toISOString(),
      }).eq("id", order.id);

      await admin.from("email_logs").insert({
        order_id: order.id,
        recipient: order.customer_email,
        type: "review_reminder",
        status: "sent",
      });

      results.push({ order_id: order.id, status: "sent" });
    } catch (e) {
      const msg = (e as Error).message;
      await admin.from("email_logs").insert({
        order_id: order.id,
        recipient: order.customer_email,
        type: "review_reminder",
        status: "failed",
        error_message: msg,
      });
      results.push({ order_id: order.id, status: "failed", error: msg });
    }
  }

  return json({ processed: results.length, results }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}