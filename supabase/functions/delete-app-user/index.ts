import { corsHeaders } from "../_shared/cors.ts";
import { requirePermission } from "../_shared/require-permission.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requirePermission(req, "manage_users", corsHeaders);
  if (auth instanceof Response) return auth;
  const { actor, admin } = auth;

  // Samo owner sme da briše
  if (actor.role !== "owner") {
    return json({ error: "Samo owner može brisati korisnike" }, 403);
  }

  let body: { user_id?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (!body.user_id) return json({ error: "user_id obavezan" }, 400);

  if (body.user_id === actor.id) {
    return json({ error: "Ne možete obrisati sebe" }, 403);
  }

  const { data: target } = await admin
    .from("app_users").select("id, email, role").eq("id", body.user_id).maybeSingle();
  if (!target) return json({ error: "Korisnik nije pronađen" }, 404);

  if (target.role === "owner") {
    const { count } = await admin.from("app_users").select("*", { count: "exact", head: true })
      .eq("role", "owner").eq("status", "active");
    if ((count ?? 0) <= 1) return json({ error: "Ne možete obrisati poslednjeg owner-a" }, 403);
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(body.user_id);
  if (delErr) return json({ error: delErr.message }, 500);

  await admin.from("user_audit_log").insert({
    actor_id: actor.id,
    actor_email: actor.email,
    target_id: target.id,
    target_email: target.email,
    action: "deleted",
    metadata: { role: target.role },
  });

  return json({ ok: true }, 200);

  function json(b: unknown, s: number) {
    return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});