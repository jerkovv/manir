// Edge function: invite-app-user
// Generates a Supabase invite link for a new system user and emails it via Loopia SMTP.
import { corsHeaders } from "../_shared/cors.ts";
import { requirePermission } from "../_shared/require-permission.ts";
import { sendSystemEmail, credentialsEmailHtml } from "../_shared/smtp-sender.ts";

interface Payload {
  email: string;
  full_name: string;
  role: "admin" | "editor" | "viewer";
}

const VALID_ROLES = ["admin", "editor", "viewer"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requirePermission(req, "manage_users", corsHeaders);
  if (auth instanceof Response) return auth;
  const { actor, admin } = auth;

  let body: Payload;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const email = (body.email || "").trim().toLowerCase();
  const fullName = (body.full_name || "").trim();
  const role = body.role;

  if (!email || !email.includes("@")) return json({ error: "Nevažeći email" }, 400);
  if (!fullName) return json({ error: "Ime je obavezno" }, 400);
  if (!VALID_ROLES.includes(role)) return json({ error: "Nevažeća uloga" }, 400);

  // Postoji li već?
  // Vraćamo 200 sa flagom `already_exists` jer Supabase JS klijent tretira
  // non-2xx kao "FunctionsHttpError" i ne propušta originalnu poruku do UI-ja.
  const { data: existing } = await admin
    .from("app_users").select("id").eq("email", email).maybeSingle();
  if (existing) {
    return json({
      ok: false,
      already_exists: true,
      error: "Email je već dodat",
    }, 200);
  }

  // Generiši random lozinku (16 karaktera, alfanumerička + specijalni)
  const password = generatePassword(16);

  // Kreiraj auth korisnika sa random lozinkom (email auto-confirmed)
  const { data: createData, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createErr || !createData?.user?.id) {
    return json({ error: `Greška pri kreiranju korisnika: ${createErr?.message || "unknown"}` }, 500);
  }
  const newUserId = createData.user.id;

  const siteUrl = req.headers.get("origin") || Deno.env.get("SITE_URL") || "";
  const loginUrl = `${siteUrl}/admin/login`;

  // Insert u app_users (status: active jer je lozinka već postavljena)
  const { error: insErr } = await admin.from("app_users").insert({
    id: newUserId,
    email,
    full_name: fullName,
    role,
    status: "active",
    invited_by: actor.id,
  });
  if (insErr) {
    // Rollback auth user da ne ostane orphan
    await admin.auth.admin.deleteUser(newUserId);
    return json({ error: `DB greška: ${insErr.message}` }, 500);
  }

  // Pošalji premium email sa pristupnim podacima
  const html = credentialsEmailHtml({
    inviterName: actor.full_name || actor.email,
    recipientName: fullName,
    role,
    email,
    password,
    loginUrl,
  });
  const result = await sendSystemEmail({
    admin,
    to: email,
    subject: "Vaši pristupni podaci za 0202 SKIN admin panel",
    html,
    replyTo: actor.email,
  });

  // Audit log
  await admin.from("user_audit_log").insert({
    actor_id: actor.id,
    actor_email: actor.email,
    target_id: newUserId,
    target_email: email,
    action: "created",
    metadata: { role, email_sent: result.sent, email_error: result.error || null },
  });

  return json({
    ok: true,
    user_id: newUserId,
    email_sent: result.sent,
    email_error: result.error || null,
    // Fallback: ako email padne, vrati lozinku adminu da je manuelno prosledi
    fallback_credentials: result.sent ? null : { email, password, loginUrl },
  }, 200);

  function json(b: unknown, s: number) {
    return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function generatePassword(length: number): string {
  // Bez zbunjujućih karaktera (0/O, l/1/I)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}
// redeploy: simple-smtp v2 (1777309864)
