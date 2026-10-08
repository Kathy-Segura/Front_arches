// Tipos del módulo de reportes. Espejo de los DTOs de com.clinica.arches.dto
// (Jackson: LocalDate -> "yyyy-MM-dd", LocalDateTime -> "yyyy-MM-ddTHH:mm:ss",
// Long/Integer/BigDecimal -> number).

export type TipoReporte = "citas" | "procedimientos" | "actividad";

export type EstadoCita = "programada" | "confirmada" | "atendida" | "cancelada";
export type EstadoAvance = "propuesto" | "pendiente" | "en_proceso" | "completado";

/** Query params de GET /api/reportes/{citas|procedimientos|actividad}. */
export interface FiltrosReporte {
  desde?: string | undefined; // yyyy-MM-dd
  hasta?: string | undefined; // yyyy-MM-dd
  estado?: string | undefined; // se ignora en "actividad"
}

/**
 * CitaDTO.java NO venía en el zip: estos campos son una suposición.
 * Confirmar contra CitaDTO y ajustar (si ya existe en types/, importar ese).
 */
export interface CitaReporteDTO {
  idCita: number;
  paciente: string | null;
  procedimiento: string | null;
  fechaHora: string; // LocalDateTime
  odontologo: string | null;
  estado: string;
}

/** ReporteProcedimientoDTO */
export interface ReporteProcedimientoDTO {
  idTratamiento: number;
  paciente: string;
  procedimiento: string;
  categoria: string | null;
  fechaProgramada: string | null; // LocalDate
  odontologo: string;
  costoTotal: number; // BigDecimal
  estadoAvance: string;
  estadoPago: string | null;
}

/** ReporteActividadDTO (usuario y módulo vienen de LEFT JOIN: pueden ser null). */
export interface ReporteActividadDTO {
  idBitacora: number;
  usuario: string | null;
  accion: string;
  modulo: string | null;
  fechaHora: string; // LocalDateTime
  direccionIp: string | null;
}

/** PacientesNuevosVsRecurrentesDTO: una fila por mes (primer día del mes). */
export interface PacientesNuevosVsRecurrentesDTO {
  mes: string; // LocalDate
  pacientesNuevos: number;
  pacientesRecurrentes: number;
}

/** CargaOdontologoDTO */
export interface CargaOdontologoDTO {
  idPersonal: number;
  odontologo: string;
  totalCitas: number;
  horas: number; // BigDecimal
}

/** Resultado tabular normalizado para la vista previa. */
export type ReporteTabular =
  | { tipo: "citas"; filas: CitaReporteDTO[] }
  | { tipo: "procedimientos"; filas: ReporteProcedimientoDTO[] }
  | { tipo: "actividad"; filas: ReporteActividadDTO[] };
