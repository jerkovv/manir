import { corsHeaders } from "../_shared/cors.ts";
import { requirePermission } from "../_shared/require-permission.ts";
import { sendSystemEmail, inviteEmailHtml } from "../_shared/smtp-sender.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requirePermission(req, "manage_users", corsHeaders);
  if (auth instanceof Response) return auth;
  const { actor, admin } = auth;

  let body: { user_id?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (!body.user_id) return json({ error: "user_id obavezan" }, 400);

  const { data: target } = await admin
    .from("app_users").select("id, email, full_name, role, status").eq("id", body.user_id).maybeSingle();
  if (!target) return json({ error: "Korisnik nije pronađen" }, 404);
  if (target.status !== "invited") return json({ error: "Korisnik već nije u 'invited' statusu" }, 400);

  const siteUrl = req.headers.get("origin") || Deno.env.get("SITE_URL") || "";
  const redirectTo = `${siteUrl}/admin/set-password`;

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "invite",
    email: target.email,
    options: { redirectTo },
  });
  if (linkErr || !linkData?.properties?.action_link) {
    return json({ error: linkErr?.message || "Greška pri generisanju linka" }, 500);
  }

  const html = inviteEmailHtml({
    inviterName: actor.full_name || actor.email,
    recipientName: target.full_name || "",
    role: target.role,
    inviteUrl: linkData.properties.action_link,
  });
  const result = await sendSystemEmail({
    admin,
    to: target.email,
    subject: "Podsetnik: Pozivnica za 0202 SKIN admin panel",
    html,
    replyTo: actor.email,
  });

  await admin.from("user_audit_log").insert({
    actor_id: actor.id,
    actor_email: actor.email,
    target_id: target.id,
    target_email: target.email,
    action: "invite_resent",
    metadata: { email_sent: result.sent, email_error: result.error || null },
  });

  return json({ ok: true, email_sent: result.sent, email_error: result.error || null }, 200);

  function json(b: unknown, s: number) {
    return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
// redeploy: simple-smtp v2 (1777309864)
