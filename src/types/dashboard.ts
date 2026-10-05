/** Tipos del módulo dashboard — reflejan los DTOs del backend (camelCase). */

export interface DashboardKpis {
  citasHoy: number;
  citasHoyConfirmadas: number;
  citasHoyAtendidas: number;
  pacientesActivos: number;
  pacientesNuevosMes: number;
  tratamientosEnCurso: number;
  tratamientosConSaldo: number;
  ingresosMes: number;
  /** 'YYYY-MM' */
  mesReferencia: string;
}

export interface CitaMes {
  /** 'YYYY-MM' */
  mes: string;
  citas: number;
  atendidas: number;
}

export interface ProcedimientoFrecuente {
  nombre: string;
  total: number;
}

export interface IngresoGastoMes {
  /** 'YYYY-MM' */
  mes: string;
  ingresos: number;
  gastos: number;
}

export interface EstadoCita {
  estado: string;
  total: number;
}

export interface AgendaCita {
  id: number;
  /** 'HH:mm' */
  hora: string;
  duracionMin: number | null;
  paciente: string;
  procedimiento: string;
  odontologo: string;
  estado: string;
}

export interface CargaOdontologo {
  id: number;
  odontologo: string;
  total: number;
}

export interface PacientesNuevosRecurrentes {
  /** 'YYYY-MM' */
  mes: string;
  nuevos: number;
  recurrentes: number;
}

export interface DashboardResumen {
  kpis: DashboardKpis;
  citasPorMes: CitaMes[];
  procedimientosFrecuentes: ProcedimientoFrecuente[];
  ingresosVsGastos: IngresoGastoMes[];
  estadosCitas: EstadoCita[];
  agendaHoy: AgendaCita[];
  cargaOdontologos: CargaOdontologo[];
  pacientesNuevosRecurrentes: PacientesNuevosRecurrentes[];
}

export interface DashboardParams {
  /** Cantidad de meses hacia atrás (1–36, por defecto 12). */
  meses?: number;
  /** Top de procedimientos (1–20, por defecto 6). */
  procedimientos?: number;
  /** Top de odontólogos (1–30, por defecto 8). */
  odontologos?: number;
}
