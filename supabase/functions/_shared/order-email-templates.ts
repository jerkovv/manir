// Brand-aligned order email templates za 0202skin.
// Sve je inline (Apple Mail strip-uje <style> i class atribute).
// Završava sa .replace(/>\s+</g, "><") — sprečava `=20` artefakte u QP fallback klijentima.

export type Item = { name: string; quantity: number; price: number };

// Brand palette
const BRAND_CREAM = "#F5F0E7";
const BRAND_PAPER = "#FBF9F4";
const BRAND_DARK = "#2A2723";
const BRAND_INK = "#5C5651";
const BRAND_MUTED = "#8B7355";
const BRAND_LINE = "#E8DFD0";
const TEST_ACCENT = "#B8651C";

const SERIF = "'Cormorant Garamond',Georgia,serif";
const SANS = "'Outfit',Arial,sans-serif";

export interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderId: string; // već formatiran sa "#" prefiksom
  items: Item[];
  subtotal?: string;
  discountAmount?: string;
  discountLabel?: string;
  total: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingZip?: string;
  note?: string;
  orderDate?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatRsd(n: number): string {
  return `${Number(n).toLocaleString("sr-RS")} RSD`;
}

export function renderItemsTable(items: Item[]): string {
  const rows = items.map((it) => `
    <tr>
      <td style="padding:18px 8px;border-bottom:1px solid ${BRAND_LINE};font-family:${SERIF};font-size:17px;color:${BRAND_DARK};font-weight:500;line-height:1.3;vertical-align:top;">${escapeHtml(it.name)}</td>
      <td align="center" style="padding:18px 8px;border-bottom:1px solid ${BRAND_LINE};font-family:${SANS};font-size:14px;color:${BRAND_DARK};vertical-align:top;">${it.quantity}</td>
      <td align="right" style="padding:18px 8px;border-bottom:1px solid ${BRAND_LINE};font-family:${SANS};font-size:14px;color:${BRAND_INK};vertical-align:top;white-space:nowrap;">${formatRsd(it.price)}</td>
      <td align="right" style="padding:18px 8px;border-bottom:1px solid ${BRAND_LINE};font-family:${SANS};font-size:14px;color:${BRAND_DARK};font-weight:500;vertical-align:top;white-space:nowrap;">${formatRsd(it.price * it.quantity)}</td>
    </tr>`).join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0;">
  <thead>
    <tr style="border-bottom:2px solid ${BRAND_DARK};">
      <th align="left" style="padding:14px 8px;font-family:${SANS};font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:${BRAND_MUTED};font-weight:500;">Proizvod</th>
      <th align="center" style="padding:14px 8px;font-family:${SANS};font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:${BRAND_MUTED};font-weight:500;">Kol.</th>
      <th align="right" style="padding:14px 8px;font-family:${SANS};font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:${BRAND_MUTED};font-weight:500;">Cena</th>
      <th align="right" style="padding:14px 8px;font-family:${SANS};font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:${BRAND_MUTED};font-weight:500;">Ukupno</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>`;
}

function testBanner(isTestMode: boolean): string {
  if (!isTestMode) return "";
  return `<p style="margin:0 0 14px 0;font-family:${SANS};font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:${TEST_ACCENT};font-weight:500;text-align:center;">⚠ Test slanje — email nije poslat pravom kupcu</p>`;
}

function brandHeader(): string {
  return `<div style="text-align:center;padding:0 0 8px 0;">
    <div style="font-family:${SERIF};font-weight:400;color:${BRAND_DARK};letter-spacing:0.18em;font-size:30px;line-height:1;">0202 <span style="font-family:${SANS};font-size:13px;letter-spacing:0.32em;text-transform:uppercase;font-weight:500;vertical-align:3px;">skin</span></div>
  </div>`;
}

function eyebrow(text: string): string {
  return `<div style="text-align:center;font-family:${SANS};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND_MUTED};font-weight:500;margin:0 0 18px 0;">${escapeHtml(text)}</div>`;
}

function orderNumberBlock(orderId: string): string {
  return `<div style="text-align:center;margin:24px 0 32px 0;padding:20px;background:${BRAND_CREAM};border:1px solid ${BRAND_LINE};">
    <div style="font-family:${SANS};font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${BRAND_MUTED};margin-bottom:6px;font-weight:500;">Broj porudžbine</div>
    <div style="font-family:${SERIF};font-size:28px;color:${BRAND_DARK};font-weight:500;letter-spacing:0.02em;line-height:1;">${escapeHtml(orderId)}</div>
  </div>`;
}

function shippingCard(d: OrderEmailData, includeContact: boolean): string {
  const fullStreet = d.shippingAddress || "";
  const cityLine = [d.shippingZip, d.shippingCity].filter(Boolean).join(" ");
  if (!fullStreet && !cityLine && !d.customerPhone && !d.customerEmail) return "";
  const row = (label: string, value: string) => value
    ? `<tr><td style="padding:6px 0;font-family:${SANS};font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:${BRAND_MUTED};width:42%;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:6px 0;font-family:${SANS};font-size:14px;color:${BRAND_DARK};vertical-align:top;">${escapeHtml(value)}</td></tr>`
    : "";
  return `<div style="margin:0 0 28px 0;padding:22px 24px;background:${BRAND_CREAM};border:1px solid ${BRAND_LINE};">
    <div style="font-family:${SANS};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND_DARK};font-weight:600;margin-bottom:14px;">Adresa za isporuku</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${row("Ime", d.customerName || "")}
      ${row("Ulica", fullStreet)}
      ${row("Mesto", cityLine)}
      ${includeContact ? row("Telefon", d.customerPhone || "") : ""}
      ${includeContact ? row("Email", d.customerEmail || "") : ""}
    </table>
  </div>`;
}

function totalsBlock(d: OrderEmailData): string {
  const subtotalRow = d.subtotal
    ? `<tr><td style="padding:6px 0;font-family:${SANS};font-size:13px;color:${BRAND_INK};">Podzbir</td><td align="right" style="padding:6px 0;font-family:${SANS};font-size:13px;color:${BRAND_INK};">${escapeHtml(d.subtotal)} RSD</td></tr>`
    : "";
  const discountRow = d.discountAmount
    ? `<tr><td style="padding:6px 0;font-family:${SANS};font-size:13px;color:${BRAND_MUTED};">Popust${d.discountLabel ? ` · ${escapeHtml(d.discountLabel)}` : ""}</td><td align="right" style="padding:6px 0;font-family:${SANS};font-size:13px;color:${BRAND_MUTED};">− ${escapeHtml(d.discountAmount)} RSD</td></tr>`
    : "";
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:24px 0 0 0;">
    ${subtotalRow}
    ${discountRow}
    <tr><td colspan="2" style="padding:8px 0 0 0;border-top:2px solid ${BRAND_DARK};"></td></tr>
    <tr>
      <td style="padding:14px 0 0 0;font-family:${SANS};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND_DARK};font-weight:600;">Ukupno</td>
      <td align="right" style="padding:14px 0 0 0;font-family:${SERIF};font-size:24px;color:${BRAND_DARK};font-weight:500;letter-spacing:-0.01em;">${escapeHtml(d.total)} <span style="font-family:${SANS};font-size:12px;color:${BRAND_MUTED};letter-spacing:0.15em;">RSD</span></td>
    </tr>
  </table>`;
}

function footer(): string {
  return `<div style="text-align:center;padding:40px 0 0 0;border-top:1px solid ${BRAND_LINE};margin-top:48px;">
    <div style="font-family:${SERIF};font-weight:400;color:${BRAND_DARK};letter-spacing:0.18em;font-size:18px;line-height:1;">0202 <span style="font-family:${SANS};font-size:9px;letter-spacing:0.32em;text-transform:uppercase;font-weight:500;vertical-align:2px;">skin</span></div>
    <div style="font-family:${SANS};font-size:11px;color:${BRAND_MUTED};margin-top:10px;letter-spacing:0.04em;"><a href="https://0202skin.com" style="color:${BRAND_MUTED};text-decoration:none;">0202skin.com</a></div>
  </div>`;
}

function shell(inner: string): string {
  const html = `<!DOCTYPE html>
<html lang="sr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="light only">
<title>0202 SKIN</title>
</head>
<body style="margin:0;padding:0;background:${BRAND_CREAM};font-family:${SANS};color:${BRAND_INK};-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_CREAM};">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BRAND_PAPER};border:1px solid ${BRAND_LINE};">
          <tr>
            <td style="padding:40px 36px 36px 36px;">
              ${inner}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return html.replace(/>\s+</g, "><");
}

export function customerOrderEmailHtml(d: OrderEmailData, isTestMode = false): string {
  const firstName = (d.customerName || "").split(" ")[0] || "";
  const greeting = firstName ? `Hvala na porudžbini, ${escapeHtml(firstName)}.` : "Hvala na porudžbini.";
  const inner = `
    ${testBanner(isTestMode)}
    ${brandHeader()}
    ${eyebrow("Potvrda porudžbine")}
    <h1 style="margin:0 0 14px 0;font-family:${SERIF};font-size:34px;font-weight:400;line-height:1.2;color:${BRAND_DARK};text-align:center;letter-spacing:-0.01em;">${greeting}</h1>
    <p style="margin:0 auto 8px auto;font-family:${SANS};font-size:14px;line-height:1.7;color:${BRAND_INK};text-align:center;max-width:440px;">Vaša porudžbina je primljena. Spremamo je pažljivo, pre slanja.</p>
    ${orderNumberBlock(d.orderId)}
    ${shippingCard(d, false)}
    ${renderItemsTable(d.items)}
    ${totalsBlock(d)}
    ${d.note ? `<div style="margin:24px 0 0 0;padding:18px 22px;background:${BRAND_CREAM};border:1px solid ${BRAND_LINE};"><div style="font-family:${SANS};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND_DARK};font-weight:600;margin-bottom:8px;">Napomena</div><div style="font-family:${SERIF};font-size:15px;color:${BRAND_DARK};font-style:italic;line-height:1.5;">${escapeHtml(d.note)}</div></div>` : ""}
    ${footer()}
  `;
  return shell(inner);
}

export function adminOrderEmailHtml(d: OrderEmailData, isTestMode = false): string {
  const inner = `
    ${testBanner(isTestMode)}
    ${brandHeader()}
    ${eyebrow("Nova porudžbina")}
    <h1 style="margin:0 0 14px 0;font-family:${SERIF};font-size:30px;font-weight:400;line-height:1.2;color:${BRAND_DARK};text-align:center;letter-spacing:-0.01em;">Stigla je nova porudžbina.</h1>
    <p style="margin:0 auto 8px auto;font-family:${SANS};font-size:14px;line-height:1.7;color:${BRAND_INK};text-align:center;max-width:440px;">Pregledaj detalje ispod i pripremi paket.</p>
    ${orderNumberBlock(d.orderId)}
    ${shippingCard(d, true)}
    ${renderItemsTable(d.items)}
    ${totalsBlock(d)}
    ${d.note ? `<div style="margin:24px 0 0 0;padding:18px 22px;background:${BRAND_CREAM};border:1px solid ${BRAND_LINE};"><div style="font-family:${SANS};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND_DARK};font-weight:600;margin-bottom:8px;">Napomena kupca</div><div style="font-family:${SERIF};font-size:15px;color:${BRAND_DARK};font-style:italic;line-height:1.5;">${escapeHtml(d.note)}</div></div>` : ""}
    ${footer()}
  `;
  return shell(inner);
}
