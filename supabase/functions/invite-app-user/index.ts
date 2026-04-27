// Edge function: invite-app-user
// Generates a Supabase invite link for a new system user and emails it via Loopia SMTP.
import { corsHeaders } from "../_shared/cors.ts";
import { requirePermission } from "../_shared/require-permission.ts";
import { sendSystemEmail, inviteEmailHtml } from "../_shared/smtp-sender.ts";

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
  const { data: existing } = await admin
    .from("app_users").select("id").eq("email", email).maybeSingle();
  if (existing) return json({ error: "Korisnik sa ovim email-om već postoji" }, 409);

  // Generiši invite link preko Supabase Auth
  const siteUrl = req.headers.get("origin") || Deno.env.get("SITE_URL") || "";
  const redirectTo = `${siteUrl}/admin/login`;

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo, data: { full_name: fullName } },
  });

  if (linkErr || !linkData?.properties?.action_link) {
    return json({ error: `Greška pri generisanju poziva: ${linkErr?.message || "unknown"}` }, 500);
  }
  const newUserId = linkData.user?.id;
  const inviteUrl = linkData.properties.action_link;

  if (!newUserId) return json({ error: "Auth nije vratio user id" }, 500);

  // Insert u app_users
  const { error: insErr } = await admin.from("app_users").insert({
    id: newUserId,
    email,
    full_name: fullName,
    role,
    status: "invited",
    invited_by: actor.id,
  });
  if (insErr) return json({ error: `DB greška: ${insErr.message}` }, 500);

  // Pošalji custom email preko Loopia SMTP
  const html = inviteEmailHtml({
    inviterName: actor.full_name || actor.email,
    recipientName: fullName,
    role,
    inviteUrl,
  });
  const result = await sendSystemEmail({
    admin,
    to: email,
    subject: "Pozvani ste u 0202 SKIN admin panel",
    html,
    replyTo: actor.email,
  });

  // Audit log
  await admin.from("user_audit_log").insert({
    actor_id: actor.id,
    actor_email: actor.email,
    target_id: newUserId,
    target_email: email,
    action: "invited",
    metadata: { role, email_sent: result.sent, email_error: result.error || null },
  });

  return json({
    ok: true,
    user_id: newUserId,
    email_sent: result.sent,
    email_error: result.error || null,
    invite_url: result.sent ? null : inviteUrl, // fallback ako email pukne
  }, 200);

  function json(b: unknown, s: number) {
    return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});