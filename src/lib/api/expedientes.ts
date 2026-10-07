import { apiRequest } from "./http";
import type {
  DiagnosticoDTO,
  DiagnosticoInput,
  EvolucionDTO,
  EvolucionInput,
  ExpedienteResumenDTO,
  HallazgoHistorialDTO,
  HallazgoInput,
  HallazgoTipoDTO,
  HistoriaClinicaDTO,
  HistoriaClinicaInput,
  OdontogramaPiezaDTO,
  OdontologoDTO,
  PlanTratamientoDTO,
} from "@/types/expediente";

const BASE = "/api/expedientes";

/* ---------- Catálogos de apoyo ---------- */

/** GET /api/expedientes/odontologos — selector de autor */
export function listarOdontologos(): Promise<OdontologoDTO[]> {
  return apiRequest<OdontologoDTO[]>(`${BASE}/odontologos`);
}

/** GET /api/expedientes/hallazgos-tipos — catálogo del odontograma */
export function listarTiposHallazgo(): Promise<HallazgoTipoDTO[]> {
  return apiRequest<HallazgoTipoDTO[]>(`${BASE}/hallazgos-tipos`);
}

/* ---------- Resumen ---------- */

/** GET /api/expedientes/{idPaciente} */
export function obtenerResumenExpediente(idPaciente: number): Promise<ExpedienteResumenDTO> {
  return apiRequest<ExpedienteResumenDTO>(`${BASE}/${idPaciente}`);
}

/* ---------- Historia clínica ---------- */

export function obtenerHistoriaClinica(idPaciente: number): Promise<HistoriaClinicaDTO> {
  return apiRequest<HistoriaClinicaDTO>(`${BASE}/${idPaciente}/historia-clinica`);
}

export function guardarHistoriaClinica(idPaciente: number, data: HistoriaClinicaInput): Promise<HistoriaClinicaDTO> {
  return apiRequest<HistoriaClinicaDTO>(`${BASE}/${idPaciente}/historia-clinica`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/* ---------- Odontograma ---------- */

export function obtenerOdontograma(idPaciente: number): Promise<OdontogramaPiezaDTO[]> {
  return apiRequest<OdontogramaPiezaDTO[]>(`${BASE}/${idPaciente}/odontograma`);
}

export function obtenerHistorialPieza(idPaciente: number, numeroPieza: number): Promise<HallazgoHistorialDTO[]> {
  return apiRequest<HallazgoHistorialDTO[]>(`${BASE}/${idPaciente}/odontograma/${numeroPieza}/historial`);
}

export function registrarHallazgo(
  idPaciente: number,
  numeroPieza: number,
  data: HallazgoInput,
): Promise<OdontogramaPiezaDTO> {
  return apiRequest<OdontogramaPiezaDTO>(`${BASE}/${idPaciente}/odontograma/${numeroPieza}/hallazgos`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/* ---------- Diagnósticos ---------- */

export function listarDiagnosticos(idPaciente: number): Promise<DiagnosticoDTO[]> {
  return apiRequest<DiagnosticoDTO[]>(`${BASE}/${idPaciente}/diagnosticos`);
}

export function crearDiagnostico(idPaciente: number, data: DiagnosticoInput): Promise<DiagnosticoDTO> {
  return apiRequest<DiagnosticoDTO>(`${BASE}/${idPaciente}/diagnosticos`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarDiagnostico(
  idPaciente: number,
  idDiagnostico: number,
  data: DiagnosticoInput,
): Promise<DiagnosticoDTO> {
  return apiRequest<DiagnosticoDTO>(`${BASE}/${idPaciente}/diagnosticos/${idDiagnostico}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function eliminarDiagnostico(idPaciente: number, idDiagnostico: number): Promise<void> {
  return apiRequest<void>(`${BASE}/${idPaciente}/diagnosticos/${idDiagnostico}`, { method: "DELETE" });
}

/* ---------- Plan de tratamiento (solo lectura) ---------- */

export function listarPlanTratamiento(idPaciente: number): Promise<PlanTratamientoDTO[]> {
  return apiRequest<PlanTratamientoDTO[]>(`${BASE}/${idPaciente}/plan-tratamiento`);
}

/* ---------- Evolución y notas ---------- */

export function listarEvolucion(idPaciente: number): Promise<EvolucionDTO[]> {
  return apiRequest<EvolucionDTO[]>(`${BASE}/${idPaciente}/evolucion`);
}

export function crearEvolucion(idPaciente: number, data: EvolucionInput): Promise<EvolucionDTO> {
  return apiRequest<EvolucionDTO>(`${BASE}/${idPaciente}/evolucion`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarEvolucion(
  idPaciente: number,
  idEvolucion: number,
  data: EvolucionInput,
): Promise<EvolucionDTO> {
  return apiRequest<EvolucionDTO>(`${BASE}/${idPaciente}/evolucion/${idEvolucion}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function eliminarEvolucion(idPaciente: number, idEvolucion: number): Promise<void> {
  return apiRequest<void>(`${BASE}/${idPaciente}/evolucion/${idEvolucion}`, { method: "DELETE" });
}
