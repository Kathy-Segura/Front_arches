// Cliente HTTP mínimo para consumir la API de Spring Boot.
// Punto único de configuración: base URL, token de sesión, headers y manejo de errores.
//
// La URL se toma de VITE_API_BASE_URL (.env.local o variables de Vercel). Si no está definida:
//   - en desarrollo (npm run dev)  -> http://localhost:8081
//   - en producción (build)        -> https://back-arches.onrender.com
import { cerrarSesion, getToken } from "@/lib/auth";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "http://localhost:8081" : "https://back-arches.onrender.com" )
).replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data?.message ?? data?.error ?? response.statusText;
  } catch {
    return response.statusText || `Error HTTP ${response.status}`;
  }
}

function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** 401 con sesión guardada = token vencido o inválido: se limpia y se vuelve al login. */
async function fallar(response: Response, conToken: boolean): Promise<never> {
  if (response.status === 401 && conToken) {
    cerrarSesion();
    if (window.location.pathname !== "/login") window.location.assign("/login");
  }
  throw new ApiError(response.status, await parseErrorMessage(response));
}

/** Para endpoints que devuelven JSON (o 204 sin body). */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = authHeader();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...auth,
      ...options.headers,
    },
  });

  if (!response.ok) {
    return fallar(response, "Authorization" in auth);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/** Para endpoints que devuelven un archivo binario (Excel, PDF). */
export async function apiRequestBlob(path: string, options: RequestInit = {}): Promise<Blob> {
  const auth = authHeader();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...auth,
      ...options.headers,
    },
  });
  if (!response.ok) {
    return fallar(response, "Authorization" in auth);
  }
  return response.blob();
}

/** Dispara la descarga de un Blob en el navegador con el nombre de archivo dado. */
export function descargarBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Abre un Blob (ej. PDF) en una pestaña nueva en vez de descargarlo. */
export function abrirBlobEnPestana(blob: Blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  // No revocamos la URL de inmediato para que la pestaña nueva alcance a cargarla.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function buildQueryString(params: Record<string, string | number | undefined | null>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      usp.set(key, String(value));
    }
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Normaliza una respuesta de "listado" que puede venir como array plano
 * (`[...]`) o como página de Spring Data (`{ content: [...], ... }`).
 * Usar en cualquier endpoint que debería devolver una lista simple pero
 * cuyo controlador aún no está confirmado (ej. /api/pacientes, /api/procedimientos).
 */
export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as { content?: unknown }).content)) {
    return (data as { content: T[] }).content;
  }
  return [];
}
