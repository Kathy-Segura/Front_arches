import { apiRequest } from "@/lib/api/http"; // ajusta la ruta si tu archivo http tiene otro nombre
import type { RolDTO } from "@/types/rol";
import type {
  LoginInput,
  LoginResponse,
  MensajeDTO,
  RegistroInput,
  UsuarioLoginItem,
  UsuarioSesion,
} from "@/types/auth";

// La URL base, el token (Authorization) y el manejo de errores viven en la clase http.
// exactOptionalPropertyTypes: RequestInit.signal no admite `undefined`, de ahí el spread condicional.
const conSignal = (signal?: AbortSignal): RequestInit => (signal ? { signal } : {});

const post = <T>(path: string, body: unknown) =>
  apiRequest<T>(`/api/auth${path}`, { method: "POST", body: JSON.stringify(body) });

export const authApi = {
  usuariosLogin: (signal?: AbortSignal) => apiRequest<UsuarioLoginItem[]>("/api/auth/usuarios", conSignal(signal)),
  roles: (signal?: AbortSignal) => apiRequest<RolDTO[]>("/api/auth/roles", conSignal(signal)),
  login: (input: LoginInput) => post<LoginResponse>("/login", input),
  registro: (input: RegistroInput) => post<MensajeDTO>("/registro", input),
  recuperar: (correo: string) => post<MensajeDTO>("/recuperar", { correo }),
  restablecer: (token: string, contrasenaNueva: string) =>
    post<MensajeDTO>("/restablecer", { token, contrasenaNueva }),
  me: () => apiRequest<UsuarioSesion>("/api/auth/me"),
};
