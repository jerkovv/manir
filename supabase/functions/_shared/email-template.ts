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
  // Premium dizajn je default. Šablon iz baze se poštuje SAMO ako sadrži pun HTML
  // dokument (<html>) — tako admin može potpuno custom dizajn da postavi.
  // Inače uvek koristimo premium wrapper da bi sve podatke (adresa, telefon...)
  // korektno renderovali.
  if (template && template.toLowerCase().includes("<html")) {
    let s = template;
    // 1) Uslovni blokovi: {#if field}...{/if}
    //    Blok ostaje ako je vrednost "truthy" (nije prazan string / 0 / undefined).
    s = s.replace(
      /\{#if\s+([a-zA-Z0-9_]+)\}([\s\S]*?)\{\/if\}/g,
      (_m, key: string, inner: string) => {
        const v = data[key];
        const truthy =
          v !== undefined &&
          v !== null &&
          String(v).trim() !== "" &&
          String(v).trim() !== "0";
        return truthy ? inner : "";
      },
    );
    // 2) Zamena placeholder-a {field}
    for (const [k, v] of Object.entries(data)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
    return s;
  }
  return wrapPremium(data);
}

function wrapPremium(data: Record<string, string | number>): string {
  const orderId = String(data.orderId ?? "");
  const customerName = String(data.customerName ?? "");
  const customerEmail = String(data.customerEmail ?? "");
  const total = String(data.total ?? "");
  const itemsTable = String(data.itemsTable ?? "");
  const isAdmin = !!data.__isAdmin;
  const customerPhone = String(data.customerPhone ?? "");
  const shippingAddress = String(data.shippingAddress ?? "");
  const shippingCity = String(data.shippingCity ?? "");
  const shippingZip = String(data.shippingZip ?? "");
  const note = String(data.note ?? "");
  const subtotal = String(data.subtotal ?? "");
  const discountAmount = String(data.discountAmount ?? "");
  const discountLabel = String(data.discountLabel ?? "");

  const firstName = customerName.split(" ")[0] || "";
  const eyebrow = isAdmin ? "Nova porudžbina" : "Potvrda porudžbine";
  const greeting = isAdmin
    ? `Nova porudžbina`
    : (firstName ? `Hvala, ${firstName}` : "Hvala na poverenju");
  const subline = isAdmin
    ? `Stigla je nova porudžbina. Pregledaj detalje ispod i pripremi paket.`
    : `Tvoja porudžbina je zabeležena. Spremamo je pažljivo, ručno, pre slanja.`;

  const fullAddress = [shippingAddress, [shippingZip, shippingCity].filter(Boolean).join(" ")]
    .filter((s) => s && s.trim())
    .join(", ");

  const detailRow = (label: string, value: string) => value ? `
    <tr>
      <td style="padding:10px 0;font-family:${MONO};font-size:10px;color:${BRAND_MUTED};letter-spacing:0.28em;text-transform:uppercase;width:42%;vertical-align:top;line-height:1.5;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;font-family:${SANS};font-size:14px;color:${BRAND_DARK};line-height:1.5;vertical-align:top;font-weight:500;letter-spacing:0.005em;">${escapeHtml(value)}</td>
    </tr>` : "";

  return `<!DOCTYPE html>
<html lang="sr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${BRAND_NAME}</title>
<style>
  @media only screen and (max-width:600px) {
    .px-pad { padding-left:24px !important; padding-right:24px !important; }
    .hero-title { font-size:32px !important; }
    .order-no { font-size:28px !important; }
    .total-amount { font-size:28px !important; }
    .stack-table td { display:block !important; width:100% !important; padding:6px 0 !important; }
    .stack-table td.label { padding-top:14px !important; }
    .summary-row td { padding:8px 0 !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BRAND_CREAM};font-family:${SANS};color:${BRAND_INK};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${isAdmin ? `Nova porudžbina #${escapeHtml(orderId)} · ${escapeHtml(customerName)}` : `Potvrda porudžbine #${escapeHtml(orderId)} · ${BRAND_NAME}`}
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_CREAM};">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BRAND_PAPER};border:1px solid ${BRAND_LINE};">

          <!-- Brand header — replicira logo sa sajta -->
          <tr>
            <td class="px-pad" style="padding:36px 48px 8px;text-align:center;background:${BRAND_PAPER};border-bottom:1px solid ${BRAND_LINE};">
              <div style="font-family:${SERIF};font-weight:300;color:${BRAND_DARK};letter-spacing:0.15em;font-size:30px;line-height:1;">
                0202 <span style="font-family:${SANS};font-size:13px;letter-spacing:0.32em;text-transform:uppercase;font-weight:400;vertical-align:3px;">skin</span>
              </div>
            </td>
          </tr>

          <!-- Eyebrow -->
          <tr>
            <td class="px-pad" style="padding:48px 48px 0;text-align:center;">
              <div style="font-family:${MONO};font-size:10px;color:${BRAND_MUTED};letter-spacing:0.32em;text-transform:uppercase;">
                ${eyebrow}
              </div>
              <div style="margin:18px auto 0;height:1px;background:${BRAND_DARK};width:32px;"></div>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td class="px-pad" style="padding:28px 48px 8px;text-align:center;">
              <h1 class="hero-title" style="font-family:${SERIF};font-size:42px;font-weight:400;line-height:1.15;color:${BRAND_DARK};margin:0 0 18px;letter-spacing:-0.015em;">
                ${escapeHtml(greeting)}.
              </h1>
              <p style="font-family:${SANS};font-size:14px;line-height:1.75;color:${BRAND_MUTED};margin:0 auto 8px;font-weight:400;max-width:420px;">
                ${subline}
              </p>
            </td>
          </tr>

          <!-- Order number — minimal -->
          <tr>
            <td class="px-pad" style="padding:36px 48px 0;text-align:center;">
              <div style="font-family:${MONO};font-size:10px;color:${BRAND_MUTED};letter-spacing:0.32em;text-transform:uppercase;margin-bottom:10px;">
                Broj porudžbine
              </div>
              <div class="order-no" style="font-family:${SERIF};font-size:34px;color:${BRAND_DARK};font-weight:500;letter-spacing:0.02em;line-height:1;">
                ${escapeHtml(orderId)}
              </div>
            </td>
          </tr>

          <!-- Customer details block -->
          ${(customerName || customerEmail || customerPhone) ? `
          <tr>
            <td class="px-pad" style="padding:40px 48px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_CREAM};border:1px solid ${BRAND_LINE};">
                <tr>
                  <td style="padding:24px 26px;">
                    <div style="font-family:${MONO};font-size:10px;color:${BRAND_DARK};letter-spacing:0.32em;text-transform:uppercase;margin-bottom:14px;font-weight:600;">
                      ${isAdmin ? 'Kupac' : 'Naručilac'}
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" class="stack-table">
                      ${detailRow('Ime i prezime', customerName)}
                      ${customerEmail ? detailRow('Email', customerEmail) : ''}
                      ${customerPhone ? detailRow('Telefon', customerPhone) : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ''}

          <!-- Shipping address block -->
          ${fullAddress ? `
          <tr>
            <td class="px-pad" style="padding:20px 48px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_CREAM};border:1px solid ${BRAND_LINE};">
                <tr>
                  <td style="padding:24px 26px;">
                    <div style="font-family:${MONO};font-size:10px;color:${BRAND_DARK};letter-spacing:0.32em;text-transform:uppercase;margin-bottom:14px;font-weight:600;">
                      Adresa za isporuku
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" class="stack-table">
                      ${detailRow('Ulica i broj', shippingAddress)}
                      ${detailRow('Grad', shippingCity)}
                      ${detailRow('Poštanski broj', shippingZip)}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ''}

          <!-- Note block -->
          ${note ? `
          <tr>
            <td class="px-pad" style="padding:20px 48px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_CREAM};border:1px solid ${BRAND_LINE};">
                <tr>
                  <td style="padding:24px 26px;">
                    <div style="font-family:${MONO};font-size:10px;color:${BRAND_DARK};letter-spacing:0.32em;text-transform:uppercase;margin-bottom:12px;font-weight:600;">
                      Napomena
                    </div>
                    <div style="font-family:${SERIF};font-size:16px;color:${BRAND_INK};line-height:1.6;font-style:italic;font-weight:400;">
                      ${escapeHtml(note)}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ''}

          <!-- Items header -->
          <tr>
            <td class="px-pad" style="padding:48px 48px 0;">
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
            <td class="px-pad" style="padding:0 48px;">
              ${itemsTable}
            </td>
          </tr>

          <!-- Subtotal / Discount -->
          ${(subtotal || discountAmount) ? `
          <tr>
            <td class="px-pad" style="padding:0 48px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${subtotal ? `
                <tr class="summary-row">
                  <td style="padding:18px 0 0;font-family:${MONO};font-size:10px;color:${BRAND_MUTED};letter-spacing:0.28em;text-transform:uppercase;">Podzbir</td>
                  <td style="padding:18px 0 0;font-family:${SANS};font-size:14px;color:${BRAND_INK};text-align:right;font-weight:500;">${escapeHtml(subtotal)} <span style="font-family:${MONO};font-size:10px;color:${BRAND_MUTED};letter-spacing:0.2em;">RSD</span></td>
                </tr>` : ''}
                ${discountAmount ? `
                <tr class="summary-row">
                  <td style="padding:10px 0 0;font-family:${MONO};font-size:10px;color:${BRAND_ACCENT};letter-spacing:0.28em;text-transform:uppercase;">Popust${discountLabel ? ` · ${escapeHtml(discountLabel)}` : ''}</td>
                  <td style="padding:10px 0 0;font-family:${SANS};font-size:14px;color:${BRAND_ACCENT};text-align:right;font-weight:500;">− ${escapeHtml(discountAmount)} <span style="font-family:${MONO};font-size:10px;letter-spacing:0.2em;">RSD</span></td>
                </tr>` : ''}
              </table>
            </td>
          </tr>` : ''}

          <!-- Total -->
          <tr>
            <td class="px-pad" style="padding:8px 48px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid ${BRAND_DARK};">
                <tr>
                  <td style="padding:22px 0 0;font-family:${MONO};font-size:11px;color:${BRAND_DARK};letter-spacing:0.32em;text-transform:uppercase;font-weight:600;">
                    Ukupno za uplatu
                  </td>
                  <td class="total-amount" style="padding:22px 0 0;font-family:${SERIF};font-size:34px;color:${BRAND_DARK};text-align:right;font-weight:500;letter-spacing:-0.015em;line-height:1;">
                    ${escapeHtml(total)} <span style="font-family:${MONO};font-size:12px;color:${BRAND_MUTED};letter-spacing:0.2em;vertical-align:6px;">RSD</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${isAdmin ? `` : `
          <!-- Care note -->
          <tr>
            <td class="px-pad" style="padding:56px 48px 0;">
              <div style="border-top:1px solid ${BRAND_LINE};border-bottom:1px solid ${BRAND_LINE};padding:36px 24px;text-align:center;">
                <div style="font-family:${SERIF};font-size:20px;font-style:italic;color:${BRAND_DARK};line-height:1.55;font-weight:400;">
                  „Negujemo kožu kao što negujemo veze —<br>nežno, iskreno, sa pažnjom."
                </div>
              </div>
            </td>
          </tr>`}

          <!-- Footer -->
          <tr>
            <td class="px-pad" style="padding:56px 48px 56px;text-align:center;">
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
