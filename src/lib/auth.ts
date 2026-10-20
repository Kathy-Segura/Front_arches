import type { PermisoModuloDTO } from "@/types/rol";
import type { LoginResponse, SesionDTO, UsuarioSesion } from "@/types/auth";

/**
 * Sesión en el navegador.
 * - "Recordarme" marcado  -> localStorage (sobrevive al cerrar el navegador) y se recuerda el último usuario del combo.
 * - Sin marcar            -> sessionStorage (se pierde al cerrar la pestaña).
 * Nunca se guarda la contraseña. Los permisos guardados solo sirven para mostrar u ocultar opciones:
 * la protección real está en el back, que los vuelve a comprobar en cada petición.
 */
const K_TOKEN = "arches.token";
const K_EXPIRA = "arches.expira";
const K_USUARIO = "arches.usuario";
const K_PERMISOS = "arches.permisos";
const K_DEBE_CAMBIAR = "arches.debeCambiar";
const K_ULTIMO = "arches.ultimoUsuario";

function almacenes(): Storage[] {
  try {
    return [sessionStorage, localStorage];
  } catch {
    return [];
  }
}

function limpiarSesion(): void {
  for (const s of almacenes()) {
    for (const k of [K_TOKEN, K_EXPIRA, K_USUARIO, K_PERMISOS, K_DEBE_CAMBIAR]) s.removeItem(k);
  }
}

export function guardarSesion(r: LoginResponse, recordar: boolean): void {
  limpiarSesion();
  try {
    const s = recordar ? localStorage : sessionStorage;
    s.setItem(K_TOKEN, r.token);
    s.setItem(K_EXPIRA, r.expiraEn);
    s.setItem(K_USUARIO, JSON.stringify(r.usuario));
    s.setItem(K_PERMISOS, JSON.stringify(r.permisos));
    s.setItem(K_DEBE_CAMBIAR, r.debeCambiarContrasena ? "1" : "0");
    if (recordar) localStorage.setItem(K_ULTIMO, String(r.usuario.idUsuario));
    else localStorage.removeItem(K_ULTIMO);
  } catch {
    /* almacenamiento bloqueado: la sesión solo vivirá en memoria de la pestaña actual */
  }
}

function leer(clave: string): string | null {
  for (const s of almacenes()) {
    const v = s.getItem(clave);
    if (v) return v;
  }
  return null;
}

/** El almacén donde está guardado el token (para actualizar la sesión en el mismo lugar). */
function almacenDeSesion(): Storage | null {
  return almacenes().find((s) => s.getItem(K_TOKEN)) ?? null;
}

/** Token vigente, o null (si venció, limpia la sesión). Úsalo en el header Authorization de tu clase http. */
export function getToken(): string | null {
  const token = leer(K_TOKEN);
  const expira = leer(K_EXPIRA);
  if (!token || !expira) return null;
  if (Date.parse(expira) <= Date.now()) {
    limpiarSesion();
    return null;
  }
  return token;
}

export function estaAutenticado(): boolean {
  return getToken() !== null;
}

export function usuarioActual(): UsuarioSesion | null {
  const raw = leer(K_USUARIO);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UsuarioSesion;
  } catch {
    return null;
  }
}

export function permisosActuales(): PermisoModuloDTO[] {
  const raw = leer(K_PERMISOS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PermisoModuloDTO[];
  } catch {
    return [];
  }
}

export function debeCambiarContrasena(): boolean {
  return leer(K_DEBE_CAMBIAR) === "1";
}

/** Refresca permisos y bandera con lo que responde GET /api/auth/me (cambios hechos por un administrador). */
export function actualizarSesion(s: SesionDTO): void {
  const almacen = almacenDeSesion();
  if (!almacen) return;
  try {
    almacen.setItem(K_USUARIO, JSON.stringify(s.usuario));
    almacen.setItem(K_PERMISOS, JSON.stringify(s.permisos));
    almacen.setItem(K_DEBE_CAMBIAR, s.debeCambiarContrasena ? "1" : "0");
  } catch {
    /* sin espacio o bloqueado: se conserva lo anterior */
  }
}

export function marcarContrasenaCambiada(): void {
  try {
    almacenDeSesion()?.setItem(K_DEBE_CAMBIAR, "0");
  } catch {
    /* ignorar */
  }
}

export function cerrarSesion(): void {
  limpiarSesion();
}

export function ultimoUsuarioId(): number | null {
  try {
    const v = localStorage.getItem(K_ULTIMO);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

/** Misma política que el back (PasswordPolicy): 8+ caracteres con letras y números, máx. 72 bytes. */
export function validarContrasenaNueva(c: string): string | null {
  if (c.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  if (new TextEncoder().encode(c).length > 72) return "La contraseña es demasiado larga";
  if (!/\p{L}/u.test(c) || !/\p{N}/u.test(c)) return "La contraseña debe combinar letras y números";
  return null;
}
