// SMTP klijent zasnovan na denomailer paketu (stabilan, retry-friendly).
// Zadržava isti API: sendSmtpEmail({ hostname, port, tls, username, password }, message)

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

export interface SmtpSettings {
  hostname: string;
  port: number;
  tls: boolean;
  username: string;
  password: string;
}

export interface SmtpMessage {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
}

export async function sendSmtpEmail(settings: SmtpSettings, message: SmtpMessage) {
  const port = Number(settings.port);
  // Port 465 = implicit TLS; 587/25 = STARTTLS
  const useImplicitTls = settings.tls === true || port === 465;

  const client = new SMTPClient({
    connection: {
      hostname: settings.hostname,
      port,
      tls: useImplicitTls,
      auth: {
        username: settings.username,
        password: settings.password,
      },
    },
    debug: {
      log: false,
    },
    pool: false,
  });

  try {
    await client.send({
      from: message.from,
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      content: message.text ?? "Pogledajte HTML verziju ove poruke.",
      html: message.html,
    });
  } finally {
    try { await client.close(); } catch { /* ignore */ }
  }
}
