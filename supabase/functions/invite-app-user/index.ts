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

  const siteUrl = req.headers.get("origin") || Deno.env.get("SITE_URL") || "";
  const redirectTo = `${siteUrl}/admin/set-password`;

  // Pozovi korisnika kroz Supabase invite tok (kreira auth user i generiše invite link)
  const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo,
  });
  if (inviteErr || !inviteData?.user?.id) {
    return json({ error: `Greška pri pozivu: ${inviteErr?.message || "unknown"}` }, 500);
  }
  const newUserId = inviteData.user.id;

  // Generiši svoj invite link (sa ispravnim redirectTo) za slanje preko našeg SMTP-a
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo },
  });
  if (linkErr || !linkData?.properties?.action_link) {
    return json({ error: `Greška pri generisanju linka: ${linkErr?.message || "unknown"}` }, 500);
  }
  const inviteUrl = linkData.properties.action_link;

  // Insert u app_users (status: invited dok ne postavi lozinku)
  const { error: insErr } = await admin.from("app_users").insert({
    id: newUserId,
    email,
    full_name: fullName,
    role,
    status: "invited",
    invited_by: actor.id,
  });
  if (insErr) {
    await admin.auth.admin.deleteUser(newUserId);
    return json({ error: `DB greška: ${insErr.message}` }, 500);
  }

  const html = inviteEmailHtml({
    inviterName: actor.full_name || actor.email,
    recipientName: fullName,
    role,
    inviteUrl,
  });
  const result = await sendSystemEmail({
    admin,
    to: email,
    subject: "Pozivnica za 0202 SKIN admin panel",
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
    // Fallback: ako email padne, vrati invite link adminu da ga manuelno prosledi
    fallback_invite_url: result.sent ? null : inviteUrl,
  }, 200);

  function json(b: unknown, s: number) {
    return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
// redeploy: invite-link v3
