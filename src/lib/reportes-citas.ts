import { DASH, formatEstado, formatFecha, formatHora } from "@/lib/reportes-format";
import type { CitaReporteDTO } from "@/types/reportes";

/** Fila de la vista previa: Paciente, Procedimiento, Fecha, Hora, Odontólogo, Estado. */
export function filaCita(c: CitaReporteDTO): string[] {
  return [
    c.nombrePaciente,
    c.nombreProcedimiento ?? DASH,
    formatFecha(c.fechaHora),
    formatHora(c.fechaHora),
    c.nombrePersonal,
    formatEstado(c.estadoCita),
  ];
}