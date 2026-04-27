// Šalje sistemski email (invite, notifikacije) preko istog SMTP-a kao send-order-email.
// Vraća { sent: true } ili baca grešku.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendSmtpEmail } from "./simple-smtp.ts";

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

  const fromAddr = `${settings.from_name} <${settings.from_email}>`;

  try {
    const port = Number(settings.smtp_port);
    await sendSmtpEmail({
      hostname: settings.smtp_host,
      port,
      // Port 465 = implicit TLS; 587/25 = STARTTLS (tls: false)
      tls: port === 465,
      username: settings.smtp_user,
      password: smtpPassword,
    }, {
      from: fromAddr,
      to,
      replyTo: replyTo || settings.admin_email || undefined,
      subject,
      html,
    });
    return { sent: true };
  } catch (e) {
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

export function credentialsEmailHtml(opts: {
  inviterName: string;
  recipientName: string;
  role: string;
  email: string;
  password: string;
  loginUrl: string;
  siteName?: string;
}): string {
  const { inviterName, recipientName, role, email, password, loginUrl, siteName = "0202 SKIN" } = opts;
  return `<!DOCTYPE html>
<html lang="sr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1a1a;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;"><tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <tr><td style="padding:48px 48px 0;text-align:center;">
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:400;letter-spacing:0.18em;color:#1a1a1a;text-transform:uppercase;">${escape(siteName)}</div>
        <div style="margin-top:14px;height:1px;background:#1a1a1a;width:32px;display:inline-block;"></div>
      </td></tr>

      <tr><td style="padding:56px 48px 8px;">
        <div style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#8a8580;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:20px;">
          Pristupni podaci · Admin panel
        </div>
        <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:42px;font-weight:400;line-height:1.15;color:#1a1a1a;margin:0 0 18px;letter-spacing:-0.01em;">
          Dobrodošli${recipientName ? ", " + escape(recipientName.split(" ")[0]) : ""}.
        </h1>
        <p style="font-size:15px;line-height:1.7;color:#8a8580;margin:0 0 8px;font-weight:300;">
          ${escape(inviterName)} vam je kreirao/la nalog u ${escape(siteName)} admin panelu sa ulogom
          <span style="color:#1a1a1a;font-family:'Courier New',Courier,monospace;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;">${escape(role)}</span>.
        </p>
      </td></tr>

      <tr><td style="padding:32px 48px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;border-collapse:collapse;">
          <tr><td style="padding:28px 32px;">
            <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#8a8580;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:8px;">Email</div>
            <div style="font-family:'Courier New',Courier,monospace;font-size:15px;color:#1a1a1a;font-weight:500;word-break:break-all;">${escape(email)}</div>
          </td></tr>
          <tr><td style="padding:0 32px 28px;border-top:1px solid #e3dcd0;">
            <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#8a8580;letter-spacing:0.2em;text-transform:uppercase;margin:24px 0 8px;">Privremena lozinka</div>
            <div style="font-family:'Courier New',Courier,monospace;font-size:18px;color:#1a1a1a;font-weight:700;letter-spacing:0.05em;background:#ffffff;padding:14px 18px;border:1px dashed #1a1a1a;display:inline-block;">${escape(password)}</div>
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:40px 48px 0;text-align:center;">
        <a href="${loginUrl}" style="display:inline-block;background:#1a1a1a;color:#ffffff;padding:18px 48px;text-decoration:none;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;font-weight:500;">Uloguj se</a>
      </td></tr>

      <tr><td style="padding:32px 48px 0;">
        <div style="background:#ffffff;border:1px solid #e3dcd0;padding:20px 24px;">
          <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#8a8580;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:8px;">⚠ Bezbednost</div>
          <div style="font-size:13px;color:#1a1a1a;line-height:1.6;font-weight:300;">
            Promenite lozinku odmah nakon prvog logovanja. Nemojte deliti ove podatke ni sa kim.
          </div>
        </div>
      </td></tr>

      <tr><td style="padding:48px 48px 48px;text-align:center;">
        <div style="height:1px;background:#e3dcd0;width:100%;margin-bottom:32px;"></div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:#1a1a1a;letter-spacing:0.18em;text-transform:uppercase;">${escape(siteName)}</div>
        <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#8a8580;letter-spacing:0.2em;text-transform:uppercase;margin-top:18px;word-break:break-all;">
          ${escape(loginUrl)}
        </div>
      </td></tr>

    </table>
  </td></tr></table>
</body></html>`;
}

function escape(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}