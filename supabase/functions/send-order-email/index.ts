// supabase/functions/send-order-email/index.ts
//
// Šalje 2 email-a (kupcu + adminu) preko SMTP-a definisanog u email_settings.
// Loguje rezultat u email_logs. NIKAD ne baca grešku ka pozivaocu na način
// koji bi srušio checkout - uvek vraća 200 sa { sent, failed } summary-jem.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { applyTemplate, applyTextTemplate, renderItemsTable, type Item } from "../_shared/email-template.ts";
import { sendSmtpEmail } from "../_shared/simple-smtp.ts";

interface Payload {
  customerEmail: string;
  customerName: string;
  orderId: string | number;
  items: Item[];
  total: number;
  customerPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingZip?: string;
  note?: string;
  subtotal?: number;
  discountAmount?: number;
  discountLabel?: string;
  orderDate?: string;
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

  if (!payload?.customerEmail || !payload?.orderId || !Array.isArray(payload.items)) {
    return json({ error: "Missing required fields" }, 400);
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
  const itemsTable = renderItemsTable(payload.items);
  const totalStr = Number(payload.total).toLocaleString("sr-RS");
  const subtotalStr = payload.subtotal != null ? Number(payload.subtotal).toLocaleString("sr-RS") : "";
  const discountStr = payload.discountAmount && payload.discountAmount > 0
    ? Number(payload.discountAmount).toLocaleString("sr-RS")
    : "";
  const data = {
    customerName: payload.customerName || "",
    customerEmail: payload.customerEmail,
    orderId: String(payload.orderId),
    itemsTable,
    total: totalStr,
    customerPhone: payload.customerPhone || "",
    shippingAddress: payload.shippingAddress || "",
    shippingCity: payload.shippingCity || "",
    shippingZip: payload.shippingZip || "",
    note: payload.note || "",
    subtotal: subtotalStr,
    discountAmount: discountStr,
    discountLabel: payload.discountLabel || "",
    orderDate: payload.orderDate || formatOrderDate(new Date()),
  };

  const customerSubject = applyTextTemplate(settings.customer_subject, { ...data, itemsTable: "" });
  const customerHtml = applyTemplate(settings.customer_template, data);
  const adminSubject = applyTextTemplate(settings.admin_subject, { ...data, itemsTable: "" });
  const adminHtml = applyTemplate(settings.admin_template, { ...data, __isAdmin: 1 });

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

  const results: Array<{ type: "customer" | "admin"; status: "sent" | "failed"; error?: string }> = [];

  // 4a. Kupcu
  try {
    await sendSmtpEmail(smtp, {
      from: fromAddr,
      to: payload.customerEmail,
      replyTo: settings.admin_email || undefined,
      subject: customerSubject,
      html: customerHtml,
      text: htmlToText(customerHtml),
    });
    results.push({ type: "customer", status: "sent" });
    await admin.from("email_logs").insert({
      order_id: isUuid(payload.orderId) ? payload.orderId : null,
      recipient: payload.customerEmail,
      type: "customer",
      status: "sent",
    });
  } catch (e) {
    const msg = (e as Error).message;
    results.push({ type: "customer", status: "failed", error: msg });
    await admin.from("email_logs").insert({
      order_id: isUuid(payload.orderId) ? payload.orderId : null,
      recipient: payload.customerEmail,
      type: "customer",
      status: "failed",
      error_message: msg,
    });
  }

  // 4b. Adminu
  // Skupi sve admin primaoce: app_users sa rolom admin/owner + settings.admin_email
  const adminRecipients = new Set<string>();
  addRecipients(adminRecipients, settings.admin_email);

  let adminLookupError: string | null = null;
  try {
    const { data: appAdmins, error: appAdminsErr } = await admin
      .from("app_users")
      .select("email, role, status");
    if (appAdminsErr) {
      adminLookupError = appAdminsErr.message;
      console.error("[send-order-email] app_users query error:", appAdminsErr);
    }
    const roleAdmins = (appAdmins ?? []).filter((u) => ["admin", "owner"].includes(String(u?.role ?? "").toLowerCase().trim()));
    console.log("[send-order-email] found app_users admins:", roleAdmins.length);
    for (const u of roleAdmins) {
      addRecipients(adminRecipients, u?.email);
    }
  } catch (e) {
    adminLookupError = (e as Error).message;
    console.error("[send-order-email] app_users lookup threw:", e);
    // ako ne uspe, pokušaj barem sa settings.admin_email
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
          if (adminRoleUserIds.has(u.id)) addRecipients(adminRecipients, u.email);
        }
        console.log("[send-order-email] found user_roles admins:", adminRoleUserIds.size);
      }
    }
  } catch (e) {
    const msg = (e as Error).message;
    adminLookupError = [adminLookupError, msg].filter(Boolean).join(" | ") || msg;
    console.error("[send-order-email] user_roles lookup threw:", e);
  }

  console.log("[send-order-email] admin recipients:", Array.from(adminRecipients));

  for (const recipient of adminRecipients) {
    try {
      await sendSmtpEmail(smtp, {
        from: fromAddr,
        to: recipient,
        replyTo: payload.customerEmail,
        subject: adminSubject,
        html: adminHtml,
        text: htmlToText(adminHtml),
      });
      results.push({ type: "admin", status: "sent" });
      await admin.from("email_logs").insert({
        order_id: isUuid(payload.orderId) ? payload.orderId : null,
        recipient,
        type: "admin",
        status: "sent",
      });
    } catch (e) {
      const msg = (e as Error).message;
      results.push({ type: "admin", status: "failed", error: msg });
      await admin.from("email_logs").insert({
        order_id: isUuid(payload.orderId) ? payload.orderId : null,
        recipient,
        type: "admin",
        status: "failed",
        error_message: msg,
      });
    }
  }

  return json({
    ok: true,
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

// redeploy: simple-smtp v2 (1777309864)
