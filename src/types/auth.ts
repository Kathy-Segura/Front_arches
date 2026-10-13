// src/types/auth.ts

import type { PermisoModuloDTO } from "@/types/rol";

export interface LoginInput {
  correo: string;
  contrasena: string;
}

/** Usuario autenticado con su matriz de permisos (todos los módulos del sistema). */
export interface UsuarioSesionDTO {
  idUsuario: number;
  nombreCompleto: string;
  correo: string;
  idRol: number;
  nombreRol: string;
  permisos: PermisoModuloDTO[];
}

export interface LoginResponseDTO {
  token: string;
  tipo: string;
  expiraEnSegundos: number;
  usuario: UsuarioSesionDTO;
}
