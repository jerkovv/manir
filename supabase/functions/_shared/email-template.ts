// Premium editorial email template za 0202skin.
// Renderuje brutalno minimalistički HTML — krem paleta, serifna tipografija, jaki kontrasti.

export type Item = { name: string; quantity: number; price: number };

const BRAND_NAME = "0202skin";
const BRAND_BG = "#F5F0E8";       // krem
const BRAND_DARK = "#1a1a1a";     // skoro crna
const BRAND_MUTED = "#8a8580";    // peščana siva
const BRAND_LINE = "#e3dcd0";     // suptilna linija
const SERIF = "'Cormorant Garamond', 'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'Courier New', Courier, monospace";

export function renderItemsTable(items: Item[]): string {
  const rows = items
    .map(
      (it) => `
    <tr>
      <td style="padding:18px 0;border-bottom:1px solid ${BRAND_LINE};font-family:${SANS};font-size:14px;color:${BRAND_DARK};line-height:1.5;vertical-align:top;">
        <div style="font-weight:500;letter-spacing:0.01em;">${escapeHtml(it.name)}</div>
        <div style="font-family:${MONO};font-size:11px;color:${BRAND_MUTED};margin-top:4px;letter-spacing:0.08em;text-transform:uppercase;">${it.quantity} × ${it.price.toLocaleString("sr-RS")} RSD</div>
      </td>
      <td style="padding:18px 0;border-bottom:1px solid ${BRAND_LINE};font-family:${SANS};font-size:14px;color:${BRAND_DARK};text-align:right;font-weight:500;vertical-align:top;white-space:nowrap;">
        ${(it.price * it.quantity).toLocaleString("sr-RS")} RSD
      </td>
    </tr>`,
    )
    .join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0;">
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
  // Ako je prazan template → koristi default body sa svim podacima
  let body = template?.trim() || "{itemsTable}";

  // Zameni placeholder-e
  for (const [k, v] of Object.entries(data)) {
    const raw = k === "itemsTable";
    const value = raw ? String(v) : escapeHtml(String(v));
    body = body.replaceAll(`{${k}}`, value);
  }

  // Ako template već ima <html>, vrati kako jeste
  if (/<html[\s>]/i.test(body)) return body;

  // Inače → uvij u premium wrapper
  return wrapPremium(body, data);
}

function wrapPremium(innerBody: string, data: Record<string, string | number>): string {
  const orderId = String(data.orderId ?? "");
  const customerName = String(data.customerName ?? "");
  const total = String(data.total ?? "");
  const isAdmin = !!data.customerEmail; // admin template ima customerEmail u placeholder-ima

  const greeting = isAdmin
    ? `Nova porudžbina`
    : (customerName ? `Hvala, ${customerName.split(" ")[0]}` : "Hvala na poverenju");

  const subline = isAdmin
    ? `Stigla je nova porudžbina od ${escapeHtml(customerName) || "kupca"}.`
    : `Tvoja porudžbina je primljena. Pripremamo je sa pažnjom.`;

  return `<!DOCTYPE html>
<html lang="sr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${BRAND_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:${SANS};color:${BRAND_DARK};-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:0;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;">

          <!-- Brand mark -->
          <tr>
            <td style="padding:48px 48px 0;text-align:center;">
              <div style="font-family:${SERIF};font-size:32px;font-weight:400;letter-spacing:0.18em;color:${BRAND_DARK};text-transform:uppercase;">
                ${BRAND_NAME}
              </div>
              <div style="margin-top:14px;height:1px;background:${BRAND_DARK};width:32px;display:inline-block;"></div>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:56px 48px 8px;">
              <div style="font-family:${MONO};font-size:11px;color:${BRAND_MUTED};letter-spacing:0.2em;text-transform:uppercase;margin-bottom:20px;">
                ${isAdmin ? 'Admin obaveštenje' : 'Potvrda porudžbine'} &nbsp;·&nbsp; #${escapeHtml(orderId)}
              </div>
              <h1 style="font-family:${SERIF};font-size:42px;font-weight:400;line-height:1.15;color:${BRAND_DARK};margin:0 0 18px;letter-spacing:-0.01em;">
                ${escapeHtml(greeting)}.
              </h1>
              <p style="font-family:${SANS};font-size:15px;line-height:1.7;color:${BRAND_MUTED};margin:0 0 32px;font-weight:300;">
                ${subline}
              </p>
            </td>
          </tr>

          <!-- Order meta strip -->
          <tr>
            <td style="padding:0 48px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};border-collapse:collapse;">
                <tr>
                  <td style="padding:24px 28px;font-family:${SANS};">
                    <div style="font-family:${MONO};font-size:10px;color:${BRAND_MUTED};letter-spacing:0.2em;text-transform:uppercase;margin-bottom:6px;">Broj porudžbine</div>
                    <div style="font-family:${SERIF};font-size:24px;color:${BRAND_DARK};font-weight:500;letter-spacing:0.02em;">#${escapeHtml(orderId)}</div>
                  </td>
                  ${customerName ? `<td style="padding:24px 28px;font-family:${SANS};text-align:right;border-left:1px solid ${BRAND_LINE};">
                    <div style="font-family:${MONO};font-size:10px;color:${BRAND_MUTED};letter-spacing:0.2em;text-transform:uppercase;margin-bottom:6px;">${isAdmin ? 'Kupac' : 'Naručilac'}</div>
                    <div style="font-family:${SERIF};font-size:18px;color:${BRAND_DARK};font-weight:500;">${escapeHtml(customerName)}</div>
                  </td>` : ''}
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding:48px 48px 8px;">
              <div style="font-family:${MONO};font-size:11px;color:${BRAND_MUTED};letter-spacing:0.25em;text-transform:uppercase;margin-bottom:8px;border-bottom:1px solid ${BRAND_DARK};padding-bottom:14px;">
                Stavke porudžbine
              </div>
              ${innerBody}
            </td>
          </tr>

          <!-- Total -->
          <tr>
            <td style="padding:8px 48px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px 0 0;font-family:${MONO};font-size:11px;color:${BRAND_MUTED};letter-spacing:0.2em;text-transform:uppercase;">
                    Ukupno
                  </td>
                  <td style="padding:24px 0 0;font-family:${SERIF};font-size:32px;color:${BRAND_DARK};text-align:right;font-weight:500;letter-spacing:-0.01em;">
                    ${escapeHtml(total)} RSD
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${isAdmin ? '' : `
          <!-- Care note (samo kupac) -->
          <tr>
            <td style="padding:56px 48px 0;">
              <div style="background:#ffffff;border:1px solid ${BRAND_LINE};padding:32px 28px;text-align:center;">
                <div style="font-family:${SERIF};font-size:18px;font-style:italic;color:${BRAND_DARK};line-height:1.5;font-weight:400;">
                  „Negujemo kožu kao što negujemo veze — nežno, iskreno, sa pažnjom."
                </div>
                <div style="font-family:${MONO};font-size:10px;color:${BRAND_MUTED};letter-spacing:0.25em;text-transform:uppercase;margin-top:18px;">
                  ${BRAND_NAME} · ručno spakovano
                </div>
              </div>
            </td>
          </tr>`}

          <!-- Footer -->
          <tr>
            <td style="padding:64px 48px 48px;text-align:center;">
              <div style="height:1px;background:${BRAND_LINE};width:100%;margin-bottom:32px;"></div>
              <div style="font-family:${SERIF};font-size:16px;color:${BRAND_DARK};letter-spacing:0.18em;text-transform:uppercase;font-weight:400;">
                ${BRAND_NAME}
              </div>
              <div style="font-family:${SANS};font-size:12px;color:${BRAND_MUTED};margin-top:12px;line-height:1.6;font-weight:300;">
                Prirodna nega kože · Beograd
              </div>
              <div style="font-family:${MONO};font-size:10px;color:${BRAND_MUTED};letter-spacing:0.2em;text-transform:uppercase;margin-top:24px;">
                ${isAdmin ? 'Interno obaveštenje' : 'Ovo je automatska potvrda porudžbine'}
              </div>
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
