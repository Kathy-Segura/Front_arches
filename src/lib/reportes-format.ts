// Formateo de valores del backend (sin pasar por Date, para evitar desfases de zona horaria).

export const DASH = "—";

/** "2026-10-08" | "2026-10-08T14:30:00" -> "08/10/2026" */
export function formatFecha(iso?: string | null): string {
  if (!iso) return DASH;
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/** "2026-10-08T14:30:00" -> "14:30" */
export function formatHora(iso?: string | null): string {
  return iso && iso.length >= 16 ? iso.slice(11, 16) : DASH;
}

export function formatFechaHora(iso?: string | null): string {
  if (!iso) return DASH;
  return `${formatFecha(iso)} ${formatHora(iso)}`;
}

export function formatMoneda(valor: number): string {
  return `C$ ${valor.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "en_proceso" -> "en proceso" */
export function formatEstado(estado?: string | null): string {
  return estado ? estado.replace(/_/g, " ") : DASH;
}

/** "2026-03-01" -> "mar 26" */
export function mesCorto(iso: string): string {
  const [y = 1970, m = 1] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-NI", { month: "short", year: "2-digit" });
}
