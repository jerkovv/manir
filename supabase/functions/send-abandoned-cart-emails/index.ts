// Worker: šalje 2 talasa abandoned cart email-a.
//
// Stage 1 (recovery_email_1_sent_at IS NULL, abandoned_at <= now - stage1_minutes):
//   - šalje "zaboravili ste nešto" sa kodom iz recovery_settings.discount_code_stage1
// Stage 2 (recovery_email_1_sent_at IS NOT NULL, recovery_email_2_sent_at IS NULL,
//          recovery_email_1_sent_at <= now - stage2_hours):
//   - šalje "poslednja prilika" sa kodom iz recovery_settings.discount_code_stage2 + free shipping
//
// Pozivan od cron-tick svakih 15 min. Throttle: max BATCH_SIZE * 2 mejlova po runu.
// Preskače redove gde je status != 'pending' ili je email u suppression listi
// (recovery_unsubscribed_at IS NOT NULL ili converted_at IS NOT NULL).

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

  const stage1Minutes = Number(rs.abandoned_stage1_minutes ?? 30);
  const stage2Hours = Number(rs.abandoned_stage2_hours ?? 72);
  const code1 = rs.discount_code_stage1 || null;
  const text1 = rs.discount_text_stage1 || null;
  const code2 = rs.discount_code_stage2 || null;
  const text2 = rs.discount_text_stage2 || null;
  const freeShip2 = !!rs.free_shipping_stage2;

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
    .is("recovery_email_1_sent_at", null)
    .is("recovery_unsubscribed_at", null)
    .is("converted_at", null)
    .lte("abandoned_at", stage1Cutoff)
    .not("email", "is", null)
    .order("abandoned_at", { ascending: true })
    .limit(BATCH_SIZE);
  if (s1Err) return json({ error: s1Err.message }, 500);

  // STAGE 2
  const { data: stage2Carts, error: s2Err } = await admin
    .from("abandoned_carts")
    .select("*")
    .eq("status", "pending")
    .not("recovery_email_1_sent_at", "is", null)
    .is("recovery_email_2_sent_at", null)
    .is("recovery_unsubscribed_at", null)
    .is("converted_at", null)
    .lte("recovery_email_1_sent_at", stage2Cutoff)
    .not("email", "is", null)
    .order("recovery_email_1_sent_at", { ascending: true })
    .limit(BATCH_SIZE);
  if (s2Err) return json({ error: s2Err.message }, 500);

  const results: Array<{ id: string; stage: number; status: string; error?: string }> = [];

  for (const cart of (stage1Carts ?? [])) {
    const r = await sendStage(admin, sender, cart, 1, {
      siteUrl, code: code1, text: text1, freeShipping: false,
    });
    results.push({ id: cart.id, stage: 1, ...r });
  }
  for (const cart of (stage2Carts ?? [])) {
    const r = await sendStage(admin, sender, cart, 2, {
      siteUrl, code: code2, text: text2, freeShipping: freeShip2,
    });
    results.push({ id: cart.id, stage: 2, ...r });
  }

  return json({ processed: results.length, stage1: stage1Carts?.length ?? 0, stage2: stage2Carts?.length ?? 0, results }, 200);
});

async function sendStage(
  admin: ReturnType<typeof createClient>,
  sender: { send: (o: { to: string; subject: string; html: string }) => Promise<void> },
  cart: Record<string, unknown>,
  stage: 1 | 2,
  opts: { siteUrl: string; code: string | null; text: string | null; freeShipping: boolean },
): Promise<{ status: string; error?: string }> {
  try {
    const items = Array.isArray(cart.items) ? (cart.items as AbandonedCartItem[]) : [];
    if (items.length === 0) {
      // prazna korpa — markiraj abandoned da ne baulja
      await admin.from("abandoned_carts").update({ status: "abandoned" }).eq("id", cart.id as string);
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
      discountCode: opts.code,
      discountText: opts.text,
      freeShipping: opts.freeShipping,
    });

    const subject = stage === 1
      ? "Zaboravili ste nešto u korpi · 0202skin"
      : "Poslednja prilika · 0202skin";

    await sender.send({ to: String(cart.email), subject, html });

    const update: Record<string, unknown> = stage === 1
      ? { recovery_email_1_sent_at: new Date().toISOString() }
      : { recovery_email_2_sent_at: new Date().toISOString() };
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