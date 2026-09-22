import { apiRequest } from "./http";
import type { PaginaDTO, ProcedimientoDTO, ProcedimientoDetalleDTO, ProcedimientoRequestDTO } from "@/types/procedimiento";

const BASE = "/api/procedimientos";

/** GET /api/procedimientos — selector de procedimiento en calendario, listado y formulario de citas */
export function listarProcedimientos(): Promise<ProcedimientoDTO[]> {
  return apiRequest<ProcedimientoDTO[]>(BASE);
}
// --- CRUD completo del módulo de Procedimientos ---
// Nota: ProcedimientoDetalleDTO, ProcedimientoRequestDTO y PaginaDTO<T> están
// en @/types/procedimiento (mismo patrón que @/types/personal).

export interface BuscarProcedimientosParams {
  categoria?: string;
  q?: string;
  page?: number;
  size?: number;
}

/** GET /api/procedimientos/buscar — listado paginado con filtro por categoría y búsqueda por nombre */
export function buscarProcedimientos(params: BuscarProcedimientosParams = {}): Promise<PaginaDTO<ProcedimientoDetalleDTO>> {
  const search = new URLSearchParams();
  if (params.categoria) search.set("categoria", params.categoria);
  if (params.q) search.set("q", params.q);
  search.set("page", String(params.page ?? 0));
  search.set("size", String(params.size ?? 10));
  return apiRequest<PaginaDTO<ProcedimientoDetalleDTO>>(`${BASE}/buscar?${search.toString()}`);
}

/** GET /api/procedimientos/{id} */
export function obtenerProcedimiento(id: number): Promise<ProcedimientoDetalleDTO> {
  return apiRequest<ProcedimientoDetalleDTO>(`${BASE}/${id}`);
}

/** POST /api/procedimientos — el backend fuerza estado = 'activo' al crear */
export function crearProcedimiento(data: ProcedimientoRequestDTO): Promise<ProcedimientoDetalleDTO> {
  return apiRequest<ProcedimientoDetalleDTO>(BASE, { method: "POST", body: JSON.stringify(data) });
}

/** PUT /api/procedimientos/{id} */
export function actualizarProcedimiento(id: number, data: ProcedimientoRequestDTO): Promise<ProcedimientoDetalleDTO> {
  return apiRequest<ProcedimientoDetalleDTO>(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

/** DELETE /api/procedimientos/{id} — baja lógica (estado = 'inactivo'), no borra el registro */
export function desactivarProcedimiento(id: number): Promise<void> {
  return apiRequest<void>(`${BASE}/${id}`, { method: "DELETE" });
}
