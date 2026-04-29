// Manuelno slanje review email-a iz admin panela.
// Auth: requirePermission("manage_orders") — proverava JWT + app_users.role.
//
// Body: { order_id: uuid }
//
// Logika (decision tree iz get_resend_status_for_order):
//   - create             → kreiraj nove tokene + pošalji
//   - reuse              → dohvati aktivne tokene + pošalji isti email
//   - regenerate         → svi expired (niko used) → refresh sve + pošalji
//   - regenerate_partial → neki used + neki expired → refresh samo expired + pošalji
//   - skip_all_used      → 409, ne šalje ništa

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { requirePermission } from "../_shared/require-permission.ts";
import { loadSmtpSender } from "../_shared/smtp-runner.ts";
import { reviewReminderHtml, type ReviewEmailItem } from "../_shared/recovery-emails.ts";

type TokenRow = {
  out_token: string;
  out_product_id: string;
  out_product_name: string;
  out_product_image: string | null;
  out_is_new?: boolean;
};

type ResendStatus = {
  tokens_count: number;
  tokens_used_count: number;
  tokens_active_count: number;
  tokens_expired_count: number;
  can_resend: boolean;
  suggested_action:
    | "create"
    | "reuse"
    | "regenerate"
    | "regenerate_partial"
    | "skip_all_used";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Auth
  const auth = await requirePermission(req, "manage_orders", corsHeaders);
  if (auth instanceof Response) return auth;
  const { admin } = auth;

  // Body parse + validate
  let body: { order_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const orderId = (body?.order_id || "").trim();
  if (!orderId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
    return json({ error: "order_id (uuid) is required" }, 400);
  }

  // Učitaj porudžbinu
  const { data: order, error: oErr } = await admin
    .from("orders")
    .select("id, customer_email, customer_name, status, review_email_sent_count")
    .eq("id", orderId)
    .maybeSingle();
  if (oErr) return json({ error: oErr.message }, 500);
  if (!order) return json({ error: "Order not found" }, 404);
  if (!order.customer_email) return json({ error: "Order has no customer_email" }, 422);

  // Status
  const { data: statusRows, error: sErr } = await admin.rpc(
    "get_resend_status_for_order",
    { _order_id: orderId },
  );
  if (sErr) return json({ error: `status rpc: ${sErr.message}` }, 500);
  const status = (Array.isArray(statusRows) ? statusRows[0] : statusRows) as ResendStatus | undefined;
  if (!status) return json({ error: "Cannot read resend status" }, 500);

  const action = status.suggested_action;
  let tokens: TokenRow[] = [];

  switch (action) {
    case "create": {
      const { data, error } = await admin.rpc("create_review_tokens_for_order", { _order_id: orderId });
      if (error) return json({ error: `create rpc: ${error.message}` }, 500);
      tokens = (data as TokenRow[]) ?? [];
      break;
    }
    case "reuse": {
      const { data, error } = await admin
        .from("review_tokens")
        .select("token, product_id, products(name, images)")
        .eq("order_id", orderId)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString());
      if (error) return json({ error: `reuse select: ${error.message}` }, 500);
      tokens = ((data ?? []) as Array<{
        token: string;
        product_id: string;
        products: { name: string; images: string[] | null } | null;
      }>).map((t) => ({
        out_token: t.token,
        out_product_id: t.product_id,
        out_product_name: t.products?.name ?? "",
        out_product_image: t.products?.images?.[0] ?? null,
      }));
      break;
    }
    case "regenerate":
    case "regenerate_partial": {
      const { data, error } = await admin.rpc("regenerate_review_tokens_for_order", { _order_id: orderId });
      if (error) return json({ error: `regenerate rpc: ${error.message}` }, 500);
      tokens = (data as TokenRow[]) ?? [];
      break;
    }
    case "skip_all_used":
      return json(
        {
          error: "Sve recenzije su već poslate za ovu porudžbinu",
          action,
          tokens_used_count: status.tokens_used_count,
          tokens_count: status.tokens_count,
        },
        409,
      );
    default:
      return json({ error: `Unknown suggested_action: ${action}` }, 500);
  }

  if (tokens.length === 0) {
    return json({ error: "Nema aktivnih review linkova za slanje", action }, 422);
  }

  // SMTP
  const sender = await loadSmtpSender(admin);
  if ("error" in sender) return json({ error: sender.error }, 500);

  const siteUrl = (Deno.env.get("PUBLIC_SITE_URL") || "https://0202skin.com").replace(/\/+$/, "");

  const items: ReviewEmailItem[] = tokens.map((t) => ({
    product_name: t.out_product_name,
    product_image: t.out_product_image,
    review_url: `${siteUrl}/oceni?token=${t.out_token}`,
  }));

  const html = reviewReminderHtml({
    customerName: order.customer_name || "",
    items,
    siteUrl,
  });

  try {
    await sender.send({
      to: order.customer_email,
      subject: "Kako ste se snašli? · 0202skin",
      html,
      htmlOnly: true,
    });
  } catch (e) {
    const msg = (e as Error).message;
    await admin.from("email_logs").insert({
      order_id: orderId,
      recipient: order.customer_email,
      type: "review_reminder",
      status: "failed",
      error_message: `[manual] ${msg}`,
    });
    return json({ error: `SMTP greška: ${msg}` }, 502);
  }

  // Update tracking
  const newCount = (order.review_email_sent_count ?? 0) + 1;
  await admin
    .from("orders")
    .update({
      review_email_sent: true,
      review_email_sent_at: new Date().toISOString(),
      review_email_sent_count: newCount,
    })
    .eq("id", orderId);

  await admin.from("email_logs").insert({
    order_id: orderId,
    recipient: order.customer_email,
    type: "review_reminder",
    status: "sent",
    error_message: `[manual:${action}]`,
  });

  return json(
    {
      ok: true,
      action,
      email_sent_to: order.customer_email,
      tokens_active_count: tokens.length,
      tokens_used_count: status.tokens_used_count,
      tokens_expired_count: status.tokens_expired_count,
      tokens_count: status.tokens_count + (action === "create" ? tokens.length : 0),
      review_email_sent_count: newCount,
    },
    200,
  );
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}