---
name: Email HTML single-column layout
description: Recovery + review email templates use inline single-column layout always — no <style>, no classes, no media queries
type: design
---

Email HTML template-i (`reviewReminderHtml` + `abandonedCartHtml` u `supabase/functions/_shared/recovery-emails.ts`) koriste **single-column layout uvek**, ne 2-kolone tabele.

**Razlog:** denomailer `mimeContent` put strip-uje `<style>` blokove i `class` atribute pri konstruisanju MIME body-ja. Posledica: media query responsive strategija (`@media (max-width:480px)`) se NE primenjuje u finalnom email-u — `<style>` tag i sve klase nestaju iz HTML-a koji stigne do klijenta. Provereno na pravom .eml fajlu iz Gmail-a.

**Pravila:**
- Bez `<style>` blokova u `<head>` (svejedno se brišu).
- Bez `class="..."` atributa (svejedno se brišu).
- Bez `@media` query-ja.
- Sve stilove inline na svakom elementu.
- Item kartice: jedna kolona, 3-4 zasebna `<tr>` (slika centrirana gore 120x120, naziv ispod centriran, qty/cena, CTA centriran ispod). Nikad 2-`<td>` red.
- CTA dugmići: `display:inline-block;white-space:nowrap;` inline (Apple Mail iOS prelama bez `nowrap`).
- Single-column je prirodno responsive (radi i na 600px desktop-u i na 360px mobile-u, Apple Mail iOS / Gmail / Outlook).

**Pravi fix (kad bude vremena):** migracija na nodemailer (čuva `<style>` i klase u MIME body-ju). Tada se može vratiti 2-kolone tabele + media query za bogatiji desktop layout.