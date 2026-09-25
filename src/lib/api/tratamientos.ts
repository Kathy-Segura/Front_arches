// lib/api/tratamientos.ts

import { apiRequest } from "./http";
import type { TratamientoDTO, TratamientoRequestDTO, SesionRequestDTO, PaginaDTO } from "@/types/tratamiento";

const BASE = "/api/tratamientos";

export interface ListarTratamientosParams {
  idPaciente?: number | undefined;
  idPersonal?: number | undefined;
  estadoAvance?: string | undefined;
  estadoPago?: string | undefined;
  page?: number | undefined;
  size?: number | undefined;
}

export function listarTratamientos(params: ListarTratamientosParams = {}): Promise<PaginaDTO<TratamientoDTO>> {
  const search = new URLSearchParams();
  if (params.idPaciente != null) search.set("idPaciente", String(params.idPaciente));
  if (params.idPersonal != null) search.set("idPersonal", String(params.idPersonal));
  if (params.estadoAvance) search.set("estadoAvance", params.estadoAvance);
  if (params.estadoPago) search.set("estadoPago", params.estadoPago);
  search.set("page", String(params.page ?? 0));
  search.set("size", String(params.size ?? 10));
  return apiRequest<PaginaDTO<TratamientoDTO>>(`${BASE}?${search.toString()}`);
}

/** Incluye el historial de sesiones. */
export function obtenerTratamiento(id: number): Promise<TratamientoDTO> {
  return apiRequest<TratamientoDTO>(`${BASE}/${id}`);
}

/** Nace con estadoAvance='propuesto' y estadoPago='pendiente'. */
export function crearTratamiento(data: TratamientoRequestDTO): Promise<TratamientoDTO> {
  return apiRequest<TratamientoDTO>(BASE, { method: "POST", body: JSON.stringify(data) });
}

export function actualizarTratamiento(id: number, data: TratamientoRequestDTO): Promise<TratamientoDTO> {
  return apiRequest<TratamientoDTO>(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

/** Devuelve el tratamiento con el avance ya recalculado por el trigger de la BD. */
export function registrarSesion(idTratamiento: number, data: SesionRequestDTO): Promise<TratamientoDTO> {
  return apiRequest<TratamientoDTO>(`${BASE}/${idTratamiento}/sesiones`, { method: "POST", body: JSON.stringify(data) });
}

// Las listas de apoyo para el selector de paciente y procedimiento ahora se
// obtienen de sus módulos reales: @/lib/api/pacientes (listarPacientes,
// paginado) y @/lib/api/procedimientos (listarProcedimientos, array plano).


