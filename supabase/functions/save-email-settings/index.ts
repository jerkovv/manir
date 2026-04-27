// supabase/functions/save-email-settings/index.ts
//
// Admin-only. Prima podešavanja iz UI-ja, na server strani dodaje
// EMAIL_ENC_KEY (Edge Function secret) i poziva public.upsert_email_settings.
// Tako enkripcioni ključ NIKADA ne odlazi na frontend.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

interface Payload {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string; // prazan = ne menjaj
  smtp_secure: boolean;
  from_name: string;
  from_email: string;
  admin_email: string;
  reply_to: string | null;
  customer_subject: string;
  customer_template: string;
  admin_subject: string;
  admin_template: string;
  enabled: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const encKey = Deno.env.get("EMAIL_ENC_KEY") ?? "";

  if (!encKey) {
    return json({ success: false, error: "EMAIL_ENC_KEY secret nije postavljen" }, 500);
  }

  // Klijent sa korisnikovim JWT-om — RPC se izvršava u njegovom kontekstu
  // (upsert_email_settings interno proverava admin role preko has_role).
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let p: Payload;
  try {
    p = await req.json();
  } catch {
    return json({ success: false, error: "Invalid JSON" }, 400);
  }

  const { error } = await userClient.rpc("upsert_email_settings", {
    p_smtp_host: p.smtp_host,
    p_smtp_port: p.smtp_port,
    p_smtp_user: p.smtp_user,
    p_password: p.smtp_password || "",
    p_smtp_secure: p.smtp_secure,
    p_from_name: p.from_name,
    p_from_email: p.from_email,
    p_admin_email: p.admin_email,
    p_reply_to: p.reply_to,
    p_customer_subject: p.customer_subject,
    p_customer_template: p.customer_template,
    p_admin_subject: p.admin_subject,
    p_admin_template: p.admin_template,
    p_enabled: p.enabled,
    p_enc_key: encKey,
  });

  if (error) {
    return json({ success: false, error: error.message }, 200);
  }
  return json({ success: true }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}