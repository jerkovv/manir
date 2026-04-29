---
name: SMTP encoding rules
description: Body 8bit (ne QP) za Apple Mail; Subject Q-encoded OK ali NE sme da sadrži '?' uz non-ASCII
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

**KRITIČNO: Subject NE sme da sadrži `?` (upitnik) ako sadrži non-ASCII karaktere (č, š, ž, ć, đ, ·, …).**
- denomailer 1.6.0 wrap-uje non-ASCII subject u `=?utf-8?Q?...?=`, ali NE enkoduje literal `?` iz source string-a kao `=3F`.
- Posledica: prvi `?` u sadržaju se interpretira kao kraj Q-encoded sekcije → enkoding se prelama na pola.
- Gmail/Outlook tolerantno dekodiraju, Apple Mail (iOS + macOS) prikazuje sirov `=?utf-8?Q?...?=` string.
- Primer LOŠEG subject-a: `Kako ste se snašli? · 0202skin` → prelom kod `?`.
- Primer DOBROG subject-a: `Vaše mišljenje nam znači · 0202skin` (bez `?`).
- Pravila pri pisanju recovery/review subject-a:
  1. Bez `?` ako ima non-ASCII. Preformuliši u izjavnu rečenicu.
  2. Drugi specijalni znakovi (`=`, `_`) takođe su rizični u Q-encoding source-u — izbegavaj.
  3. Ako mora upitna intonacija + non-ASCII → koristi pure ASCII subject ili migriraj na nodemailer.
- Pravi fix (kad bude vremena): migracija na nodemailer sa `textEncoding: 'base64'` za Subject (`=?utf-8?B?...?=`), gde su `?` u sadržaju bezbedni jer je sve base64-enkodovano.

**Order email-ovi (else grana, multipart/alternative): NE dirati.**
- Ostavljen postojeći `html` + `content` put jer radi stabilno za order flow.
