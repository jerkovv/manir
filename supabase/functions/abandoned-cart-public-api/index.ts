// Public endpoint za abandoned cart.
// POST { email, customer_name?, items, total, source? } → upsert (checkout + exit popup)
// GET  ?token=...&action=unsubscribe → odjavljuje email iz daljih recovery mejlova
// GET  ?token=...&action=convert     → markira kao converted (poziva se sa thank-you stranice)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_RE = /^[a-f0-9]{48}$/i;
const VALID_SOURCES = new Set(["checkout", "exit_intent", "other"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const siteUrl = (Deno.env.get("PUBLIC_SITE_URL") || "https://0202skin.com").replace(/\/+$/, "");

  if (req.method === "GET") {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || "";
    const action = url.searchParams.get("action") || "unsubscribe";
    const confirm = url.searchParams.get("confirm") === "true";
    const wantsJson = url.searchParams.get("format") === "json"
      || (req.headers.get("accept") || "").includes("application/json");
    if (!TOKEN_RE.test(token)) {
      return wantsJson ? json({ ok: false, status: "invalid_token" }, 200) : redirectMsg(siteUrl, "invalid_token");
    }

    if (action === "unsubscribe") {
      // Anti-prefetch zaštita: GET bez confirm=true samo verifikuje token,
      // NE menja state. Pravi unsubscribe ide preko POST ili GET sa confirm=true.
      if (!confirm) {
        const { data: cart } = await admin
          .from("abandoned_carts")
          .select("email, unsubscribed_at")
          .eq("recovery_token", token)
          .maybeSingle();
        if (!cart) {
          return wantsJson ? json({ ok: false, status: "invalid_token" }, 200) : redirectMsg(siteUrl, "invalid_token");
        }
        if (cart.unsubscribed_at) {
          return wantsJson ? json({ ok: true, status: "already_unsubscribed", email: cart.email }, 200) : redirectMsg(siteUrl, "already_unsubscribed");
        }
        return wantsJson ? json({ ok: true, status: "pending", email: cart.email }, 200) : redirectMsg(siteUrl, "pending");
      }
      const { data, error } = await admin.rpc("unsubscribe_abandoned_cart", { _token: token });
      if (error) {
        return wantsJson ? json({ ok: false, status: "error", message: error.message }, 200) : redirectMsg(siteUrl, "error");
      }
      const status = data ? "unsubscribed" : "invalid_token";
      return wantsJson ? json({ ok: !!data, status }, 200) : redirectMsg(siteUrl, status);
    }
    if (action === "convert") {
      await admin.from("abandoned_carts")
        .update({ status: "converted", converted_at: new Date().toISOString() })
        .eq("recovery_token", token);
      return json({ ok: true }, 200);
    }
    if (action === "recover") {
      const { data: cart, error } = await admin
        .from("abandoned_carts")
        .select("email, customer_name, cart_data, cart_total, status, unsubscribed_at, converted_at")
        .eq("recovery_token", token)
        .maybeSingle();
      if (error) return json({ ok: false, status: "error", message: error.message }, 200);
      if (!cart) return json({ ok: false, status: "invalid_token" }, 200);
      if (cart.unsubscribed_at || cart.status === "unsubscribed") {
        return json({ ok: false, status: "unsubscribed" }, 200);
      }
      if (cart.status === "converted" || cart.converted_at) {
        return json({ ok: false, status: "converted" }, 200);
      }
      const items = Array.isArray(cart.cart_data) ? cart.cart_data : [];
      if (items.length === 0) {
        return json({ ok: false, status: "empty" }, 200);
      }
      return json({
        ok: true,
        status: "recovered",
        email: cart.email,
        customer_name: cart.customer_name,
        items,
        total: Number(cart.cart_total) || 0,
      }, 200);
    }
    return json({ error: "Unknown action" }, 400);
  }

  if (req.method === "POST") {
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    // Unsubscribe preko POST: { action: "unsubscribe", token }
    if (body.action === "unsubscribe") {
      const token = String(body.token || "");
      if (!TOKEN_RE.test(token)) return json({ ok: false, status: "invalid_token" }, 200);
      const { data, error } = await admin.rpc("unsubscribe_abandoned_cart", { _token: token });
      if (error) return json({ ok: false, status: "error", message: error.message }, 200);
      return json({ ok: !!data, status: data ? "unsubscribed" : "invalid_token" }, 200);
    }

    const email = String(body.email || "").toLowerCase().trim();
    if (!EMAIL_RE.test(email)) return json({ error: "Invalid email" }, 400);
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return json({ error: "Items required" }, 400);
    }
    if (body.items.length > 50) return json({ error: "Too many items" }, 400);

    const total = Number(body.total ?? 0);
    if (!Number.isFinite(total) || total < 0) return json({ error: "Invalid total" }, 400);

    const customerName = body.customer_name ? String(body.customer_name).slice(0, 100) : null;
    const source = (typeof body.source === "string" && VALID_SOURCES.has(body.source))
      ? body.source : "checkout";

    const { data, error } = await admin.rpc("upsert_abandoned_cart", {
      _email: email,
      _customer_name: customerName,
      _cart_data: body.items,
      _cart_total: total,
      _source: source,
    });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true, id: data }, 200);
  }

  return json({ error: "Method not allowed" }, 405);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function redirectMsg(siteUrl: string, code: string): Response {
  const url = `${siteUrl}/?cart_status=${encodeURIComponent(code)}`;
  return new Response(null, {
    status: 302,
    headers: { ...corsHeaders, Location: url },
  });
}