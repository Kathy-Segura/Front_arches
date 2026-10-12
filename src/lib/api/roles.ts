// src/lib/api/roles.ts
import { apiRequest, buildQueryString } from "./http";
import type { ModuloDTO, PermisoInput, PermisoModuloDTO, RolDTO, RolInput } from "@/types/rol";

const BASE = "/api/roles";

function withSignal(init: RequestInit, signal?: AbortSignal): RequestInit {
  return signal ? { ...init, signal } : init;
}

export const rolesApi = {
  /** GET /api/roles — por defecto solo roles activos. */
  listar: (incluirInactivos = false, signal?: AbortSignal) =>
    apiRequest<RolDTO[]>(
      `${BASE}${buildQueryString({ incluirInactivos: incluirInactivos ? "true" : undefined })}`,
      withSignal({}, signal),
    ),

  obtener: (idRol: number, signal?: AbortSignal) =>
    apiRequest<RolDTO>(`${BASE}/${idRol}`, withSignal({}, signal)),

  crear: (data: RolInput) =>
    apiRequest<RolDTO>(BASE, { method: "POST", body: JSON.stringify(data) }),

  actualizar: (idRol: number, data: RolInput) =>
    apiRequest<RolDTO>(`${BASE}/${idRol}`, { method: "PUT", body: JSON.stringify(data) }),

  /** PATCH /api/roles/{id}/estado — activar o desactivar (no se elimina). */
  cambiarEstado: (idRol: number, activo: boolean) =>
    apiRequest<RolDTO>(`${BASE}/${idRol}/estado`, { method: "PATCH", body: JSON.stringify({ activo }) }),

  /** GET /api/roles/{id}/permisos — matriz completa: todos los módulos del sistema. */
  obtenerPermisos: (idRol: number, signal?: AbortSignal) =>
    apiRequest<PermisoModuloDTO[]>(`${BASE}/${idRol}/permisos`, withSignal({}, signal)),

  /** PUT /api/roles/{id}/permisos — guarda la matriz y devuelve la versión persistida. */
  guardarPermisos: (idRol: number, permisos: PermisoInput[]) =>
    apiRequest<PermisoModuloDTO[]>(`${BASE}/${idRol}/permisos`, {
      method: "PUT",
      body: JSON.stringify({
        permisos: permisos.map(({ idModulo, puedeVer, puedeCrear, puedeEditar, puedeEliminar }) => ({
          idModulo,
          puedeVer,
          puedeCrear,
          puedeEditar,
          puedeEliminar,
        })),
      }),
    }),

  /** GET /api/modulos — catálogo de módulos del sistema (solo lectura). */
  listarModulos: (signal?: AbortSignal) =>
    apiRequest<ModuloDTO[]>("/api/modulos", withSignal({}, signal)),
};
