import { apiRequest, apiRequestBlob, buildQueryString } from "./http";
import type {
  PacienteDTO,
  PacienteInput,
  PageResponse,
  ListarPacientesParams,
} from "@/types/paciente";

const BASE = "/api/pacientes";

/** GET /api/pacientes — barra de búsqueda + filtro de estado + tabla paginada */
export function listarPacientes(params: ListarPacientesParams = {}): Promise<PageResponse<PacienteDTO>> {
  const qs = buildQueryString({
    search: params.search,
    estado: params.estado,
    page: params.page ?? 0,
    size: params.size ?? 10,
  });
  return apiRequest<PageResponse<PacienteDTO>>(`${BASE}${qs}`);
}

/** GET /api/pacientes/{id} — botón "Ver" (incluye contactos y antecedentes) */
export function obtenerPaciente(id: number): Promise<PacienteDTO> {
  return apiRequest<PacienteDTO>(`${BASE}/${id}`);
}

/** POST /api/pacientes — botón "Nuevo paciente" */
export function crearPaciente(data: PacienteInput): Promise<PacienteDTO> {
  return apiRequest<PacienteDTO>(BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** PUT /api/pacientes/{id} — botón "Editar" (datos personales) */
export function actualizarPaciente(id: number, data: PacienteInput): Promise<PacienteDTO> {
  return apiRequest<PacienteDTO>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/** DELETE /api/pacientes/{id} — botón "Eliminar" (soft delete / archivar) */
export function archivarPaciente(id: number): Promise<void> {
  return apiRequest<void>(`${BASE}/${id}`, { method: "DELETE" });
}

/** GET /api/pacientes/export/excel — botón global "Exportar Excel" */
export function exportarPacientesExcel(params: ListarPacientesParams = {}): Promise<Blob> {
  const qs = buildQueryString({ search: params.search, estado: params.estado });
  return apiRequestBlob(`${BASE}/export/excel${qs}`);
}

/** GET /api/pacientes/export/pdf — botón global "Exportar PDF" */
export function exportarPacientesPdf(params: ListarPacientesParams = {}): Promise<Blob> {
  const qs = buildQueryString({ search: params.search, estado: params.estado });
  return apiRequestBlob(`${BASE}/export/pdf${qs}`);
}

/** GET /api/pacientes/{id}/ficha — botón de acción "Imprimir" (ficha individual) */
export function obtenerFichaPaciente(id: number): Promise<Blob> {
  return apiRequestBlob(`${BASE}/${id}/ficha`);
}
