import { corsHeaders } from "../_shared/cors.ts";
import { requirePermission } from "../_shared/require-permission.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  const auth = await requirePermission(req, "manage_orders", corsHeaders);
  if (auth instanceof Response) return auth;
  const { actor, admin } = auth;

  let body: { customer_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Neispravan zahtev" }, 200);
  }

  if (!body.customer_id) return json({ error: "ID kupca je obavezan" }, 200);

  const { data: customer, error: findErr } = await admin
    .from("customers")
    .select("id, email, first_name, last_name")
    .eq("id", body.customer_id)
    .maybeSingle();

  if (findErr) return json({ error: findErr.message }, 200);
  if (!customer) return json({ error: "Kupac nije pronađen ili je već obrisan" }, 200);

  const { error: unlinkErr } = await admin
    .from("orders")
    .update({ customer_id: null })
    .eq("customer_id", body.customer_id);
  if (unlinkErr) return json({ error: unlinkErr.message }, 200);

  const { error: deleteErr, count } = await admin
    .from("customers")
    .delete({ count: "exact" })
    .eq("id", body.customer_id);

  if (deleteErr) return json({ error: deleteErr.message }, 200);
  if ((count ?? 0) !== 1) return json({ error: "Kupac nije obrisan" }, 200);

  await admin.from("user_audit_log").insert({
    actor_id: actor.id,
    actor_email: actor.email,
    target_id: customer.id,
    target_email: customer.email,
    action: "deleted_customer",
    metadata: { name: `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || null },
  });

  return json({ ok: true, deleted_id: customer.id }, 200);

  function json(b: unknown, s: number) {
    return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});