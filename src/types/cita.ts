// Tipos espejo de com.clinica.arches.dto.Cita* — mismos nombres de
// propiedad que produce Jackson desde las clases @Data del backend.

export type EstadoCita = "programada" | "confirmada" | "atendida" | "cancelada";

export interface CitaDTO {
  idCita: number;
  idPaciente: number;
  nombrePaciente: string;
  idPersonal: number;
  nombrePersonal: string;
  idProcedimiento: number | null;
  nombreProcedimiento: string | null;
  fechaHora: string; // ISO LocalDateTime, ej: "2026-08-08T09:00:00"
  duracionMinutos: number;
  estadoCita: EstadoCita | string;
  idMotivo: number | null;
  nombreMotivo: string | null;
  notas: string | null;
}

// --- Bodies para crear/actualizar/cancelar ---

export interface CitaInput {
  idPaciente: number;
  idPersonal: number;
  idProcedimiento?: number;
  fechaHora: string; // combinar fecha + hora del formulario en ISO antes de enviar
  duracionMinutos?: number;
  notas?: string;
}

export interface CitaCancelarInput {
  idMotivo?: number;
  notas?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // página actual, 0-based
  size: number;
}

export interface ListarCitasParams {
  search?: string;
  idPersonal?: number;
  estado?: EstadoCita | "";
  desde?: string; // yyyy-MM-dd
  hasta?: string; // yyyy-MM-dd
  page?: number;
  size?: number;
}

export interface MotivoCancelacionDTO {
  idMotivo: number;
  nombreMotivo: string;
}

export const OPCIONES_ESTADO_CITA: { value: EstadoCita; label: string }[] = [
  { value: "programada", label: "Programada" },
  { value: "confirmada", label: "Confirmada" },
  { value: "atendida", label: "Atendida" },
  { value: "cancelada", label: "Cancelada" },
];

/** El "código" que se ve en la tabla (C-0001) se genera en el cliente, igual que P-0001 en pacientes. */
export function codigoCita(idCita: number): string {
  return `C-${String(idCita).padStart(4, "0")}`;
}

/** Combina un <input type="date"> y un <input type="time"> en un ISO LocalDateTime sin timezone. */
export function combinarFechaHora(fecha: string, hora: string): string {
  const horaCompleta = hora.length === 5 ? `${hora}:00` : hora; // "09:00" -> "09:00:00"
  return `${fecha}T${horaCompleta}`;
}

/** Separa un ISO LocalDateTime en { fecha, hora } para precargar los <input>. */
export function separarFechaHora(fechaHora: string): { fecha: string; hora: string } {
  const [fecha = "", horaCompleta] = fechaHora.split("T");
  return { fecha, hora: (horaCompleta ?? "00:00:00").slice(0, 5) };
}