---
name: SMTP encoding rules
description: Body 8bit (ne QP) za Apple Mail kompatibilnost; Subject Q-encoded je OK
type: design
---

## Recovery / review email-ovi (htmlOnly grana u _shared/simple-smtp.ts)

**Body Content-Transfer-Encoding: 8bit (NE quoted-printable).**
- Šaljemo HTML kroz `mimeContent: [{ mimeType: 'text/html; charset="utf-8"', content, transferEncoding: "8bit" }]` umesto `html: ...`.
- Razlog: denomailer 1.6.0 default-uje na QP koji ostavlja `=20` artefakte u Apple Mail (iOS i macOS) renderer-u (whitespace bug pre CRLF).
- 8bit šalje raw UTF-8 byte-ove. Loopia i svi moderni SMTP serveri podržavaju 8BITMIME ekstenziju.
- NE vraćaj na `html: ...` polje — to ponovo uvodi QP.

**Subject: denomailer-ov default `=?utf-8?Q?...?=` (RFC 2047 Q-encoding) je OK.**
- Validan format, renderuje se u Apple Mail / Gmail / Outlook.
- denomailer hardcoded zove `quotedPrintableEncodeInline(subject)` u resolveSendConfig — ne može se override-ovati kroz API. Ako ikad bude trebalo base64 (=?utf-8?B?...?=), zahteva zamenu biblioteke (npr. nodemailer).

**Order email-ovi (else grana, multipart/alternative): NE dirati.**
- Ostavljen postojeći `html` + `content` put jer radi stabilno za order flow.
