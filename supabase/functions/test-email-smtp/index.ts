// supabase/functions/test-email-smtp/index.ts
//
// Šalje testni email koristeći SMTP parametre IZ REQUEST BODY-ja
// (ne čita iz baze) - tako admin može da testira pre nego što sačuva.
// Zahteva da pozivalac bude ulogovan kao admin.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { sendSmtpEmail } from "../_shared/simple-smtp.ts";

interface TestPayload {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  smtp_secure: boolean;
  from_name: string;
  from_email: string;
  test_recipient: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // --- Auth: mora biti admin ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: uErr } = await userClient.auth.getUser();
  if (uErr || !userData?.user) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }

  // Provera admin role-a preko has_role RPC funkcije
  const { data: isAdmin, error: rErr } = await userClient.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (rErr || !isAdmin) {
    return json({ success: false, error: "Forbidden — admin only" }, 403);
  }

  // --- Payload ---
  let p: TestPayload;
  try {
    p = await req.json();
  } catch {
    return json({ success: false, error: "Invalid JSON" }, 400);
  }

  const required = ["smtp_host", "smtp_port", "smtp_user", "smtp_password", "from_email", "test_recipient"];
  for (const k of required) {
    if (!p[k as keyof TestPayload]) {
      return json({ success: false, error: `Nedostaje polje: ${k}` }, 400);
    }
  }

  const fromAddr = `${p.from_name || "0202skin"} <${p.from_email}>`;

  try {
    const port = Number(p.smtp_port);
    // Port 465 = implicit TLS; 587/25 = STARTTLS (TLS pregovor nakon konekcije)
    const useImplicitTls = port === 465 || (!!p.smtp_secure && port === 465);

    await sendSmtpEmail({
      hostname: p.smtp_host,
      port,
      tls: useImplicitTls,
      username: p.smtp_user,
      password: p.smtp_password,
    }, {
      from: fromAddr,
      to: p.test_recipient,
      subject: "Test poruka iz 0202skin admin panela",
      text: "Ovo je test poruka. Ako je vidite, SMTP konekcija radi ispravno.",
      html: `<p>Ovo je <strong>test poruka</strong> iz 0202skin admin panela.</p>
             <p>Ako je vidite, SMTP konekcija radi ispravno.</p>`,
    });

    return json({ success: true, message: `Test email poslat na ${p.test_recipient}` }, 200);
  } catch (e) {
    const msg = (e as Error).message || String(e);
    return json({ success: false, error: msg }, 200);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// redeploy: simple-smtp v2 (1777309864)
