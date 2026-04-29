// Email template-ovi za review podsetnik i abandoned cart recovery.
// Stilski usklađeni sa _shared/email-template.ts (krem paleta, serif).

const BRAND_NAME = "0202skin";
const BRAND_CREAM = "#F4EFE6";
const BRAND_PAPER = "#FBF8F2";
const BRAND_DARK = "#1A1714";
const BRAND_INK = "#2B2620";
const BRAND_MUTED = "#8B8378";
const BRAND_LINE = "#E2D9C9";
const BRAND_ACCENT = "#7A6A55";
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'Courier New', Courier, monospace";

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Pretvara relativne putanje slika ("/products/x.jpeg") u apsolutne URL-ove
// koji rade u email klijentima (Gmail, Outlook, itd.).
// Ako je već apsolutni URL ili data: URI, vraća ga netaknutog.
function absoluteUrl(src: string | null | undefined, siteUrl: string): string {
  const s = (src ?? "").trim();
  if (!s) return "";
  if (/^(https?:|data:|cid:)/i.test(s)) return s;
  const base = (siteUrl || "").replace(/\/+$/, "");
  if (s.startsWith("/")) return `${base}${s}`;
  return `${base}/${s}`;
}

export interface ReviewEmailItem {
  product_name: string;
  product_image?: string | null;
  review_url: string;
}

export function reviewReminderHtml(opts: {
  customerName: string;
  items: ReviewEmailItem[];
  siteUrl: string;
}): string {
  const { customerName, items, siteUrl } = opts;
  const firstName = (customerName || "").split(" ")[0] || "";
  const greeting = firstName ? `Zdravo, ${firstName}` : "Zdravo";

  const itemBlocks = items.map((it) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_CREAM};border:1px solid ${BRAND_LINE};margin:0 0 16px;">
      <tr>
        <td style="padding:20px 22px;vertical-align:middle;width:88px;">
          ${it.product_image ? `<img src="${escapeHtml(absoluteUrl(it.product_image, siteUrl))}" alt="" width="72" height="72" style="display:block;width:72px;height:72px;object-fit:cover;border:1px solid ${BRAND_LINE};">` : ''}
        </td>
        <td style="padding:20px 22px 20px 0;vertical-align:middle;">
          <div style="font-family:${SERIF};font-size:18px;color:${BRAND_DARK};font-weight:500;margin:0 0 12px;line-height:1.3;">${escapeHtml(it.product_name)}</div>
          <a href="${escapeHtml(it.review_url)}" style="display:inline-block;background:${BRAND_DARK};color:#fff;padding:10px 22px;text-decoration:none;font-family:${MONO};font-size:10px;letter-spacing:0.25em;text-transform:uppercase;">Oceni proizvod</a>
        </td>
      </tr>
    </table>`).join("");

  return `<!DOCTYPE html>
<html lang="sr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${BRAND_NAME}</title></head>
<body style="margin:0;padding:0;background:${BRAND_CREAM};font-family:${SANS};color:${BRAND_INK};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_CREAM};"><tr><td align="center" style="padding:32px 12px;">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BRAND_PAPER};border:1px solid ${BRAND_LINE};">
      <tr><td style="padding:36px 48px 8px;text-align:center;border-bottom:1px solid ${BRAND_LINE};">
        <div style="font-family:${SERIF};font-weight:300;color:${BRAND_DARK};letter-spacing:0.15em;font-size:30px;line-height:1;">
          0202 <span style="font-family:${SANS};font-size:13px;letter-spacing:0.32em;text-transform:uppercase;font-weight:400;vertical-align:3px;">skin</span>
        </div>
      </td></tr>
      <tr><td style="padding:48px 48px 0;text-align:center;">
        <div style="font-family:${MONO};font-size:10px;color:${BRAND_MUTED};letter-spacing:0.32em;text-transform:uppercase;">Vaše mišljenje nam znači</div>
        <div style="margin:18px auto 0;height:1px;background:${BRAND_DARK};width:32px;"></div>
      </td></tr>
      <tr><td style="padding:28px 48px 8px;text-align:center;">
        <h1 style="font-family:${SERIF};font-size:38px;font-weight:400;color:${BRAND_DARK};margin:0 0 18px;letter-spacing:-0.015em;line-height:1.15;">
          ${escapeHtml(greeting)}.
        </h1>
        <p style="font-family:${SANS};font-size:14px;line-height:1.75;color:${BRAND_MUTED};margin:0 auto 8px;max-width:440px;">
          Prošlo je dve nedelje od vaše porudžbine. Voleli bismo da čujemo kako ste se snašli sa proizvodima, vaša ocena pomaže drugima da donesu pravu odluku.
        </p>
      </td></tr>
      <tr><td style="padding:40px 48px 8px;">
        ${itemBlocks}
      </td></tr>
      <tr><td style="padding:24px 48px 56px;text-align:center;">
        <div style="font-family:${SERIF};font-weight:300;color:${BRAND_DARK};letter-spacing:0.15em;font-size:18px;line-height:1;">
          0202 <span style="font-family:${SANS};font-size:9px;letter-spacing:0.32em;text-transform:uppercase;font-weight:400;vertical-align:2px;">skin</span>
        </div>
        <div style="font-family:${SANS};font-size:11px;color:${BRAND_MUTED};margin-top:10px;letter-spacing:0.04em;">
          <a href="${escapeHtml(siteUrl)}" style="color:${BRAND_MUTED};text-decoration:none;">${escapeHtml(siteUrl.replace(/^https?:\/\//, ''))}</a>
        </div>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

export interface AbandonedCartItem {
  name: string;
  quantity: number;
  price: number;
  image?: string | null;
}

export function abandonedCartHtml(opts: {
  stage: 1 | 2;
  customerName: string;
  items: AbandonedCartItem[];
  total: number;
  resumeUrl: string;
  unsubscribeUrl: string;
  siteUrl: string;
}): string {
  const {
    stage, customerName, items, total, resumeUrl,
    unsubscribeUrl, siteUrl,
  } = opts;

  const firstName = (customerName || "").split(" ")[0] || "";
  const greeting = firstName ? `Zdravo, ${firstName}` : "Zdravo";

  const eyebrow = stage === 1 ? "KORPA VAS ČEKA" : "POSLEDNJE PODSEĆANJE";
  const headline = stage === 1 ? "Vaša korpa Vas čeka." : "Pre nego što se izgubi.";
  const subline = stage === 1
    ? "Sačuvali smo proizvode koje ste odabrali. Možete nastaviti tačno gde ste stali, kad god Vam odgovara."
    : "Vaša korpa je još uvek tu, ali neće zauvek. Vraćamo se sa nežnim podsećanjem, bez žurbe.";
  const ctaText = stage === 1 ? "Vrati me u korpu" : "Pogledajte korpu";
  const careText = stage === 1
    ? "„Lepe stvari ne treba juriti, one strpljivo čekaju.\u201D"
    : "„Pažnja je oblik luksuza. Tvoja korpa je još uvek tu.\u201D";

  const itemRows = items.map((it) => `
    <tr>
      <td style="padding:18px 0;border-bottom:1px solid ${BRAND_LINE};vertical-align:middle;width:72px;">
        ${it.image ? `<img src="${escapeHtml(it.image)}" alt="" width="60" height="60" style="display:block;width:60px;height:60px;object-fit:cover;border:1px solid ${BRAND_LINE};">` : ''}
      </td>
      <td style="padding:18px 0 18px 16px;border-bottom:1px solid ${BRAND_LINE};font-family:${SERIF};font-size:16px;color:${BRAND_INK};vertical-align:middle;">
        <div>${escapeHtml(it.name)}</div>
        <div style="font-family:${MONO};font-size:10px;color:${BRAND_MUTED};margin-top:6px;letter-spacing:0.22em;text-transform:uppercase;">${it.quantity} kom · ${it.price.toLocaleString("sr-RS")} RSD</div>
      </td>
      <td style="padding:18px 0;border-bottom:1px solid ${BRAND_LINE};font-family:${SERIF};font-size:18px;color:${BRAND_DARK};text-align:right;font-weight:500;vertical-align:middle;white-space:nowrap;">
        ${(it.price * it.quantity).toLocaleString("sr-RS")} RSD
      </td>
    </tr>`).join("");

  const careBlock = `
    <tr><td style="padding:32px 48px 0;">
      <div style="border-top:1px solid ${BRAND_LINE};border-bottom:1px solid ${BRAND_LINE};padding:32px 24px;text-align:center;">
        <div style="font-family:${SERIF};font-size:18px;font-style:italic;color:${BRAND_DARK};line-height:1.55;font-weight:400;">${escapeHtml(careText)}</div>
      </div>
    </td></tr>`;

  const itemsBlock = `
    <tr><td style="padding:40px 48px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tbody>${itemRows}</tbody>
      </table>
    </td></tr>
    <tr><td style="padding:24px 48px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid ${BRAND_DARK};">
        <tr>
          <td style="padding:20px 0 0;font-family:${MONO};font-size:11px;color:${BRAND_DARK};letter-spacing:0.32em;text-transform:uppercase;font-weight:600;">Ukupno</td>
          <td style="padding:20px 0 0;font-family:${SERIF};font-size:30px;color:${BRAND_DARK};text-align:right;font-weight:500;letter-spacing:-0.015em;">${total.toLocaleString("sr-RS")} <span style="font-family:${MONO};font-size:11px;color:${BRAND_MUTED};letter-spacing:0.2em;vertical-align:5px;">RSD</span></td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="padding:48px 48px 0;text-align:center;">
      <a href="${escapeHtml(resumeUrl)}" style="display:inline-block;background:${BRAND_DARK};color:#fff;padding:18px 48px;text-decoration:none;font-family:${SANS};font-size:13px;letter-spacing:0.08em;font-weight:500;">${escapeHtml(ctaText)}</a>
    </td></tr>`;

  // Stage 1: care quote BELOW CTA. Stage 2: care quote ABOVE items.
  const middle = stage === 1
    ? itemsBlock + careBlock
    : careBlock + itemsBlock;

  return `<!DOCTYPE html>
<html lang="sr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${BRAND_NAME}</title></head>
<body style="margin:0;padding:0;background:${BRAND_CREAM};font-family:${SANS};color:${BRAND_INK};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_CREAM};"><tr><td align="center" style="padding:32px 12px;">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BRAND_PAPER};border:1px solid ${BRAND_LINE};">
      <tr><td style="padding:36px 48px 8px;text-align:center;border-bottom:1px solid ${BRAND_LINE};">
        <div style="font-family:${SERIF};font-weight:300;color:${BRAND_DARK};letter-spacing:0.15em;font-size:30px;line-height:1;">
          0202 <span style="font-family:${SANS};font-size:13px;letter-spacing:0.32em;text-transform:uppercase;font-weight:400;vertical-align:3px;">skin</span>
        </div>
      </td></tr>
      <tr><td style="padding:48px 48px 0;text-align:center;">
        <div style="font-family:${MONO};font-size:10px;color:${BRAND_MUTED};letter-spacing:0.32em;text-transform:uppercase;">${eyebrow}</div>
        <div style="margin:18px auto 0;height:1px;background:${BRAND_DARK};width:32px;"></div>
      </td></tr>
      <tr><td style="padding:28px 48px 8px;text-align:center;">
        <h1 style="font-family:${SERIF};font-size:38px;font-weight:400;color:${BRAND_DARK};margin:0 0 14px;letter-spacing:-0.015em;line-height:1.15;">${escapeHtml(greeting)},</h1>
        <h2 style="font-family:${SERIF};font-size:28px;font-weight:400;font-style:italic;color:${BRAND_DARK};margin:0 0 22px;letter-spacing:-0.01em;line-height:1.2;">${escapeHtml(headline)}</h2>
        <p style="font-family:${SANS};font-size:14px;line-height:1.75;color:${BRAND_MUTED};margin:0 auto;max-width:440px;">${escapeHtml(subline)}</p>
      </td></tr>
      ${middle}
      <tr><td style="padding:48px 48px 32px;text-align:center;">
        <div style="font-family:${SERIF};font-weight:300;color:${BRAND_DARK};letter-spacing:0.15em;font-size:18px;line-height:1;">
          0202 <span style="font-family:${SANS};font-size:9px;letter-spacing:0.32em;text-transform:uppercase;font-weight:400;vertical-align:2px;">skin</span>
        </div>
        <div style="font-family:${SANS};font-size:11px;color:${BRAND_MUTED};margin-top:10px;letter-spacing:0.04em;">
          <a href="${escapeHtml(siteUrl)}" style="color:${BRAND_MUTED};text-decoration:none;">${escapeHtml(siteUrl.replace(/^https?:\/\//, ''))}</a>
        </div>
      </td></tr>
      <tr><td style="padding:0 48px 40px;text-align:center;">
        <div style="font-family:${SANS};font-size:11px;color:${BRAND_MUTED};line-height:1.6;">
          Ne želite više podsetnike? <a href="${escapeHtml(unsubscribeUrl)}" style="color:${BRAND_MUTED};text-decoration:underline;">Odjavite se</a>.
        </div>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}