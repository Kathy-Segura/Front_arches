// Cliente HTTP mínimo para consumir la API de Spring Boot.
// No había uno centralizado en el proyecto, así que este es el punto único
// de configuración (base URL, headers, manejo de errores).
//
// Ajusta VITE_API_BASE_URL en tu .env si el backend no corre en localhost:8080.
//   VITE_API_BASE_URL=http://localhost:8081 
const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081";

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

/** Para endpoints que devuelven JSON (o 204 sin body). */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${VITE_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/** Para endpoints que devuelven un archivo binario (Excel, PDF). */
export async function apiRequestBlob(path: string, options: RequestInit = {}): Promise<Blob> {
  const response = await fetch(`${VITE_API_BASE_URL}${path}`, options);
  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response));
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
