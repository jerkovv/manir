// Jednostavan {placeholder} renderer + generator HTML tabele proizvoda.
export type Item = { name: string; quantity: number; price: number };

export function renderItemsTable(items: Item[]): string {
  const rows = items
    .map(
      (it) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;">${escapeHtml(it.name)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">${it.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;">${(it.price * it.quantity).toLocaleString("sr-RS")} RSD</td>
    </tr>`,
    )
    .join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #eee;font-family:Arial,sans-serif;font-size:14px;">
    <thead>
      <tr style="background:#F5F0E8;">
        <th style="padding:10px 12px;text-align:left;font-weight:600;">Proizvod</th>
        <th style="padding:10px 12px;text-align:center;font-weight:600;">Kol.</th>
        <th style="padding:10px 12px;text-align:right;font-weight:600;">Cena</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

export function applyTemplate(
  template: string,
  data: Record<string, string | number>,
): string {
  let out = template;
  for (const [k, v] of Object.entries(data)) {
    // {itemsTable} se ne escape-uje (već je HTML)
    const raw = k === "itemsTable";
    const value = raw ? String(v) : escapeHtml(String(v));
    out = out.replaceAll(`{${k}}`, value);
  }
  return out;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
