// Worker: šalje 2 talasa abandoned cart recovery email-a (luxury podsetnik, bez popusta).
// deploy-touch: 2026-04-29
//
// Stage 1 (email1_sent_at IS NULL, updated_at <= now - email1_delay_minutes):
//   - "Vaša korpa Vas čeka" - blagi podsetnik
// Stage 2 (email1_sent_at IS NOT NULL, email2_sent_at IS NULL,
//          email1_sent_at <= now - email2_delay_hours):
//   - "Vaša korpa je još uvek tu" - poslednje podsećanje
//
// Pozivan od cron-tick svakih 15 min (preko pg_cron). Throttle: max BATCH_SIZE * 2 mejlova po runu.
// Preskače redove gde je status != 'pending' (converted/abandoned/unsubscribed),
// ili je email u suppression listi (unsubscribed_at IS NOT NULL ili converted_at IS NOT NULL).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { loadSmtpSender } from "../_shared/smtp-runner.ts";
import { abandonedCartHtml, type AbandonedCartItem } from "../_shared/recovery-emails.ts";

const BATCH_SIZE = 25;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

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

  const { data: rs } = await admin
    .from("recovery_settings").select("*").eq("id", 1).maybeSingle();
  if (!rs?.abandoned_cart_enabled) {
    return json({ skipped: true, reason: "abandoned_cart_enabled=false" }, 200);
  }

  const stage1Minutes = Number(rs.email1_delay_minutes ?? 30);
  const stage2Hours = Number(rs.email2_delay_hours ?? 72);

  const sender = await loadSmtpSender(admin);
  if ("error" in sender) return json({ error: sender.error }, 200);

  const now = Date.now();
  const stage1Cutoff = new Date(now - stage1Minutes * 60_000).toISOString();
  const stage2Cutoff = new Date(now - stage2Hours * 3600_000).toISOString();

  // STAGE 1
  const { data: stage1Carts, error: s1Err } = await admin
    .from("abandoned_carts")
    .select("*")
    .eq("status", "pending")
    .is("email1_sent_at", null)
    .is("unsubscribed_at", null)
    .is("converted_at", null)
    .lte("updated_at", stage1Cutoff)
    .not("email", "is", null)
    .order("updated_at", { ascending: true })
    .limit(BATCH_SIZE);
  if (s1Err) return json({ error: s1Err.message }, 500);

  // STAGE 2
  const { data: stage2Carts, error: s2Err } = await admin
    .from("abandoned_carts")
    .select("*")
    .eq("status", "pending")
    .not("email1_sent_at", "is", null)
    .is("email2_sent_at", null)
    .is("unsubscribed_at", null)
    .is("converted_at", null)
    .lte("email1_sent_at", stage2Cutoff)
    .not("email", "is", null)
    .order("email1_sent_at", { ascending: true })
    .limit(BATCH_SIZE);
  if (s2Err) return json({ error: s2Err.message }, 500);

  const results: Array<{ id: string; stage: number; status: string; error?: string }> = [];

  for (const cart of (stage1Carts ?? [])) {
    const r = await sendStage(admin, sender, cart, 1, { siteUrl });
    results.push({ id: cart.id, stage: 1, ...r });
  }
  for (const cart of (stage2Carts ?? [])) {
    const r = await sendStage(admin, sender, cart, 2, { siteUrl });
    results.push({ id: cart.id, stage: 2, ...r });
  }

  return json({
    processed: results.length,
    stage1: stage1Carts?.length ?? 0,
    stage2: stage2Carts?.length ?? 0,
    results,
  }, 200);
});

async function sendStage(
  admin: ReturnType<typeof createClient>,
  sender: { send: (o: { to: string; subject: string; html: string }) => Promise<void> },
  cart: Record<string, unknown>,
  stage: 1 | 2,
  opts: { siteUrl: string },
): Promise<{ status: string; error?: string }> {
  try {
    const items = Array.isArray(cart.items) ? (cart.items as AbandonedCartItem[]) : [];
    if (items.length === 0) {
      // prazna korpa - markiraj 'abandoned' da je worker vise ne pokupi
      await admin.from("abandoned_carts")
        .update({ status: "abandoned" })
        .eq("id", cart.id as string);
      return { status: "skipped_empty" };
    }

    const total = Number(cart.total ?? items.reduce((s, it) => s + it.price * it.quantity, 0));
    const token = String(cart.recovery_token || "");
    const resumeUrl = `${opts.siteUrl}/checkout?recover=${token}`;
    const unsubscribeUrl = `${opts.siteUrl}/api/cart-unsubscribe?token=${token}`;

    const html = abandonedCartHtml({
      stage,
      customerName: String(cart.customer_name || ""),
      items,
      total,
      resumeUrl,
      unsubscribeUrl,
      siteUrl: opts.siteUrl,
    });

    const subject = stage === 1
      ? "Vaša korpa Vas čeka"
      : "Vaša korpa je još uvek tu";

    await sender.send({ to: String(cart.email), subject, html });

    const update: Record<string, unknown> = stage === 1
      ? { email1_sent_at: new Date().toISOString() }
      : { email2_sent_at: new Date().toISOString(), status: "abandoned" };
    // Posle stage 2, prelazimo u 'abandoned' (sva komunikacija završena bez konverzije).
    await admin.from("abandoned_carts").update(update).eq("id", cart.id as string);

    await admin.from("email_logs").insert({
      recipient: String(cart.email),
      type: `cart_recovery_${stage}`,
      status: "sent",
    });
    return { status: "sent" };
  } catch (e) {
    const msg = (e as Error).message;
    await admin.from("email_logs").insert({
      recipient: String(cart.email),
      type: `cart_recovery_${stage}`,
      status: "failed",
      error_message: msg,
    });
    return { status: "failed", error: msg };
  }
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}