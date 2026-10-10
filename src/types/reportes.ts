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

/** CitaDTO */
export interface CitaReporteDTO {
  idCita: number;
  idPaciente: number;
  nombrePaciente: string;
  idPersonal: number;
  nombrePersonal: string;
  idProcedimiento: number | null;
  nombreProcedimiento: string | null;
  fechaHora: string; // LocalDateTime
  duracionMinutos: number;
  estadoCita: string;
  idMotivo: number | null;
  nombreMotivo: string | null;
  notas: string | null;
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