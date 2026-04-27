import { corsHeaders } from "../_shared/cors.ts";
import { requirePermission } from "../_shared/require-permission.ts";

// redeploy bump v2

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requirePermission(req, "manage_orders", corsHeaders);
  if (auth instanceof Response) return auth;
  const { actor, admin } = auth;

  let body: { order_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Neispravan zahtev" }, 200);
  }

  if (!body.order_id) return json({ error: "ID porudžbine je obavezan" }, 200);

  const { data: order, error: findErr } = await admin
    .from("orders")
    .select("id, order_number, customer_email")
    .eq("id", body.order_id)
    .maybeSingle();

  if (findErr) return json({ error: findErr.message }, 200);
  if (!order) return json({ error: "Porudžbina nije pronađena ili je već obrisana" }, 200);

  const { error: itemsErr } = await admin.from("order_items").delete().eq("order_id", body.order_id);
  if (itemsErr) return json({ error: itemsErr.message }, 200);

  const { error: orderErr, count } = await admin
    .from("orders")
    .delete({ count: "exact" })
    .eq("id", body.order_id);

  if (orderErr) return json({ error: orderErr.message }, 200);
  if ((count ?? 0) !== 1) return json({ error: "Porudžbina nije obrisana" }, 200);

  await admin.from("user_audit_log").insert({
    actor_id: actor.id,
    actor_email: actor.email,
    target_id: order.id,
    target_email: order.customer_email,
    action: "deleted_order",
    metadata: { order_number: order.order_number },
  });

  return json({ ok: true, deleted_id: order.id }, 200);

  function json(b: unknown, s: number) {
    return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});