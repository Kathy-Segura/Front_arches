// Tipos espejo de com.clinica.arches.dto.* del módulo Expediente clínico.

export interface ExpedienteResumenDTO {
  idPaciente: number;
  nombreCompleto: string;
  edad: number | null;
  estadoExpediente: string | null;
  historiaClinicaActualizada: string | null; // ISO LocalDateTime
  totalDiagnosticos: number;
  totalNotasEvolucion: number;
  totalCitasAtendidas: number;
}

export interface HistoriaClinicaDTO {
  idHistoria: number | null; // null si el paciente aún no tiene historia
  idPaciente: number;
  antecedentesMedicos: string | null;
  antecedentesOdontologicos: string | null;
  habitos: string | null;
  fechaActualizacion: string | null;
}

export interface HistoriaClinicaInput {
  antecedentesMedicos: string;
  antecedentesOdontologicos: string;
  habitos: string;
}

export interface DiagnosticoDTO {
  idDiagnostico: number;
  idPaciente: number;
  idPersonal: number;
  nombrePersonal: string | null;
  diagnostico: string;
  descripcion: string | null;
  fechaDiagnostico: string; // yyyy-MM-dd
}

export interface DiagnosticoInput {
  idPersonal: number;
  diagnostico: string;
  descripcion?: string | undefined;
  fechaDiagnostico?: string | undefined; // yyyy-MM-dd; si falta, el back usa hoy
}

export interface EvolucionDTO {
  idEvolucion: number;
  idPaciente: number;
  idPersonal: number;
  nombrePersonal: string | null;
  nota: string;
  fechaRegistro: string; // ISO LocalDateTime
}

export interface EvolucionInput {
  idPersonal: number;
  nota: string;
}

export interface HallazgoTipoDTO {
  idHallazgoTipo: number;
  codigoHallazgo: string;
  nombreHallazgo: string;
  colorRepresentativo: string | null;
}

export interface OdontogramaPiezaDTO {
  numeroPieza: number;
  codigoHallazgo: string | null;
  nombreHallazgo: string | null;
  colorRepresentativo: string | null;
  fechaActualizacion: string | null;
}

export interface HallazgoHistorialDTO {
  idRegistro: number;
  numeroPieza: number;
  idHallazgoTipo: number;
  codigoHallazgo: string | null;
  nombreHallazgo: string | null;
  colorRepresentativo: string | null;
  idPersonal: number;
  nombrePersonal: string | null;
  fechaRegistro: string;
  observaciones: string | null;
}

export interface HallazgoInput {
  idHallazgoTipo: number;
  idPersonal: number;
  observaciones?: string | undefined;
}

export interface PlanTratamientoDTO {
  idTratamiento: number;
  idProcedimiento: number;
  nombreProcedimiento: string | null;
  idPersonal: number;
  nombrePersonal: string | null;
  sesionesPlanificadas: number;
  costoTotal: number;
  estadoAvance: string;
  estadoPago: string;
  fechaProgramada: string | null;
}

/** Mismos campos que PersonalDTO del back (selector de odontólogo). */
export interface OdontologoDTO {
  idPersonal: number;
  nombreCompleto: string;
  cargo: string;
  estado: string;
  numeroLicencia: string | null;
}

/** Numeración FDI de dentición permanente, en el orden en que se dibuja el odontograma. */
export const PIEZAS_SUPERIORES = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const PIEZAS_INFERIORES = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

/** Fecha yyyy-MM-dd o ISO LocalDateTime -> dd/MM/yyyy (sin desfase de zona horaria). */
export function formatearFecha(valor: string | null | undefined): string {
  if (!valor) return "—";
  const [fecha = ""] = valor.split("T");
  const [anio, mes, dia] = fecha.split("-");
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : valor;
}

/** ISO LocalDateTime -> "dd/MM/yyyy HH:mm". */
export function formatearFechaHora(valor: string | null | undefined): string {
  if (!valor) return "—";
  const [, hora = ""] = valor.split("T");
  const hhmm = hora.slice(0, 5);
  return hhmm ? `${formatearFecha(valor)} ${hhmm}` : formatearFecha(valor);
}
