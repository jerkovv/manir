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
  // Kad je true, šalje SAMO HTML deo (Content-Type: text/html), bez
  // multipart/alternative wrapper-a. Koristi se za recovery/review email-ove
  // kako bi se izbegli denomailer 1.6.0 multipart artefakti u Gmail-u
  // (duplikat tela, vidljivi `=20` quoted-printable znaci).
  // Default false → postojeće ponašanje (multipart sa tekstom + html-om).
  htmlOnly?: boolean;
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

  // Pre-send validation log: pokazuje TAČNO šta ide u client.send() posle trim-a.
  // Ako se denomailer žali na "You should provide at least html or text content!",
  // ovde ćemo videti da li su trimmed dužine zaista 0.
  console.log("[smtp] pre-send validation", JSON.stringify({
    to: message.to,
    subjectLen: (message.subject ?? "").length,
    subjectTrimmed: (message.subject ?? "").trim().length,
    htmlLen: (message.html ?? "").length,
    htmlTrimmed: (message.html ?? "").trim().length,
    textLen: (message.text ?? "").length,
    textTrimmed: (message.text ?? "").trim().length,
    safeHtmlTrimmed: safeHtml.trim().length,
    safeTextTrimmed: safeText.trim().length,
    htmlPreview: (message.html ?? "").slice(0, 80),
    textPreview: (message.text ?? "").slice(0, 80),
  }));

  // Hard guard: ako su i html i text prazni posle trim-a, baci jasnu grešku
  // sa identifikujućim podacima umesto generičke denomailer poruke.
  const htmlOk = safeHtml.trim().length > 0;
  const textOk = safeText.trim().length > 0;
  if (!htmlOk && !textOk) {
    throw new Error(
      `[smtp] empty payload: html=${(message.html ?? "").length}b ` +
      `text=${(message.text ?? "").length}b ` +
      `subject="${(message.subject ?? "").slice(0, 40)}" ` +
      `to=${message.to}`
    );
  }

  try {
    if (message.htmlOnly) {
      // HTML-only put + 8bit transfer encoding.
      //
      // Zašto mimeContent umesto html polja:
      //   denomailer 1.6.0 hardcoded provlači `html` kroz quotedPrintableEncode
      //   i postavlja `Content-Transfer-Encoding: quoted-printable`. To u
      //   Apple Mail (iOS i macOS) ostavlja vidljive `=20` artefakte između
      //   HTML tagova (poznat bug u Apple Mail QP renderer-u sa whitespace-om
      //   na kraju linije pre CRLF).
      //
      // Rešenje: prosledimo HTML kao mimeContent sa transferEncoding "8bit".
      // denomailer tada šalje raw UTF-8 byte-ove direktno (bez QP enkodovanja).
      // Svi moderni SMTP serveri (uključujući Loopia) podržavaju 8BITMIME
      // ekstenziju, pa se ovo prenosi bez gubitaka.
      //
      // Subject: ostaje denomailer-ov default (=?utf-8?Q?...?=, RFC 2047
      // Q-encoding). Validan i renderuje se ispravno u svim klijentima.
      await client.send({
        from: message.from,
        to: message.to,
        replyTo: message.replyTo,
        subject: safeSubject,
        mimeContent: [
          {
            mimeType: 'text/html; charset="utf-8"',
            content: safeHtml,
            transferEncoding: "8bit",
          },
        ],
      });
      console.log("[smtp] sent OK (html-only, 8bit) to", message.to);
    } else {
      // Postojeće ponašanje — multipart/alternative sa tekstom i HTML-om.
      // Koristi se za order email-ove i sve što već radi stabilno.
      await client.send({
        from: message.from,
        to: message.to,
        replyTo: message.replyTo,
        subject: safeSubject,
        content: safeText,
        html: safeHtml,
      });
      console.log("[smtp] sent OK to", message.to);
    }
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
