// Premium editorial email template za 0202skin.
// Renderuje brutalno minimalistički HTML — krem paleta, serifna tipografija, jaki kontrasti.

export type Item = { name: string; quantity: number; price: number };

const BRAND_NAME = "0202skin";
const BRAND_CREAM = "#F4EFE6";    // glavni krem fon
const BRAND_PAPER = "#FBF8F2";    // svetliji krem (kartica)
const BRAND_DARK = "#1A1714";     // duboka mokka-crna
const BRAND_INK = "#2B2620";      // tekst
const BRAND_MUTED = "#8B8378";    // peščana siva
const BRAND_LINE = "#E2D9C9";     // suptilna linija
const BRAND_ACCENT = "#7A6A55";   // toplo bronza-smeđa
const SERIF = "'Cormorant Garamond', 'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'Courier New', Courier, monospace";

export function renderItemsTable(items: Item[]): string {
  const rows = items
    .map(
      (it) => `
    <tr>
      <td style="padding:22px 0;border-bottom:1px solid ${BRAND_LINE};font-family:${SERIF};font-size:18px;color:${BRAND_INK};line-height:1.35;vertical-align:top;font-weight:500;letter-spacing:0.005em;">
        <div>${escapeHtml(it.name)}</div>
        <div style="font-family:${MONO};font-size:10px;color:${BRAND_MUTED};margin-top:8px;letter-spacing:0.22em;text-transform:uppercase;font-weight:400;">${it.quantity} kom &nbsp;·&nbsp; ${it.price.toLocaleString("sr-RS")} RSD / kom</div>
      </td>
      <td style="padding:22px 0;border-bottom:1px solid ${BRAND_LINE};font-family:${SERIF};font-size:20px;color:${BRAND_DARK};text-align:right;font-weight:500;vertical-align:top;white-space:nowrap;letter-spacing:-0.01em;">
        ${(it.price * it.quantity).toLocaleString("sr-RS")} RSD
      </td>
    </tr>`,
    )
    .join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0;">
    <tbody>${rows}</tbody>
  </table>`;
}

/**
 * applyTemplate — sad zamenjuje placeholder-e UNUTAR premium wrapper-a.
 * Ako template iz baze sadrži samo placeholder-e (ili je prazan), automatski ga
 * obavija premium dizajnom. Ako sadrži pun HTML (<html>), koristi ga kako jeste.
 */
export function applyTemplate(
  template: string,
  data: Record<string, string | number>,
): string {
  // Ako je template prazan, koristi premium fallback (admin može da editiuje u panelu).
  if (!template || !template.trim()) {
    return wrapPremium(data);
  }
  // Inače poštuj šablon iz baze — samo zameni {placeholder}-e.
  let s = template;
  for (const [k, v] of Object.entries(data)) {
    s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}

function wrapPremium(data: Record<string, string | number>): string {
  const orderId = String(data.orderId ?? "");
  const customerName = String(data.customerName ?? "");
  const customerEmail = String(data.customerEmail ?? "");
  const total = String(data.total ?? "");
  const itemsTable = String(data.itemsTable ?? "");
  const isAdmin = !!data.__isAdmin;

  const firstName = customerName.split(" ")[0] || "";
  const eyebrow = isAdmin ? "Nova porudžbina" : "Potvrda porudžbine";
  const greeting = isAdmin
    ? `Nova porudžbina`
    : (firstName ? `Hvala, ${firstName}` : "Hvala na poverenju");
  const subline = isAdmin
    ? `Stigla je nova porudžbina. Pregledaj detalje ispod i pripremi paket.`
    : `Tvoja porudžbina je zabeležena. Spremamo je pažljivo, ručno, pre slanja.`;

  return `<!DOCTYPE html>
<html lang="sr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${BRAND_NAME}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND_CREAM};font-family:${SANS};color:${BRAND_INK};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${isAdmin ? `Nova porudžbina #${escapeHtml(orderId)} · ${escapeHtml(customerName)}` : `Potvrda porudžbine #${escapeHtml(orderId)} · ${BRAND_NAME}`}
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_CREAM};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BRAND_PAPER};border:1px solid ${BRAND_LINE};">

          <!-- Brand header — replicira logo sa sajta -->
          <tr>
            <td style="padding:36px 48px 8px;text-align:center;background:${BRAND_PAPER};border-bottom:1px solid ${BRAND_LINE};">
              <div style="font-family:${SERIF};font-weight:300;color:${BRAND_DARK};letter-spacing:0.15em;font-size:30px;line-height:1;">
                0202 <span style="font-family:${SANS};font-size:13px;letter-spacing:0.32em;text-transform:uppercase;font-weight:400;vertical-align:3px;">skin</span>
              </div>
            </td>
          </tr>

          <!-- Eyebrow -->
          <tr>
            <td style="padding:48px 48px 0;text-align:center;">
              <div style="font-family:${MONO};font-size:10px;color:${BRAND_MUTED};letter-spacing:0.32em;text-transform:uppercase;">
                ${eyebrow}
              </div>
              <div style="margin:18px auto 0;height:1px;background:${BRAND_DARK};width:32px;"></div>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:28px 48px 8px;text-align:center;">
              <h1 style="font-family:${SERIF};font-size:42px;font-weight:400;line-height:1.15;color:${BRAND_DARK};margin:0 0 18px;letter-spacing:-0.015em;">
                ${escapeHtml(greeting)}.
              </h1>
              <p style="font-family:${SANS};font-size:14px;line-height:1.75;color:${BRAND_MUTED};margin:0 auto 8px;font-weight:400;max-width:420px;">
                ${subline}
              </p>
            </td>
          </tr>

          <!-- Order number — minimal -->
          <tr>
            <td style="padding:36px 48px 0;text-align:center;">
              <div style="font-family:${MONO};font-size:10px;color:${BRAND_MUTED};letter-spacing:0.32em;text-transform:uppercase;margin-bottom:10px;">
                Broj porudžbine
              </div>
              <div style="font-family:${SERIF};font-size:34px;color:${BRAND_DARK};font-weight:500;letter-spacing:0.02em;line-height:1;">
                ${escapeHtml(orderId)}
              </div>
            </td>
          </tr>

          <!-- Customer block -->
          ${customerName || customerEmail ? `
          <tr>
            <td style="padding:36px 48px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_CREAM};border:1px solid ${BRAND_LINE};">
                <tr>
                  <td style="padding:22px 26px;">
                    <div style="font-family:${MONO};font-size:9px;color:${BRAND_MUTED};letter-spacing:0.32em;text-transform:uppercase;margin-bottom:8px;">
                      ${isAdmin ? 'Kupac' : 'Naručilac'}
                    </div>
                    <div style="font-family:${SERIF};font-size:22px;color:${BRAND_DARK};font-weight:500;line-height:1.3;">
                      ${escapeHtml(customerName) || '—'}
                    </div>
                    ${isAdmin && customerEmail ? `<div style="font-family:${MONO};font-size:11px;color:${BRAND_ACCENT};letter-spacing:0.05em;margin-top:8px;">${escapeHtml(customerEmail)}</div>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ''}

          <!-- Items header -->
          <tr>
            <td style="padding:48px 48px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:2px solid ${BRAND_DARK};padding-bottom:0;">
                <tr>
                  <td style="padding:0 0 12px;font-family:${MONO};font-size:10px;color:${BRAND_DARK};letter-spacing:0.32em;text-transform:uppercase;font-weight:600;">
                    Stavke
                  </td>
                  <td style="padding:0 0 12px;font-family:${MONO};font-size:10px;color:${BRAND_DARK};letter-spacing:0.32em;text-transform:uppercase;text-align:right;font-weight:600;">
                    Iznos
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding:0 48px;">
              ${itemsTable}
            </td>
          </tr>

          <!-- Total -->
          <tr>
            <td style="padding:8px 48px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 0 0;font-family:${MONO};font-size:11px;color:${BRAND_MUTED};letter-spacing:0.32em;text-transform:uppercase;">
                    Ukupno
                  </td>
                  <td style="padding:28px 0 0;font-family:${SERIF};font-size:34px;color:${BRAND_DARK};text-align:right;font-weight:500;letter-spacing:-0.015em;line-height:1;">
                    ${escapeHtml(total)} <span style="font-family:${MONO};font-size:12px;color:${BRAND_MUTED};letter-spacing:0.2em;vertical-align:6px;">RSD</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${isAdmin ? `` : `
          <!-- Care note -->
          <tr>
            <td style="padding:56px 48px 0;">
              <div style="border-top:1px solid ${BRAND_LINE};border-bottom:1px solid ${BRAND_LINE};padding:36px 24px;text-align:center;">
                <div style="font-family:${SERIF};font-size:20px;font-style:italic;color:${BRAND_DARK};line-height:1.55;font-weight:400;">
                  „Negujemo kožu kao što negujemo veze —<br>nežno, iskreno, sa pažnjom."
                </div>
              </div>
            </td>
          </tr>`}

          <!-- Footer -->
          <tr>
            <td style="padding:56px 48px 56px;text-align:center;">
              <div style="font-family:${SERIF};font-weight:300;color:${BRAND_DARK};letter-spacing:0.15em;font-size:18px;line-height:1;">
                0202 <span style="font-family:${SANS};font-size:9px;letter-spacing:0.32em;text-transform:uppercase;font-weight:400;vertical-align:2px;">skin</span>
              </div>
              <div style="font-family:${SANS};font-size:11px;color:${BRAND_MUTED};margin-top:10px;line-height:1.7;font-weight:400;letter-spacing:0.04em;">
                Prirodna nega kože
              </div>
              <div style="margin:24px auto 0;height:1px;background:${BRAND_LINE};width:60px;"></div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
