import { corsHeaders } from "../_shared/cors.ts";
import { requirePermission } from "../_shared/require-permission.ts";

interface Payload {
  user_id: string;
  role?: "admin" | "editor" | "viewer" | "owner";
  status?: "active" | "suspended";
  full_name?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requirePermission(req, "manage_users", corsHeaders);
  if (auth instanceof Response) return auth;
  const { actor, admin } = auth;

  let body: Payload;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  if (!body.user_id) return json({ error: "user_id obavezan" }, 400);

  const { data: target, error: tErr } = await admin
    .from("app_users").select("id, email, role, status").eq("id", body.user_id).maybeSingle();
  if (tErr || !target) return json({ error: "Korisnik nije pronađen" }, 404);

  // Safety: niko ne sme menjati owner-a osim drugog owner-a
  if (target.role === "owner" && actor.role !== "owner") {
    return json({ error: "Samo owner može menjati owner-a" }, 403);
  }
  // Safety: ne smeš sebi menjati ulogu/status
  if (target.id === actor.id && (body.role || body.status)) {
    return json({ error: "Ne možete menjati sopstvenu ulogu/status" }, 403);
  }
  // Safety: ne sme se postaviti owner kroz ovaj endpoint
  if (body.role === "owner") {
    return json({ error: "Owner uloga se ne može dodeliti kroz ovaj endpoint" }, 403);
  }
  // Safety: ne smeš suspendovati/skinuti poslednjeg aktivnog owner-a
  if (target.role === "owner" && body.status === "suspended") {
    const { count } = await admin.from("app_users").select("*", { count: "exact", head: true })
      .eq("role", "owner").eq("status", "active");
    if ((count ?? 0) <= 1) return json({ error: "Mora postojati bar jedan aktivan owner" }, 403);
  }

  const patch: Record<string, unknown> = {};
  if (body.role) patch.role = body.role;
  if (body.status) patch.status = body.status;
  if (typeof body.full_name === "string") patch.full_name = body.full_name;

  if (Object.keys(patch).length === 0) return json({ error: "Nema izmena" }, 400);

  const { error: upErr } = await admin.from("app_users").update(patch).eq("id", body.user_id);
  if (upErr) return json({ error: upErr.message }, 500);

  // Ako je suspendovan — odjavi sve njegove sesije
  if (body.status === "suspended") {
    try { await admin.auth.admin.signOut(body.user_id, "global"); } catch { /* ignore */ }
  }

  await admin.from("user_audit_log").insert({
    actor_id: actor.id,
    actor_email: actor.email,
    target_id: target.id,
    target_email: target.email,
    action: body.status ? `status_changed_${body.status}` : "role_changed",
    metadata: patch,
  });

  return json({ ok: true }, 200);

  function json(b: unknown, s: number) {
    return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});