// supabase/functions/send-order-email/index.ts
//
// Šalje 2 email-a (kupcu + adminu) preko SMTP-a definisanog u email_settings.
// Loguje rezultat u email_logs. NIKAD ne baca grešku ka pozivaocu na način
// koji bi srušio checkout - uvek vraća 200 sa { sent, failed } summary-jem.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { sendSmtpEmail } from "../_shared/simple-smtp.ts";
import {
  customerOrderEmailHtml,
  adminOrderEmailHtml,
  type Item,
  type OrderEmailData,
} from "../_shared/order-email-templates.ts";
import { displayOrderNumber } from "../_shared/orderNumber.ts";

interface Payload {
  customerEmail?: string;
  customerName?: string;
  orderId: string | number;
  items?: Item[];
  total?: number;
  customerPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingZip?: string;
  note?: string;
  subtotal?: number;
  discountAmount?: number;
  discountLabel?: string;
  orderDate?: string;
  // ── Test mode ──────────────────────────────────────────────
  // Ako je bilo koje od testCustomerEmail/testAdminEmail prosleđeno,
  // funkcija ulazi u "test mode": ne šalje na pravog kupca/admine,
  // već samo na zadatu test adresu. Tip u email_logs postaje
  // "order_test_customer" / "order_test_admin", order_id se NE upisuje
  // (da ne kvari retry/resend logiku po orderu).
  testCustomerEmail?: string;
  testAdminEmail?: string;
  sendCustomer?: boolean; // default true
  sendAdmin?: boolean;    // default true
  // Interno: postavljeno iz hidracije (sirov order_number iz baze) ili iz
  // checkout flow-a ako pošalje. Ne dolazi spolja preko UI-ja.
  orderNumberRaw?: number | string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!payload?.orderId) {
    return json({ error: "Missing orderId" }, 400);
  }

  const isTestMode = !!(payload.testCustomerEmail || payload.testAdminEmail);
  const sendCustomer = payload.sendCustomer !== false; // default true
  const sendAdmin = payload.sendAdmin !== false;       // default true

  // Ako payload nema items (test ili "lite" poziv), hidriraj sve iz baze
  // koristeći service-role klijenta — radi i kada nema sesije i zaobilazi RLS.
  const needsHydration = !Array.isArray(payload.items) || payload.items.length === 0;
  if (needsHydration) {
    const hydrated = await hydratePayloadFromDb(
      // koristimo isti admin klijent koji je ispod
      createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } }),
      String(payload.orderId),
    );
    if (!hydrated.ok) {
      return json({ error: hydrated.error }, 200);
    }
    payload = { ...hydrated.payload, ...payload, items: hydrated.payload.items };
    // Spoj: sve iz baze + zadržati testCustomerEmail/testAdminEmail/sendCustomer/sendAdmin
    // i orderId iz originalnog payload-a. (Spread iznad već sve to čuva.)
  }

  if (!payload.customerEmail || !Array.isArray(payload.items) || payload.items.length === 0) {
    return json({ error: "Order missing customer email or items" }, 200);
  }

  // 1. Učitaj podešavanja + dekriptovanu lozinku
  const { data: settings, error: sErr } = await admin
    .from("email_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (sErr || !settings) {
    return json({ error: "Email settings not configured" }, 200);
  }
  if (!settings.enabled) {
    return json({ message: "email disabled" }, 200);
  }

  // Dekriptuj lozinku
  const { data: pwdRow, error: pErr } = await admin.rpc("decrypt_smtp_password", {
    p_cipher: settings.smtp_password,
    p_key: Deno.env.get("EMAIL_ENC_KEY") ?? "",
  });
  if (pErr) {
    return json({ error: `Decrypt failed: ${pErr.message}` }, 200);
  }
  const smtpPassword = pwdRow as string;

  // 2. Pripremi template podatke
  const totalStr = Number(payload.total).toLocaleString("sr-RS");
  const subtotalStr = payload.subtotal != null ? Number(payload.subtotal).toLocaleString("sr-RS") : "";
  const discountStr = payload.discountAmount && payload.discountAmount > 0
    ? Number(payload.discountAmount).toLocaleString("sr-RS")
    : "";

  // Broj porudžbine: preferiramo sirov order_number (kratki redni broj) iz baze.
  // Fallback na payload.orderId (može biti UUID ako je legacy poziv).
  const shortOrderNo = displayOrderNumber(payload.orderNumberRaw);
  const formattedOrderId = shortOrderNo
    ? `#${shortOrderNo}`
    : (isUuid(payload.orderId) ? `#${String(payload.orderId).slice(0, 8)}` : `#${String(payload.orderId)}`);

  const data: OrderEmailData = {
    customerName: payload.customerName || "",
    customerEmail: payload.customerEmail!,
    customerPhone: payload.customerPhone || "",
    orderId: formattedOrderId,
    items: payload.items,
    subtotal: subtotalStr,
    discountAmount: discountStr,
    discountLabel: payload.discountLabel || "",
    total: totalStr,
    shippingAddress: payload.shippingAddress || "",
    shippingCity: payload.shippingCity || "",
    shippingZip: payload.shippingZip || "",
    note: payload.note || "",
    orderDate: payload.orderDate || formatOrderDate(new Date()),
  };

  // Subject-i: kratki, bez ID-ja i bez '?' / specijalnih karaktera koji
  // razbijaju denomailer Q-encoding u Apple Mail-u (vidi mem://design/email-encoding).
  const customerSubject = "Potvrda porudžbine · 0202skin";
  const adminSubject = "Nova porudžbina · 0202skin";
  const customerHtml = customerOrderEmailHtml(data, isTestMode);
  const adminHtml = adminOrderEmailHtml(data, isTestMode);

  // Sigurnosna provera: ako iz nekog razloga template vrati prazan HTML,
  // ne pokušavaj slanje (SMTP će odbiti sa "No content provided!").
  if (!customerHtml || !customerHtml.trim() || !adminHtml || !adminHtml.trim()) {
    return json({
      error: "Email template rendered empty content",
      customerHtmlLen: customerHtml?.length ?? 0,
      adminHtmlLen: adminHtml?.length ?? 0,
    }, 200);
  }

  // 3. SMTP podešavanja
  const smtp = {
    hostname: settings.smtp_host,
    port: Number(settings.smtp_port),
    // Port 465 = implicit TLS; 587/25 = STARTTLS (tls: false)
    tls: Number(settings.smtp_port) === 465,
    username: settings.smtp_user,
    password: smtpPassword,
  };
  const fromAddr = `${settings.from_name} <${settings.from_email}>`;

  const results: Array<{ type: "customer" | "admin"; recipient?: string; status: "sent" | "failed"; error?: string }> = [];

  // 4a. Kupcu
  // U test modu šaljemo na test email umesto pravog kupca; pravi kupac NE dobija nista.
  const customerRecipient = isTestMode
    ? (payload.testCustomerEmail || "")
    : payload.customerEmail!;
  const customerLogType = isTestMode ? "order_test_customer" : "customer";
  const logOrderId = isTestMode ? null : (isUuid(payload.orderId) ? payload.orderId : null);

  if (sendCustomer && customerRecipient) {
    try {
      await sendSmtpEmail(smtp, {
        from: fromAddr,
        to: customerRecipient,
        replyTo: settings.reply_to || settings.admin_email || undefined,
        subject: isTestMode ? `[TEST] ${customerSubject}` : customerSubject,
        html: customerHtml,
        htmlOnly: true,
      });
      results.push({ type: "customer", recipient: customerRecipient, status: "sent" });
      await admin.from("email_logs").insert({
        order_id: logOrderId,
        recipient: customerRecipient,
        type: customerLogType,
        status: "sent",
      });
    } catch (e) {
      const msg = e instanceof Error
        ? `[send-order-email] ${e.message}`
        : `[send-order-email] ${String(e)}`;
      results.push({ type: "customer", recipient: customerRecipient, status: "failed", error: msg });
      await admin.from("email_logs").insert({
        order_id: logOrderId,
        recipient: customerRecipient,
        type: customerLogType,
        status: "failed",
        error_message: msg,
      });
    }
  }

  // 4b. Adminu
  // U test modu: admin email ide samo na zadatu test adresu (ako je sendAdmin = true).
  // Pravi admini iz settings/app_users/user_roles se NE kontaktiraju.
  const adminRecipients = new Set<string>();
  let adminLookupError: string | null = null;

  if (isTestMode) {
    if (sendAdmin && payload.testAdminEmail) {
      addRecipients(adminRecipients, payload.testAdminEmail);
    }
  } else if (sendAdmin) {
    // Skupi sve admin primaoce: ručno podešeni admin_email + svi aktivni korisnici admin panela.
    addRecipients(adminRecipients, settings.admin_email);
    addRecipients(adminRecipients, settings.reply_to);

    try {
      const { data: appAdmins, error: appAdminsErr } = await admin
        .from("app_users")
        .select("email, role, status");
      if (appAdminsErr) {
        adminLookupError = appAdminsErr.message;
        console.error("[send-order-email] app_users query error:", appAdminsErr);
      }
      const blockedStatuses = ["disabled", "suspended", "blocked", "deleted"];
      const roleAdmins = (appAdmins ?? []).filter((u) => {
        const status = String(u?.status ?? "active").toLowerCase().trim();
        return !blockedStatuses.includes(status);
      });
      console.log("[send-order-email] app_users total:", appAdmins?.length ?? 0, "matched:", roleAdmins.length);
      for (const u of roleAdmins) {
        addRecipients(adminRecipients, u?.email);
      }
    } catch (e) {
      adminLookupError = (e as Error).message;
      console.error("[send-order-email] app_users lookup threw:", e);
    }

    try {
      const { data: userRoles, error: userRolesErr } = await admin
        .from("user_roles")
        .select("user_id, role");
      if (userRolesErr) {
        adminLookupError = [adminLookupError, userRolesErr.message].filter(Boolean).join(" | ") || userRolesErr.message;
        console.error("[send-order-email] user_roles query error:", userRolesErr);
      } else {
        const adminRoleUserIds = new Set((userRoles ?? [])
          .filter((r) => String(r?.role ?? "").toLowerCase().trim() === "admin")
          .map((r) => String(r.user_id)));
        if (adminRoleUserIds.size > 0) {
          const { data: authUsers, error: authUsersErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          if (authUsersErr) throw authUsersErr;
          for (const u of authUsers.users ?? []) {
            if (adminRoleUserIds.has(u.id)) {
              addRecipients(adminRecipients, u.email);
              addRecipients(adminRecipients, u.user_metadata?.email);
            }
          }
          console.log("[send-order-email] found user_roles admins:", adminRoleUserIds.size);
        }
      }
    } catch (e) {
      const msg = (e as Error).message;
      adminLookupError = [adminLookupError, msg].filter(Boolean).join(" | ") || msg;
      console.error("[send-order-email] user_roles lookup threw:", e);
    }
  }

  console.log("[send-order-email] testMode:", isTestMode, "admin recipients:", Array.from(adminRecipients));

  const validEmailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const customerReplyTo = (!isTestMode && payload.customerEmail && validEmailRe.test(payload.customerEmail))
    ? payload.customerEmail
    : undefined;
  const adminLogType = isTestMode ? "order_test_admin" : "admin";

  for (const recipient of adminRecipients) {
    try {
      await sendSmtpEmail(smtp, {
        from: fromAddr,
        to: recipient,
        replyTo: customerReplyTo,
        subject: isTestMode ? `[TEST] ${adminSubject}` : adminSubject,
        html: adminHtml,
        htmlOnly: true,
      });
      results.push({ type: "admin", recipient, status: "sent" });
      await admin.from("email_logs").insert({
        order_id: logOrderId,
        recipient,
        type: adminLogType,
        status: "sent",
      });
    } catch (e) {
      const msg = e instanceof Error
        ? `[send-order-email] ${e.message}`
        : `[send-order-email] ${String(e)}`;
      results.push({ type: "admin", recipient, status: "failed", error: msg });
      await admin.from("email_logs").insert({
        order_id: logOrderId,
        recipient,
        type: adminLogType,
        status: "failed",
        error_message: msg,
      });
    }
  }

  return json({
    ok: true,
    testMode: isTestMode,
    results,
    adminRecipients: Array.from(adminRecipients),
    adminLookupError,
  }, 200);
});

function addRecipients(recipients: Set<string>, value: unknown) {
  if (!value) return;
  String(value)
    .split(/[;,\s]+/)
    .map((email) => email.toLowerCase().trim())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    .forEach((email) => recipients.add(email));
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/p>|<\/div>|<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isUuid(v: unknown): boolean {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function formatOrderDate(d: Date): string {
  // Format: 27.04.2026.
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}.`;
}

// Hidracija payload-a iz baze: učitava order + order_items po UUID-u.
// Vraća strukturu identičnu onome što checkout flow inače šalje, tako da
// render dalje radi 1:1 isto kao za stvarni email.
async function hydratePayloadFromDb(
  admin: ReturnType<typeof createClient>,
  orderId: string,
): Promise<{ ok: true; payload: Payload } | { ok: false; error: string }> {
  if (!isUuid(orderId)) {
    return { ok: false, error: "orderId must be a UUID for hydration" };
  }
  const { data: order, error: oErr } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (oErr) return { ok: false, error: `Failed to load order: ${oErr.message}` };
  if (!order) return { ok: false, error: "Order not found" };

  const { data: itemRows, error: iErr } = await admin
    .from("order_items")
    .select("product_name, quantity, unit_price")
    .eq("order_id", orderId);
  if (iErr) return { ok: false, error: `Failed to load order_items: ${iErr.message}` };

  const items: Item[] = (itemRows ?? []).map((r: any) => ({
    name: String(r.product_name ?? ""),
    quantity: Number(r.quantity ?? 1),
    price: Number(r.unit_price ?? 0),
  }));

  const orderDate = order.created_at
    ? formatOrderDate(new Date(order.created_at))
    : formatOrderDate(new Date());

  return {
    ok: true,
    payload: {
      orderId: String(order.order_number ?? order.id),
      customerEmail: String(order.customer_email ?? ""),
      customerName: String(order.customer_name ?? ""),
      customerPhone: order.customer_phone ?? "",
      shippingAddress: order.shipping_address ?? "",
      shippingCity: order.shipping_city ?? "",
      shippingZip: order.shipping_postal_code ?? "",
      note: order.notes ?? "",
      subtotal: order.subtotal != null ? Number(order.subtotal) : undefined,
      discountAmount: order.discount_amount != null ? Number(order.discount_amount) : undefined,
      discountLabel: order.discount_label ?? "",
      total: Number(order.total ?? 0),
      items,
      orderDate,
    },
  };
}

// redeploy: smtp-pre-send-validation v8 (2026-04-28T-force-rebuild)
// Force bundler to pick up latest _shared/simple-smtp.ts (pre-send validation log + empty payload guard).
const FUNCTION_BUILD_ID = "send-order-email/v8/2026-04-28-force";
console.log("[send-order-email] boot", FUNCTION_BUILD_ID);
