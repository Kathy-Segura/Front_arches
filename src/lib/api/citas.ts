import { apiRequest, buildQueryString } from "./http";
import type {
  CitaDTO,
  CitaInput,
  CitaCancelarInput,
  PageResponse,
  ListarCitasParams,
  MotivoCancelacionDTO,
} from "@/types/cita";

const BASE = "/api/citas";

/** GET /api/citas — pestaña "Listado": búsqueda + filtros + tabla paginada */
export function listarCitas(params: ListarCitasParams = {}): Promise<PageResponse<CitaDTO>> {
  const qs = buildQueryString({
    search: params.search,
    idPersonal: params.idPersonal,
    estado: params.estado,
    desde: params.desde,
    hasta: params.hasta,
    page: params.page ?? 0,
    size: params.size ?? 10,
  });
  return apiRequest<PageResponse<CitaDTO>>(`${BASE}${qs}`);
}

/** GET /api/citas/calendario — pestaña "Calendario": todas las citas del rango visible */
export function listarCitasCalendario(desde: string, hasta: string, idPersonal?: number): Promise<CitaDTO[]> {
  const qs = buildQueryString({ desde, hasta, idPersonal });
  return apiRequest<CitaDTO[]>(`${BASE}/calendario${qs}`);
}

/** GET /api/citas/motivos-cancelacion — selector del diálogo "Cancelar cita" */
export function listarMotivosCancelacion(): Promise<MotivoCancelacionDTO[]> {
  return apiRequest<MotivoCancelacionDTO[]>(`${BASE}/motivos-cancelacion`);
}

/** GET /api/citas/{id} — botón de acción "Ver" */
export function obtenerCita(id: number): Promise<CitaDTO> {
  return apiRequest<CitaDTO>(`${BASE}/${id}`);
}

/** POST /api/citas — botón global "Nueva cita" */
export function crearCita(data: CitaInput): Promise<CitaDTO> {
  return apiRequest<CitaDTO>(BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** PUT /api/citas/{id} — botón de acción "Editar" */
export function actualizarCita(id: number, data: CitaInput): Promise<CitaDTO> {
  return apiRequest<CitaDTO>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/** PATCH /api/citas/{id}/atender — botón de acción "Atendida" */
export function marcarCitaAtendida(id: number): Promise<CitaDTO> {
  return apiRequest<CitaDTO>(`${BASE}/${id}/atender`, { method: "PATCH" });
}

/** PATCH /api/citas/{id}/confirmar — usado al hacer clic en un bloque "programada" del calendario */
export function confirmarCita(id: number): Promise<CitaDTO> {
  return apiRequest<CitaDTO>(`${BASE}/${id}/confirmar`, { method: "PATCH" });
}

/** PATCH /api/citas/{id}/cancelar — botón de acción "Cancelada" */
export function cancelarCita(id: number, data: CitaCancelarInput = {}): Promise<CitaDTO> {
  return apiRequest<CitaDTO>(`${BASE}/${id}/cancelar`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** DELETE /api/citas/{id} — botón de acción "Eliminar" (borrado físico) */
export function eliminarCita(id: number): Promise<void> {
  return apiRequest<void>(`${BASE}/${id}`, { method: "DELETE" });
}
