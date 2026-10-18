import { apiRequest } from "@/lib/api/http"; // ajusta la ruta si tu archivo http tiene otro nombre
import type { MensajeDTO } from "@/types/auth";
import type {
  RestablecerContrasenaInput,
  UsuarioActualizarInput,
  UsuarioCrearInput,
  UsuarioDTO,
} from "@/types/usuario";

const BASE = "/api/usuarios";

// exactOptionalPropertyTypes: RequestInit.signal no admite `undefined`.
const conSignal = (signal?: AbortSignal): RequestInit => (signal ? { signal } : {});
const conCuerpo = (method: "POST" | "PUT", body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

/** Un método por endpoint de UsuarioController. Solo el rol administrador puede usarlos. */
export const usuariosApi = {
  listar: (signal?: AbortSignal) => apiRequest<UsuarioDTO[]>(BASE, conSignal(signal)),
  obtener: (id: number) => apiRequest<UsuarioDTO>(`${BASE}/${id}`),
  crear: (input: UsuarioCrearInput) => apiRequest<UsuarioDTO>(BASE, conCuerpo("POST", input)),
  actualizar: (id: number, input: UsuarioActualizarInput) =>
    apiRequest<UsuarioDTO>(`${BASE}/${id}`, conCuerpo("PUT", input)),
  /** Aprueba una cuenta creada desde el registro público (estado "pendiente" -> "activo"). */
  aprobar: (id: number) => apiRequest<UsuarioDTO>(`${BASE}/${id}/aprobar`, { method: "PATCH" }),
  restablecerContrasena: (id: number, input: RestablecerContrasenaInput) =>
    apiRequest<MensajeDTO>(`${BASE}/${id}/contrasena`, conCuerpo("PUT", input)),
};
