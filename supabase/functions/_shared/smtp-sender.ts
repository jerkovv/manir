// Šalje sistemski email (invite, notifikacije) preko istog SMTP-a kao send-order-email.
// Vraća { sent: true } ili baca grešku.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

export async function sendSystemEmail(opts: {
  admin: SupabaseClient;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const { admin, to, subject, html, replyTo } = opts;

  const { data: settings, error: sErr } = await admin
    .from("email_settings").select("*").eq("id", 1).maybeSingle();
  if (sErr || !settings) return { sent: false, error: "Email settings not configured" };
  if (!settings.enabled) return { sent: false, error: "Email disabled" };

  const { data: pwdRow, error: pErr } = await admin.rpc("decrypt_smtp_password", {
    p_cipher: settings.smtp_password,
    p_key: Deno.env.get("EMAIL_ENC_KEY") ?? "",
  });
  if (pErr) return { sent: false, error: `Decrypt failed: ${pErr.message}` };
  const smtpPassword = pwdRow as string;

  const port = Number(settings.smtp_port);
  const client = new SMTPClient({
    connection: {
      hostname: settings.smtp_host,
      port,
      // Port 465 = implicit TLS; 587/25 = STARTTLS (tls: false)
      tls: port === 465,
      auth: { username: settings.smtp_user, password: smtpPassword },
    },
  });

  const fromAddr = `${settings.from_name} <${settings.from_email}>`;

  try {
    await client.send({
      from: fromAddr,
      to,
      replyTo: replyTo || settings.admin_email || undefined,
      subject,
      html,
    });
    try { await client.close(); } catch { /* ignore */ }
    return { sent: true };
  } catch (e) {
    try { await client.close(); } catch { /* ignore */ }
    return { sent: false, error: (e as Error).message };
  }
}

export function inviteEmailHtml(opts: {
  inviterName: string;
  recipientName: string;
  role: string;
  inviteUrl: string;
  siteName?: string;
}): string {
  const { inviterName, recipientName, role, inviteUrl, siteName = "0202 SKIN" } = opts;
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FAFAF8;font-family:Arial,sans-serif;color:#1a1a1a;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;padding:48px 40px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-family:Georgia,serif;font-size:28px;letter-spacing:2px;">${escape(siteName)}</div>
      <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#999;margin-top:4px;">Admin panel</div>
    </div>
    <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:normal;margin:0 0 20px;">
      Zdravo${recipientName ? ", " + escape(recipientName) : ""}!
    </h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
      ${escape(inviterName)} vas je pozvao/la da se pridružite ${escape(siteName)} admin panelu sa ulogom
      <strong style="text-transform:uppercase;letter-spacing:1px;">${escape(role)}</strong>.
    </p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 28px;">
      Kliknite na dugme ispod da postavite svoju lozinku i pristupite panelu. Link važi 24 sata.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${inviteUrl}" style="display:inline-block;background:#1a1a1a;color:#ffffff;padding:14px 36px;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Postavi lozinku</a>
    </div>
    <p style="font-size:12px;color:#999;line-height:1.6;margin:32px 0 0;border-top:1px solid #eee;padding-top:20px;">
      Ako niste očekivali ovaj poziv, možete ignorisati email.<br>
      Ako dugme ne radi, kopirajte ovaj link u pretraživač:<br>
      <span style="word-break:break-all;color:#666;">${inviteUrl}</span>
    </p>
  </div>
</body></html>`;
}

function escape(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}