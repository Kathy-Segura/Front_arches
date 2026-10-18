import type { LoginResponse, UsuarioSesion } from "@/types/auth";

/**
 * Sesión en el navegador.
 * - "Recordarme" marcado  -> localStorage (sobrevive al cerrar el navegador) y se recuerda el último usuario del combo.
 * - Sin marcar            -> sessionStorage (se pierde al cerrar la pestaña).
 * Nunca se guarda la contraseña.
 */
const K_TOKEN = "arches.token";
const K_EXPIRA = "arches.expira";
const K_USUARIO = "arches.usuario";
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
    s.removeItem(K_TOKEN);
    s.removeItem(K_EXPIRA);
    s.removeItem(K_USUARIO);
  }
}

export function guardarSesion(r: LoginResponse, recordar: boolean): void {
  limpiarSesion();
  try {
    const s = recordar ? localStorage : sessionStorage;
    s.setItem(K_TOKEN, r.token);
    s.setItem(K_EXPIRA, r.expiraEn);
    s.setItem(K_USUARIO, JSON.stringify(r.usuario));
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
