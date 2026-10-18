// src/types/usuario.ts

export interface UsuarioDTO {
  idUsuario: number;
  nombreCompleto: string;
  correo: string;
  telefono: string | null;
  idRol: number;
  nombreRol: string | null;
  /** "activo" | "inactivo" | "pendiente" (pendiente = registro público sin aprobar) */
  estado: string;
  ultimoAcceso: string | null;
  fechaCreacion: string;
}

export interface UsuarioCrearInput {
  nombreCompleto: string;
  correo: string;
  telefono?: string | null;
  idRol: number;
  /** Viaja una sola vez; el servidor solo guarda su hash BCrypt. */
  contrasenaTemporal: string;
  activo?: boolean;
}

export interface UsuarioActualizarInput {
  nombreCompleto: string;
  correo: string;
  telefono?: string | null;
  idRol: number;
  activo: boolean;
}

export interface RestablecerContrasenaInput {
  contrasenaTemporal: string;
}
