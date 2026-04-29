// Učitava email_settings, dekriptuje password, vraća sender funkciju.
// Koriste je svi recovery worker-i.

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendSmtpEmail } from "./simple-smtp.ts";

export interface SmtpSender {
  send: (opts: { to: string; subject: string; html: string; replyTo?: string; htmlOnly?: boolean }) => Promise<void>;
  fromAddr: string;
  adminEmail: string;
}

export async function loadSmtpSender(admin: SupabaseClient): Promise<SmtpSender | { error: string }> {
  const { data: settings, error: sErr } = await admin
    .from("email_settings").select("*").eq("id", 1).maybeSingle();
  if (sErr || !settings) return { error: "Email settings not configured" };
  if (!settings.enabled) return { error: "Email disabled" };

  const { data: pwdRow, error: pErr } = await admin.rpc("decrypt_smtp_password", {
    p_cipher: settings.smtp_password,
    p_key: Deno.env.get("EMAIL_ENC_KEY") ?? "",
  });
  if (pErr) return { error: `Decrypt failed: ${pErr.message}` };

  const port = Number(settings.smtp_port);
  const smtp = {
    hostname: settings.smtp_host,
    port,
    tls: port === 465,
    username: settings.smtp_user,
    password: pwdRow as string,
  };
  const fromAddr = `${settings.from_name} <${settings.from_email}>`;

  return {
    fromAddr,
    adminEmail: settings.admin_email || "",
    send: async ({ to, subject, html, replyTo, htmlOnly }) => {
      await sendSmtpEmail(smtp, {
        from: fromAddr,
        to,
        replyTo: replyTo || settings.admin_email || undefined,
        subject,
        html,
        htmlOnly,
      });
    },
  };
}