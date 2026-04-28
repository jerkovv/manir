// Public endpoint za /oceni stranicu.
// GET  ?token=...        → vraća info o proizvodu (preko get_review_token_info RPC)
// POST { token, rating, review_text, reviewer_name } → submituje review

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const TOKEN_RE = /^[a-f0-9]{48}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  if (req.method === "GET") {
    const token = new URL(req.url).searchParams.get("token") || "";
    if (!TOKEN_RE.test(token)) return json({ error: "Invalid token" }, 400);
    const { data, error } = await admin.rpc("get_review_token_info", { _token: token });
    if (error) return json({ error: error.message }, 500);
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return json({ error: "Token not found or expired" }, 404);
    }
    return json({ data: Array.isArray(data) ? data[0] : data }, 200);
  }

  if (req.method === "POST") {
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const token = String(body.token || "");
    const rating = Number(body.rating);
    const reviewText = String(body.review_text || "").trim();
    const reviewerName = String(body.reviewer_name || "").trim();

    if (!TOKEN_RE.test(token)) return json({ error: "Invalid token" }, 400);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return json({ error: "Rating must be 1-5" }, 400);
    }
    if (reviewText.length > 2000) return json({ error: "Review too long" }, 400);
    if (reviewerName.length > 100) return json({ error: "Name too long" }, 400);

    const { data, error } = await admin.rpc("submit_review_by_token", {
      _token: token,
      _rating: rating,
      _review_text: reviewText || null,
      _reviewer_name: reviewerName || null,
    });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true, review_id: data }, 200);
  }

  return json({ error: "Method not allowed" }, 405);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}