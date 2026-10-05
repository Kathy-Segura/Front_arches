// src/lib/api/dashboard.ts

import { apiRequest, buildQueryString } from "./http";
import type {
  AgendaCita,
  CargaOdontologo,
  CitaMes,
  DashboardKpis,
  DashboardParams,
  DashboardResumen,
  EstadoCita,
  IngresoGastoMes,
  PacientesNuevosRecurrentes,
  ProcedimientoFrecuente,
} from "@/types/dashboard";

const BASE = "/api/dashboard";

function toQuery(params?: DashboardParams): string {
  return buildQueryString({
    meses: params?.meses,
    procedimientos: params?.procedimientos,
    odontologos: params?.odontologos,
  });
}

function get<T>(path: string, params?: DashboardParams, signal?: AbortSignal): Promise<T> {
  return apiRequest<T>(`${BASE}${path}${toQuery(params)}`, signal ? { signal } : {});
}

export const dashboardApi = {
  /** Todo el dashboard en una sola petición. */
  getResumen: (params?: DashboardParams, signal?: AbortSignal) => get<DashboardResumen>("", params, signal),

  getKpis: (signal?: AbortSignal) => get<DashboardKpis>("/kpis", undefined, signal),
  getCitasPorMes: (params?: DashboardParams, signal?: AbortSignal) =>
    get<CitaMes[]>("/citas-por-mes", params, signal),

  getProcedimientosFrecuentes: (params?: DashboardParams, signal?: AbortSignal) =>
    get<ProcedimientoFrecuente[]>("/procedimientos-frecuentes", params, signal),
  getIngresosVsGastos: (params?: DashboardParams, signal?: AbortSignal) =>
    get<IngresoGastoMes[]>("/ingresos-vs-gastos", params, signal),

  getEstadosCitas: (signal?: AbortSignal) => get<EstadoCita[]>("/estados-citas", undefined, signal),
  getAgendaHoy: (signal?: AbortSignal) => get<AgendaCita[]>("/agenda-hoy", undefined, signal),
  getCargaOdontologos: (params?: DashboardParams, signal?: AbortSignal) =>
    get<CargaOdontologo[]>("/carga-odontologos", params, signal),

  getPacientesNuevosRecurrentes: (params?: DashboardParams, signal?: AbortSignal) =>
    get<PacientesNuevosRecurrentes[]>("/pacientes-nuevos-recurrentes", params, signal),
};
