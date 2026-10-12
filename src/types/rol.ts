// src/types/rol.ts

export interface RolDTO {
  idRol: number;
  nombreRol: string;
  descripcion: string | null;
  activo: boolean;
  fechaCreacion: string;
}

export interface RolInput {
  nombreRol: string;
  descripcion?: string | null;
}

export interface ModuloDTO {
  idModulo: number;
  nombreModulo: string;
}

export type AccionPermiso = "puedeVer" | "puedeCrear" | "puedeEditar" | "puedeEliminar";

/** Permisos de un rol sobre un módulo (todo en false si aún no se han asignado). */
export interface PermisoModuloDTO {
  idModulo: number;
  nombreModulo: string;
  puedeVer: boolean;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
}

/** Lo que espera el back al guardar la matriz de un rol. */
export type PermisoInput = Pick<
  PermisoModuloDTO,
  "idModulo" | "puedeVer" | "puedeCrear" | "puedeEditar" | "puedeEliminar"
>;
