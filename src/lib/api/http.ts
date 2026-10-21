// Cliente HTTP mínimo para consumir la API de Spring Boot.
// Punto único de configuración: base URL, token de sesión, headers y manejo de errores.
//
// La URL se toma de VITE_API_BASE_URL (.env.local o variables de Vercel). Si no está definida:
//   - en desarrollo (npm run dev)  -> http://localhost:8081
//   - en producción (build)        -> https://back-arches.onrender.com
import { cerrarSesion, getToken } from "@/lib/auth";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "http://localhost:8081" : "https://back-arches.onrender.com")
).replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

/**
 * Igual que RequestInit, pero `body` acepta objetos (se serializan a JSON).
 * Los llamadores que ya pasan string, FormData, Blob, etc. siguen funcionando igual.
 */
export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

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

/**
 * Deja pasar los tipos nativos de fetch tal cual; cualquier otro objeto se manda como JSON.
 * Devuelve null (no undefined) cuando no hay body, por exactOptionalPropertyTypes.
 */
function serializarBody(body: unknown): BodyInit | null {
  if (body === undefined || body === null) return null;
  if (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body) ||
    body instanceof ReadableStream
  ) {
    return body as BodyInit;
  }
  return JSON.stringify(body);
}

/**
 * Arma los headers: Content-Type (opcional) -> Authorization -> headers del llamador.
 * Los del llamador sobrescriben a los demás (Headers es case-insensitive).
 */
function construirHeaders(extra: HeadersInit | undefined, conJson: boolean): Headers {
  const h = new Headers();
  if (conJson) h.set("Content-Type", "application/json");
  Object.entries(authHeader()).forEach(([k, v]) => h.set(k, v));
  if (extra) {
    new Headers(extra).forEach((v, k) => h.set(k, v));
  }
  return h;
}

/** 401 con sesión guardada = token vencido o inválido: se limpia y se vuelve al login. */
async function crearError(response: Response): Promise<ApiError> {
  if (response.status === 401 && getToken()) {
    cerrarSesion();
    if (window.location.pathname !== "/login") window.location.assign("/login");
  }
  return new ApiError(response.status, await parseErrorMessage(response));
}

/** Para endpoints que devuelven JSON (o 204 sin body). */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  // Con FormData el navegador pone el Content-Type (con boundary) por su cuenta.
  const conJson = !(body instanceof FormData);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    body: serializarBody(body),
    headers: construirHeaders(headers, conJson),
  });

  if (!response.ok) {
    throw await crearError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/** Para endpoints que devuelven un archivo binario (Excel, PDF). */
export async function apiRequestBlob(path: string, options: ApiRequestOptions = {}): Promise<Blob> {
  const { body, headers, ...rest } = options;
  const serializado = serializarBody(body);
  // Solo se agrega Content-Type JSON cuando serializarBody convirtió un objeto a JSON.
  const conJson = serializado !== null && serializado !== body;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    body: serializado,
    headers: construirHeaders(headers, conJson),
  });

  if (!response.ok) {
    throw await crearError(response);
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