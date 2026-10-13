// src/lib/auth/session.ts
// Sesión del usuario en el navegador (token + datos + permisos), persistida en localStorage.

import { useSyncExternalStore } from "react";
import type { LoginResponseDTO, UsuarioSesionDTO } from "@/types/auth";
import type { AccionPermiso } from "@/types/rol";

const CLAVE = "arches.sesion";

interface SesionGuardada {
  token: string;
  /** Epoch en milisegundos en que vence el token. */
  expiraEn: number;
  usuario: UsuarioSesionDTO;
}

const oyentes = new Set<() => void>();
/** undefined = todavía no se ha leído del almacenamiento. */
let cache: SesionGuardada | null | undefined;

function leerAlmacenamiento(): SesionGuardada | null {
  if (typeof window === "undefined") return null; // render en servidor
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const sesion = JSON.parse(crudo) as Partial<SesionGuardada>;
    if (typeof sesion.token !== "string" || typeof sesion.expiraEn !== "number" || !sesion.usuario) {
      window.localStorage.removeItem(CLAVE);
      return null;
    }
    if (sesion.expiraEn <= Date.now()) {
      window.localStorage.removeItem(CLAVE);
      return null;
    }
    return sesion as SesionGuardada;
  } catch {
    return null;
  }
}

function sesionActual(): SesionGuardada | null {
  if (cache === undefined) cache = leerAlmacenamiento();
  return cache;
}

function persistir(sesion: SesionGuardada | null): void {
  cache = sesion;
  try {
    if (sesion) window.localStorage.setItem(CLAVE, JSON.stringify(sesion));
    else window.localStorage.removeItem(CLAVE);
  } catch {
    // almacenamiento no disponible (modo privado, cuota): la sesión vive solo en memoria
  }
  oyentes.forEach((avisar) => avisar());
}

/** Token vigente o null. Si ya venció, limpia la sesión. */
export function getToken(): string | null {
  const sesion = sesionActual();
  if (!sesion) return null;
  if (sesion.expiraEn <= Date.now()) {
    persistir(null);
    return null;
  }
  return sesion.token;
}

export function guardarSesion(respuesta: LoginResponseDTO): void {
  persistir({
    token: respuesta.token,
    expiraEn: Date.now() + respuesta.expiraEnSegundos * 1000,
    usuario: respuesta.usuario,
  });
}

/** Refresca los datos/permisos del usuario (p. ej. con GET /api/auth/me) sin cambiar el token. */
export function actualizarUsuario(usuario: UsuarioSesionDTO): void {
  const sesion = sesionActual();
  if (sesion) persistir({ ...sesion, usuario });
}

export function cerrarSesion(): void {
  persistir(null);
}

function suscribir(avisar: () => void): () => void {
  oyentes.add(avisar);
  // Si se inicia o cierra sesión en otra pestaña, esta se entera.
  const alCambiarAlmacenamiento = (e: StorageEvent) => {
    if (e.key === CLAVE || e.key === null) {
      cache = undefined;
      avisar();
    }
  };
  window.addEventListener("storage", alCambiarAlmacenamiento);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("storage", alCambiarAlmacenamiento);
  };
}

/** Usuario en sesión (o null). Se actualiza solo al iniciar/cerrar sesión. */
export function useSesion(): UsuarioSesionDTO | null {
  return useSyncExternalStore(
    suscribir,
    () => sesionActual()?.usuario ?? null,
    () => null,
  );
}

/** ¿Puede el usuario realizar `accion` en el módulo `modulo`? (nombre tal como está en modulos_sistema) */
export function puede(usuario: UsuarioSesionDTO | null, modulo: string, accion: AccionPermiso): boolean {
  return usuario?.permisos.find((p) => p.nombreModulo === modulo)?.[accion] ?? false;
}
