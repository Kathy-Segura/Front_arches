export type Cell = string | number;

function slug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob(["\ufeff" + content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Exporta a CSV (separador ';' compatible con Excel en configuración regional es-NI). */
export function exportCsv(name: string, columns: string[], rows: Cell[][]) {
  const esc = (v: Cell) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [columns.map(esc).join(";"), ...rows.map((r) => r.map(esc).join(";"))].join("\r\n");
  download(`${slug(name)}-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv");
}

/** Exporta a un archivo .xls (tabla HTML) que Excel abre con formato. */
export function exportExcel(name: string, columns: string[], rows: Cell[][]) {
  const esc = (v: Cell) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8" />
    <style>th{background:#e0f2fe;color:#075985;border:1px solid #bae6fd;padding:6px;text-align:left}
    td{border:1px solid #e2e8f0;padding:6px}</style></head><body>
    <h3>ARCHES — ${esc(name)}</h3>
    <table><thead><tr>${columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table></body></html>`;
  download(`${slug(name)}-${new Date().toISOString().slice(0, 10)}.xls`, html, "application/vnd.ms-excel");
}
