import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type Permission = "manage_users" | "manage_settings" | "manage_products" | "manage_orders" | "view_only";

const PERMISSION_MAP: Record<Permission, string[]> = {
  manage_users: ["owner", "admin"],
  manage_settings: ["owner", "admin"],
  manage_products: ["owner", "admin", "editor"],
  manage_orders: ["owner", "admin", "editor"],
  view_only: ["owner", "admin", "editor", "viewer"],
};

export interface AuthedActor {
  id: string;
  email: string;
  full_name: string | null;
  role: "owner" | "admin" | "editor" | "viewer";
  status: "active" | "suspended" | "invited";
}

/**
 * Verifikuje JWT iz Authorization header-a, pa proverava da li korisnik
 * ima traženu permisiju u app_users tabeli. Vraća actor ili Response sa greškom.
 */
export async function requirePermission(
  req: Request,
  perm: Permission,
  cors: Record<string, string>,
): Promise<{ actor: AuthedActor; admin: SupabaseClient } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonErr("Unauthorized", 401, cors);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Verifikacija JWT-a
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims?.sub) {
    return jsonErr("Unauthorized", 401, cors);
  }
  const userId = claimsData.claims.sub;

  // Učitaj actor preko service-role
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: actor, error: aErr } = await admin
    .from("app_users")
    .select("id, email, full_name, role, status")
    .eq("id", userId)
    .maybeSingle();

  if (aErr || !actor) return jsonErr("Forbidden: not an app user", 403, cors);
  if (actor.status !== "active") return jsonErr("Forbidden: account not active", 403, cors);
  if (!PERMISSION_MAP[perm].includes(actor.role)) {
    return jsonErr(`Forbidden: missing permission ${perm}`, 403, cors);
  }

  return { actor: actor as AuthedActor, admin };
}

function jsonErr(msg: string, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}