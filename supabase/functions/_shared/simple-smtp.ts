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
  // Loopia & većina servera:
  //  - port 465 → implicit TLS (tls: true)
  //  - port 587 / 25 → STARTTLS (tls: false; denomailer automatski radi STARTTLS upgrade)
  // Polje settings.tls iz UI-ja se ignoriše osim za port 465, jer "tls: true" u denomailer-u
  // znači implicit TLS handshake odmah po konekciji, što servere na 587 razbija ("invalid cmd").
  const useImplicitTls = port === 465;

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

  const safeSubject = String(message.subject || "0202skin obaveštenje").trim() || "0202skin obaveštenje";
  const safeHtml = normalizeContent(message.html) || fallbackHtml(safeSubject);
  const safeText = normalizeContent(message.text) || htmlToText(safeHtml) || `0202skin — ${safeSubject}`;

  // Detaljan dijagnostički log - vidi se u Supabase Edge Function logs
  console.log("[smtp] sending", JSON.stringify({
    host: settings.hostname,
    port,
    implicitTls: useImplicitTls,
    from: message.from,
    to: message.to,
    replyTo: message.replyTo ?? null,
    subjectLen: safeSubject.length,
    subjectPreview: safeSubject.slice(0, 80),
    htmlLen: safeHtml.length,
    textLen: safeText.length,
    htmlStart: safeHtml.slice(0, 60),
  }));

  try {
    await client.send({
      from: message.from,
      to: message.to,
      replyTo: message.replyTo,
      subject: safeSubject,
      content: safeText,
      html: safeHtml,
    });
    console.log("[smtp] sent OK to", message.to);
  } finally {
    try { await client.close(); } catch { /* ignore */ }
  }
}

function normalizeContent(value?: string): string {
  return typeof value === "string" ? value.trim() : "";
}

function fallbackHtml(subject: string): string {
  return `<!DOCTYPE html><html lang="sr"><body><p>${escapeHtml(subject)}</p></body></html>`;
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
