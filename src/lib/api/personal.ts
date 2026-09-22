import { apiRequest } from "./http";
import type { PaginaDTO } from "@/types/personal";
import type { PersonalDTO } from "@/types/personal";
import type { PersonalDetalleDTO } from "@/types/personal";
import type { PersonalRequestDTO } from "@/types/personal";

const BASE = "/api/personal";

/** GET /api/personal/odontologos — selector de odontólogo en calendario, listado y formulario de citas */
export function listarOdontologos(): Promise<PersonalDTO[]> {
  return apiRequest<PersonalDTO[]>(`${BASE}/odontologos`);
}

// --- CRUD completo del módulo de Personal ---
// Nota: PersonalDetalleDTO, PersonalRequestDTO y PaginaDTO<T> son nuevos,
// agrégarlos a @/types/personal (ver el bloque de tipos que te paso aparte).

export interface ListarPersonalParams {
  cargo?: string;
  q?: string;
  page?: number;
  size?: number;
}

/** GET /api/personal — listado paginado con filtro por cargo y búsqueda por nombre */
export function listarPersonal(params: ListarPersonalParams = {}): Promise<PaginaDTO<PersonalDetalleDTO>> {
  const search = new URLSearchParams();
  if (params.cargo) search.set("cargo", params.cargo);
  if (params.q) search.set("q", params.q);
  search.set("page", String(params.page ?? 0));
  search.set("size", String(params.size ?? 10));
  return apiRequest<PaginaDTO<PersonalDetalleDTO>>(`${BASE}?${search.toString()}`);
}

/** GET /api/personal/{id} */
export function obtenerPersonal(id: number): Promise<PersonalDetalleDTO> {
  return apiRequest<PersonalDetalleDTO>(`${BASE}/${id}`);
}

/** POST /api/personal — el backend fuerza estado = 'activo' al crear */
export function crearPersonal(data: PersonalRequestDTO): Promise<PersonalDetalleDTO> {
  return apiRequest<PersonalDetalleDTO>(BASE, { method: "POST", body: JSON.stringify(data) });
}

/** PUT /api/personal/{id} */
export function actualizarPersonal(id: number, data: PersonalRequestDTO): Promise<PersonalDetalleDTO> {
  return apiRequest<PersonalDetalleDTO>(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

/** DELETE /api/personal/{id} — baja lógica (estado = 'inactivo'), no borra el registro */
export function desactivarPersonal(id: number): Promise<void> {
  return apiRequest<void>(`${BASE}/${id}`, { method: "DELETE" });
}
