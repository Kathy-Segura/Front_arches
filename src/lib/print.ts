export type PrintField = { label: string; value: string; full?: boolean | undefined };

const styles = `
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; color: #0f2733; margin: 32px; }
  header { border-bottom: 2px solid #38bdf8; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
  .brand { font-size: 20px; font-weight: 700; letter-spacing: .12em; color: #0369a1; }
  .sub { font-size: 11px; color: #64748b; }
  h1 { font-size: 16px; margin: 0 0 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
  th { text-align: left; background: #e0f2fe; color: #075985; padding: 8px; border-bottom: 1px solid #bae6fd; }
  td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f8fafc; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin-top: 12px; }
  .f-label { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #64748b; }
  .f-value { font-size: 13px; font-weight: 500; }
  footer { margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
`;

function open(title: string, body: string) {
  const fecha = new Date().toLocaleString("es-NI");
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) return false;
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8" />
    <title>${title}</title><style>${styles}</style></head><body>
    <header>
      <div><div class="brand">ARCHES</div><div class="sub">Clínica de Salud Integral Odontológica</div></div>
      <div class="sub">Emitido: ${fecha}</div>
    </header>
    <h1>${title}</h1>
    ${body}
    <footer><span>ARCHES — Documento generado por el sistema</span><span>${fecha}</span></footer>
    </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
  return true;
}

export function printRecord(title: string, fields: PrintField[]) {
  const body = `<div class="grid">${fields
    .map(
      (f) =>
        `<div${f.full ? ' style="grid-column:1 / -1"' : ""}><div class="f-label">${f.label}</div><div class="f-value">${f.value}</div></div>`,
    )
    .join("")}</div>`;
  return open(title, body);
}

export function printTable(title: string, columns: string[], rows: (string | number)[][], subtitle?: string) {
  const body = `${subtitle ? `<p class="sub">${subtitle}</p>` : ""}
    <table><thead><tr>${columns.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  return open(title, body);
}
