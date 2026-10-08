import { descargarBlob } from "@/lib/api/http"; // ajustar al nombre real del cliente HTTP

function celda(valor: string): string {
  return `"${valor.replace(/"/g, '""')}"`;
}

/** CSV con BOM y ";" como separador para que Excel (configuración regional es-*) lo abra bien. */
export function exportarCsv(nombreArchivo: string, columnas: string[], filas: string[][]) {
  const lineas = [columnas, ...filas].map((fila) => fila.map(celda).join(";"));
  const blob = new Blob(["\uFEFF" + lineas.join("\r\n")], { type: "text/csv;charset=utf-8" });
  descargarBlob(blob, nombreArchivo);
}
