/** Client-side data export helpers (CSV + printable PDF via the browser). */

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw = typeof value === "object" ? JSON.stringify(value) : String(value);
  // Guard against CSV formula injection in spreadsheet apps.
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (!rows.length) return "";
  const cols = columns ?? Object.keys(rows[0] as Record<string, unknown>);
  const head = cols.map(escapeCsv).join(",");
  const body = rows.map((r) => cols.map((c) => escapeCsv(r[c])).join(",")).join("\n");
  return `${head}\n${body}`;
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[], columns?: string[]) {
  const csv = toCsv(rows, columns);
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Opens the browser print dialog with a clean table — users can "Save as PDF". */
export function printTableAsPdf(
  title: string,
  rows: Record<string, unknown>[],
  columns?: string[],
) {
  if (!rows.length) return;
  const cols = columns ?? Object.keys(rows[0] as Record<string, unknown>);
  const escapeHtml = (v: unknown) =>
    String(v ?? "").replace(/[&<>"]/g, (c) =>
      c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
    );
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
  <style>
    body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;padding:24px;color:#0f172a}
    h1{font-size:18px;margin:0 0 4px}
    p{font-size:12px;color:#64748b;margin:0 0 16px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left}
    th{background:#0f766e;color:#fff;text-transform:uppercase;letter-spacing:.04em}
    tr:nth-child(even) td{background:#f8fafc}
  </style></head><body>
  <h1>DiniM3ak — ${escapeHtml(title)}</h1>
  <p>${rows.length} lignes · ${new Date().toLocaleString("fr-MA")}</p>
  <table><thead><tr>${cols.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>
  <tbody>${rows
    .map((r) => `<tr>${cols.map((c) => `<td>${escapeHtml(r[c])}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>
  <script>window.onload=()=>{window.print();}<\/script></body></html>`;

  const win = window.open("", "_blank", "width=1024,height=768");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
