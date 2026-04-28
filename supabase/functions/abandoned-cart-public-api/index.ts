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
    if (!TOKEN_RE.test(token)) return redirectMsg(siteUrl, "invalid_token");

    if (action === "unsubscribe") {
      const { data, error } = await admin.rpc("unsubscribe_abandoned_cart", { _token: token });
      if (error) return redirectMsg(siteUrl, "error");
      return redirectMsg(siteUrl, data ? "unsubscribed" : "invalid_token");
    }
    if (action === "convert") {
      await admin.from("abandoned_carts")
        .update({ status: "converted", converted_at: new Date().toISOString() })
        .eq("recovery_token", token);
      return json({ ok: true }, 200);
    }
    return json({ error: "Unknown action" }, 400);
  }

  if (req.method === "POST") {
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

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
      _items: body.items,
      _total: total,
      _customer_name: customerName,
      _source: source,
    });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true, id: data }, 200);
  }

  return json({ error: "Method not allowed" }, 405);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function redirectMsg(siteUrl: string, code: string): Response {
  const url = `${siteUrl}/?cart_status=${encodeURIComponent(code)}`;
  return new Response(null, {
    status: 302,
    headers: { ...corsHeaders, Location: url },
  });
}