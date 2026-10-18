/** Contratos de AuthController (/api/auth). El combo de roles reutiliza RolDTO de "@/types/rol". */

export interface UsuarioLoginItem {
  idUsuario: number;
  nombreCompleto: string;
}

export interface LoginInput {
  idUsuario: number;
  contrasena: string;
  recordarme: boolean;
}

export interface UsuarioSesion {
  idUsuario: number;
  nombreCompleto: string;
  correo: string;
  idRol: number;
  nombreRol: string;
}

export interface LoginResponse {
  token: string;
  expiraEn: string; // ISO-8601 (Instant)
  usuario: UsuarioSesion;
}

export interface RegistroInput {
  nombreCompleto: string;
  correo: string;
  telefono: string | null;
  idRol: number;
  contrasena: string;
}

export interface MensajeDTO {
  message: string;
}
