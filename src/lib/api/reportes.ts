import { apiRequest, buildQueryString } from "@/lib/api/http"; // ajustar al nombre real del cliente HTTP
import type {
  CargaOdontologoDTO,
  CitaReporteDTO,
  FiltrosReporte,
  PacientesNuevosVsRecurrentesDTO,
  ReporteActividadDTO,
  ReporteProcedimientoDTO,
} from "@/types/reportes";

const BASE = "/api/reportes";

// Con exactOptionalPropertyTypes no se puede pasar { signal: undefined }.
function opts(signal?: AbortSignal): RequestInit {
  return signal ? { signal } : {};
}

function query(f: FiltrosReporte) {
  return buildQueryString({ desde: f.desde, hasta: f.hasta, estado: f.estado });
}

export const reportesApi = {
  citas: (f: FiltrosReporte, signal?: AbortSignal) =>
    apiRequest<CitaReporteDTO[]>(`${BASE}/citas${query(f)}`, opts(signal)),

  procedimientos: (f: FiltrosReporte, signal?: AbortSignal) =>
    apiRequest<ReporteProcedimientoDTO[]>(`${BASE}/procedimientos${query(f)}`, opts(signal)),

  // La bitácora no filtra por estado.
  actividad: (f: FiltrosReporte, signal?: AbortSignal) =>
    apiRequest<ReporteActividadDTO[]>(
      `${BASE}/actividad${buildQueryString({ desde: f.desde, hasta: f.hasta })}`,
      opts(signal),
    ),

  pacientesNuevosVsRecurrentes: (signal?: AbortSignal) =>
    apiRequest<PacientesNuevosVsRecurrentesDTO[]>(`${BASE}/graficos/pacientes-nuevos-vs-recurrentes`, opts(signal)),

  cargaOdontologos: (signal?: AbortSignal) =>
    apiRequest<CargaOdontologoDTO[]>(`${BASE}/graficos/carga-odontologos`, opts(signal)),
};
