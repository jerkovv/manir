// Premium email HTML šabloni za 0202 SKIN — koriste {placeholder} sintaksu
// koju razrešava supabase/functions/_shared/email-template.ts (applyTemplate).
// Podržani su i uslovni blokovi {#if field}...{/if}.

const HEAD_COMMON = `<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<style type="text/css">
  body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; display:block; }
  table { border-collapse:collapse !important; }
  body { margin:0 !important; padding:0 !important; width:100% !important; background:#EFE7D6; }
  a { text-decoration:none; color:inherit; }
  a[x-apple-data-detectors] {
    color:inherit !important; text-decoration:none !important;
    font-size:inherit !important; font-family:inherit !important;
    font-weight:inherit !important; line-height:inherit !important;
  }
  @media only screen and (max-width:640px) {
    .frame { padding-left:28px !important; padding-right:28px !important; }
    .h-display { font-size:38px !important; }
    .h-total { font-size:34px !important; line-height:1 !important; }
    .h-order { font-size:24px !important; }
    .item-name { font-size:15px !important; }
    .meta-cell { display:block !important; width:100% !important; padding:0 0 24px !important; border-right:0 !important; }
    .meta-cell-r { padding:24px 0 0 !important; border-top:1px solid #D4CAB3 !important; }
    .info-row td { display:block !important; width:100% !important; padding:0 0 22px !important; }
    .info-row td:last-child { padding-bottom:0 !important; }
    .pad-top-big { padding-top:56px !important; }
  }
</style>
</head>`;

// =====================================================================
// CUSTOMER TEMPLATE — Potvrda porudžbine
// =====================================================================
export const PREMIUM_CUSTOMER_TEMPLATE = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="sr" xml:lang="sr">
${HEAD_COMMON.replace('<head>', '<head><title>0202 SKIN, potvrda</title>')}
<body style="margin:0;padding:0;background:#EFE7D6;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Tvoja porudžbina je primljena.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EFE7D6;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" class="frame" style="max-width:640px;width:100%;background:#EFE7D6;padding:0 56px;">

        <!-- Logo / brand -->
        <tr>
          <td style="padding:8px 0 56px;text-align:center;">
            <div style="font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;color:#1A1714;letter-spacing:0.18em;font-size:34px;line-height:1;">
              0202 <span style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:13px;letter-spacing:0.34em;text-transform:uppercase;font-weight:400;vertical-align:4px;">skin</span>
            </div>
          </td>
        </tr>

        <!-- Eyebrow rule -->
        <tr><td style="padding:0 0 28px;"><div style="height:1px;background:#1A1714;width:48px;"></div></td></tr>

        <!-- Headline -->
        <tr>
          <td style="padding:0 0 18px;">
            <h1 class="h-display" style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-weight:400;font-size:48px;line-height:1.1;color:#1A1714;letter-spacing:-0.015em;">
              {customerName},<br>hvala.
            </h1>
          </td>
        </tr>

        <!-- Subline -->
        <tr>
          <td style="padding:0 0 56px;">
            <p style="margin:0;font-family:Inter,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#5A5044;font-weight:400;max-width:480px;">
              Tvoja porudžbina je primljena.<br>
              Pripremamo je ručno, sa pažnjom koju zaslužuje.
            </p>
          </td>
        </tr>

        <!-- Meta: order # + date -->
        <tr>
          <td style="padding:0 0 56px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #D4CAB3;border-bottom:1px solid #D4CAB3;">
              <tr>
                <td class="meta-cell" width="50%" style="padding:24px 0;border-right:1px solid #D4CAB3;vertical-align:top;">
                  <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#8B8378;letter-spacing:0.32em;text-transform:uppercase;margin-bottom:10px;">Porudžbina</div>
                  <div class="h-order" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#1A1714;font-weight:500;letter-spacing:0.02em;line-height:1;">{orderId}</div>
                </td>
                <td class="meta-cell meta-cell-r" width="50%" style="padding:24px 0 24px 28px;vertical-align:top;">
                  <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#8B8378;letter-spacing:0.32em;text-transform:uppercase;margin-bottom:10px;">Datum</div>
                  <div class="h-order" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#1A1714;font-weight:500;letter-spacing:0.02em;line-height:1;">{orderDate}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Items header -->
        <tr>
          <td style="padding:0 0 14px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:2px solid #1A1714;">
              <tr>
                <td style="padding:0 0 12px;font-family:'Courier New',Courier,monospace;font-size:10px;color:#1A1714;letter-spacing:0.32em;text-transform:uppercase;font-weight:700;">Stavke</td>
                <td style="padding:0 0 12px;font-family:'Courier New',Courier,monospace;font-size:10px;color:#1A1714;letter-spacing:0.32em;text-transform:uppercase;font-weight:700;text-align:right;">RSD</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Items table -->
        <tr><td style="padding:0;">{itemsTable}</td></tr>

        <!-- Subtotal / discount -->
        <tr>
          <td style="padding:24px 0 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              {#if subtotal}
              <tr>
                <td style="padding:8px 0;font-family:'Courier New',Courier,monospace;font-size:10px;color:#8B8378;letter-spacing:0.28em;text-transform:uppercase;">Međuzbir</td>
                <td style="padding:8px 0;font-family:Inter,Helvetica,Arial,sans-serif;font-size:14px;color:#2B2620;text-align:right;font-weight:500;">{subtotal} <span style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#8B8378;letter-spacing:0.2em;">RSD</span></td>
              </tr>
              {/if}
              {#if discountAmount}
              <tr>
                <td style="padding:8px 0;font-family:'Courier New',Courier,monospace;font-size:10px;color:#7A6A55;letter-spacing:0.28em;text-transform:uppercase;">{discountLabel}</td>
                <td style="padding:8px 0;font-family:Inter,Helvetica,Arial,sans-serif;font-size:14px;color:#7A6A55;text-align:right;font-weight:500;">− {discountAmount} <span style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.2em;">RSD</span></td>
              </tr>
              {/if}
            </table>
          </td>
        </tr>

        <!-- Total -->
        <tr>
          <td style="padding:18px 0 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:2px solid #1A1714;">
              <tr>
                <td style="padding:22px 0 0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#1A1714;letter-spacing:0.32em;text-transform:uppercase;font-weight:700;vertical-align:bottom;">Ukupno</td>
                <td class="h-total" style="padding:22px 0 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:46px;color:#1A1714;text-align:right;font-weight:500;letter-spacing:-0.02em;line-height:1;">
                  {total} <span style="font-family:'Courier New',Courier,monospace;font-size:12px;color:#8B8378;letter-spacing:0.2em;vertical-align:8px;">RSD</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Shipping address -->
        {#if shippingAddress}
        <tr>
          <td class="pad-top-big" style="padding:64px 0 0;">
            <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#1A1714;letter-spacing:0.32em;text-transform:uppercase;font-weight:700;margin-bottom:16px;">Adresa za dostavu</div>
            <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;color:#1A1714;line-height:1.55;font-weight:400;">
              {shippingAddress}<br>
              {shippingZip} {shippingCity}
            </div>
          </td>
        </tr>
        {/if}

        <!-- Note -->
        {#if note}
        <tr>
          <td style="padding:40px 0 0;">
            <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#1A1714;letter-spacing:0.32em;text-transform:uppercase;font-weight:700;margin-bottom:16px;">Napomena</div>
            <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-style:italic;color:#2B2620;line-height:1.6;font-weight:400;">„{note}"</div>
          </td>
        </tr>
        {/if}

        <!-- Care quote -->
        <tr>
          <td style="padding:72px 0 0;">
            <div style="height:1px;background:#D4CAB3;width:48px;margin-bottom:28px;"></div>
            <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;font-style:italic;color:#1A1714;line-height:1.55;font-weight:400;max-width:460px;">
              Negujemo kožu kao što negujemo veze, nežno, iskreno, sa pažnjom.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:72px 0 56px;text-align:center;">
            <div style="font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;color:#1A1714;letter-spacing:0.18em;font-size:22px;line-height:1;">
              0202 <span style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.34em;text-transform:uppercase;font-weight:400;vertical-align:3px;">skin</span>
            </div>
            <div style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:11px;color:#8B8378;margin-top:14px;letter-spacing:0.2em;text-transform:uppercase;">Premium Skincare</div>
            <div style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:11px;color:#8B8378;margin-top:8px;letter-spacing:0.05em;">Instagram · @0202skin</div>
            <div style="margin:24px auto 18px;height:1px;background:#D4CAB3;width:48px;"></div>
            <div style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:10px;color:#8B8378;letter-spacing:0.1em;">© 0202 SKIN</div>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

// =====================================================================
// ADMIN TEMPLATE — Nova porudžbina
// =====================================================================
export const PREMIUM_ADMIN_TEMPLATE = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="sr" xml:lang="sr">
${HEAD_COMMON.replace('<head>', '<head><title>0202 SKIN, nova porudžbina</title>')}
<body style="margin:0;padding:0;background:#EFE7D6;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Nova porudžbina, {orderId}.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EFE7D6;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" class="frame" style="max-width:640px;width:100%;background:#EFE7D6;padding:0 56px;">

        <!-- Logo -->
        <tr>
          <td style="padding:8px 0 48px;text-align:center;">
            <div style="font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;color:#1A1714;letter-spacing:0.18em;font-size:30px;line-height:1;">
              0202 <span style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.34em;text-transform:uppercase;font-weight:400;vertical-align:4px;">skin</span>
            </div>
          </td>
        </tr>

        <tr><td style="padding:0 0 24px;"><div style="height:1px;background:#1A1714;width:48px;"></div></td></tr>

        <tr>
          <td style="padding:0 0 16px;">
            <h1 class="h-display" style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-weight:400;font-size:44px;line-height:1.1;color:#1A1714;letter-spacing:-0.015em;">
              Nova porudžbina.
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 48px;">
            <p style="margin:0;font-family:Inter,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:#5A5044;">
              Pregled za pripremu paketa.
            </p>
          </td>
        </tr>

        <!-- Meta: order # + total -->
        <tr>
          <td style="padding:0 0 48px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #D4CAB3;border-bottom:1px solid #D4CAB3;">
              <tr>
                <td class="meta-cell" width="50%" style="padding:24px 0;border-right:1px solid #D4CAB3;vertical-align:top;">
                  <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#8B8378;letter-spacing:0.32em;text-transform:uppercase;margin-bottom:10px;">Porudžbina</div>
                  <div class="h-order" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;color:#1A1714;font-weight:500;letter-spacing:0.02em;line-height:1;">{orderId}</div>
                </td>
                <td class="meta-cell meta-cell-r" width="50%" style="padding:24px 0 24px 28px;vertical-align:top;">
                  <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#8B8378;letter-spacing:0.32em;text-transform:uppercase;margin-bottom:10px;">Iznos</div>
                  <div class="h-order" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;color:#1A1714;font-weight:500;letter-spacing:0.02em;line-height:1;">{total} <span style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#8B8378;letter-spacing:0.2em;vertical-align:3px;">RSD</span></div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Customer block -->
        <tr>
          <td style="padding:0 0 14px;">
            <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#1A1714;letter-spacing:0.32em;text-transform:uppercase;font-weight:700;">Kupac</div>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 48px;border-top:1px solid #D4CAB3;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="info-row">
              <tr>
                <td width="33%" style="padding:22px 16px 22px 0;vertical-align:top;">
                  <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#8B8378;letter-spacing:0.28em;text-transform:uppercase;margin-bottom:8px;">Ime</div>
                  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:#1A1714;line-height:1.4;font-weight:500;">{customerName}</div>
                </td>
                <td width="33%" style="padding:22px 16px;vertical-align:top;">
                  <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#8B8378;letter-spacing:0.28em;text-transform:uppercase;margin-bottom:8px;">Telefon</div>
                  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:#1A1714;line-height:1.4;font-weight:500;">{#if customerPhone}<a href="tel:{customerPhone}" style="color:#1A1714;">{customerPhone}</a>{/if}</div>
                </td>
                <td width="34%" style="padding:22px 0 22px 16px;vertical-align:top;">
                  <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#8B8378;letter-spacing:0.28em;text-transform:uppercase;margin-bottom:8px;">Email</div>
                  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:#1A1714;line-height:1.4;font-weight:500;word-break:break-all;"><a href="mailto:{customerEmail}" style="color:#1A1714;">{customerEmail}</a></div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Shipping address -->
        {#if shippingAddress}
        <tr>
          <td style="padding:0 0 14px;">
            <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#1A1714;letter-spacing:0.32em;text-transform:uppercase;font-weight:700;">Adresa za dostavu</div>
          </td>
        </tr>
        <tr>
          <td style="padding:22px 0 48px;border-top:1px solid #D4CAB3;">
            <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;color:#1A1714;line-height:1.55;font-weight:400;">
              {shippingAddress}<br>
              {shippingZip} {shippingCity}
            </div>
          </td>
        </tr>
        {/if}

        <!-- Note -->
        {#if note}
        <tr>
          <td style="padding:0 0 14px;">
            <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#1A1714;letter-spacing:0.32em;text-transform:uppercase;font-weight:700;">Napomena kupca</div>
          </td>
        </tr>
        <tr>
          <td style="padding:22px 0 48px;border-top:1px solid #D4CAB3;">
            <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-style:italic;color:#2B2620;line-height:1.6;font-weight:400;">„{note}"</div>
          </td>
        </tr>
        {/if}

        <!-- Items header -->
        <tr>
          <td style="padding:0 0 14px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:2px solid #1A1714;">
              <tr>
                <td style="padding:0 0 12px;font-family:'Courier New',Courier,monospace;font-size:10px;color:#1A1714;letter-spacing:0.32em;text-transform:uppercase;font-weight:700;">Stavke</td>
                <td style="padding:0 0 12px;font-family:'Courier New',Courier,monospace;font-size:10px;color:#1A1714;letter-spacing:0.32em;text-transform:uppercase;font-weight:700;text-align:right;">RSD</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Items table -->
        <tr><td style="padding:0;">{itemsTable}</td></tr>

        <!-- Subtotal / discount -->
        <tr>
          <td style="padding:24px 0 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              {#if subtotal}
              <tr>
                <td style="padding:8px 0;font-family:'Courier New',Courier,monospace;font-size:10px;color:#8B8378;letter-spacing:0.28em;text-transform:uppercase;">Međuzbir</td>
                <td style="padding:8px 0;font-family:Inter,Helvetica,Arial,sans-serif;font-size:14px;color:#2B2620;text-align:right;font-weight:500;">{subtotal} <span style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#8B8378;letter-spacing:0.2em;">RSD</span></td>
              </tr>
              {/if}
              {#if discountAmount}
              <tr>
                <td style="padding:8px 0;font-family:'Courier New',Courier,monospace;font-size:10px;color:#7A6A55;letter-spacing:0.28em;text-transform:uppercase;">{discountLabel}</td>
                <td style="padding:8px 0;font-family:Inter,Helvetica,Arial,sans-serif;font-size:14px;color:#7A6A55;text-align:right;font-weight:500;">− {discountAmount} <span style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.2em;">RSD</span></td>
              </tr>
              {/if}
            </table>
          </td>
        </tr>

        <!-- Total -->
        <tr>
          <td style="padding:18px 0 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:2px solid #1A1714;">
              <tr>
                <td style="padding:22px 0 0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#1A1714;letter-spacing:0.32em;text-transform:uppercase;font-weight:700;vertical-align:bottom;">Ukupno</td>
                <td class="h-total" style="padding:22px 0 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:42px;color:#1A1714;text-align:right;font-weight:500;letter-spacing:-0.02em;line-height:1;">
                  {total} <span style="font-family:'Courier New',Courier,monospace;font-size:12px;color:#8B8378;letter-spacing:0.2em;vertical-align:8px;">RSD</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:72px 0 56px;text-align:center;">
            <div style="font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;color:#1A1714;letter-spacing:0.18em;font-size:20px;line-height:1;">
              0202 <span style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.34em;text-transform:uppercase;font-weight:400;vertical-align:3px;">skin</span>
            </div>
            <div style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:11px;color:#8B8378;margin-top:14px;letter-spacing:0.2em;text-transform:uppercase;">Premium Skincare</div>
            <div style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:11px;color:#8B8378;margin-top:8px;letter-spacing:0.05em;">Instagram · @0202skin</div>
            <div style="margin:24px auto 18px;height:1px;background:#D4CAB3;width:48px;"></div>
            <div style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:10px;color:#8B8378;letter-spacing:0.1em;">Sistemska poruka · © 0202 SKIN</div>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

export const PREMIUM_CUSTOMER_SUBJECT = "Potvrda porudžbine {orderId} · 0202 SKIN";
export const PREMIUM_ADMIN_SUBJECT = "Nova porudžbina {orderId} — {customerName}";
