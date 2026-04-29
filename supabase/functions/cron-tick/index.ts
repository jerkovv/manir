// Vercel Cron entry point. Validira CRON_SECRET (constant-time), pa
// poziva worker funkcije sa istim secret-om u headeru. Ne radi posao
// sam — samo orkestrira, da bude lako dodati nove worker-e kasnije.
// deploy-touch: 2026-04-29

import { corsHeaders } from "../_shared/cors.ts";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const expected = Deno.env.get("CRON_SECRET") || "";
  // Vercel Cron šalje "Authorization: Bearer <CRON_SECRET>"; mi takođe podržavamo
  // direktan x-cron-secret header za ručno testiranje.
  const authHeader = req.headers.get("Authorization") || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const provided = req.headers.get("x-cron-secret") || bearer;

  if (!expected || !provided || !timingSafeEqual(provided, expected)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const base = `${Deno.env.get("SUPABASE_URL")}/functions/v1`;
  const headers = {
    "Content-Type": "application/json",
    "x-cron-secret": expected,
    // Edge funkcije sa verify_jwt=false svakako ne traže JWT, ali šaljemo
    // anon key da ne dobijemo 401 od edge gateway-a.
    "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
  };

  const workers = ["send-review-emails", "send-abandoned-cart-emails"];
  const results: Record<string, unknown> = {};

  for (const w of workers) {
    try {
      const res = await fetch(`${base}/${w}`, { method: "POST", headers, body: "{}" });
      const text = await res.text();
      let parsed: unknown = text;
      try { parsed = JSON.parse(text); } catch { /* leave as text */ }
      results[w] = { status: res.status, body: parsed };
    } catch (e) {
      results[w] = { error: (e as Error).message };
    }
  }

  return json({ ok: true, ranAt: new Date().toISOString(), results }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}