// supabase/functions/send-order-email/index.ts
//
// Šalje 2 email-a (kupcu + adminu) preko SMTP-a definisanog u email_settings.
// Loguje rezultat u email_logs. NIKAD ne baca grešku ka pozivaocu na način
// koji bi srušio checkout - uvek vraća 200 sa { sent, failed } summary-jem.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { applyTemplate, renderItemsTable, type Item } from "../_shared/email-template.ts";
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
  };

  const customerSubject = applyTemplate(settings.customer_subject, { ...data, itemsTable: "" });
  const customerHtml = applyTemplate(settings.customer_template, data);
  const adminSubject = applyTemplate(settings.admin_subject, { ...data, itemsTable: "" });
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
  if (settings.admin_email) adminRecipients.add(settings.admin_email.toLowerCase().trim());

  try {
    const { data: appAdmins } = await admin
      .from("app_users")
      .select("email, role")
      .in("role", ["admin", "owner"]);
    for (const u of appAdmins ?? []) {
      if (u?.email) adminRecipients.add(String(u.email).toLowerCase().trim());
    }
  } catch (_) {
    // ako ne uspe, pokušaj barem sa settings.admin_email
  }

  for (const recipient of adminRecipients) {
    try {
      await sendSmtpEmail(smtp, {
        from: fromAddr,
        to: recipient,
        replyTo: payload.customerEmail,
        subject: adminSubject,
        html: adminHtml,
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

  return json({ ok: true, results }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isUuid(v: unknown): boolean {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

// redeploy: simple-smtp v2 (1777309864)
