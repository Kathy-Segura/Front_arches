import { apiRequest } from "@/lib/api/http";
import type {
  ActividadPerfil,
  ActualizarPerfilRequest,
  CambiarContrasenaRequest,
  FotoRequest,
  Perfil,
  PreferenciasRequest,
} from "@/types/perfil";

// SUPUESTO: apiRequest<T>(path, { method, body }) con body como objeto (se serializa a JSON).
// Si tu firma es distinta, ajusta solo este archivo. Ajusta también el import si http vive en otra ruta.
export const perfilApi = {
  obtener: () => apiRequest<Perfil>("/api/perfil"),

  actualizar: (data: ActualizarPerfilRequest) =>
    apiRequest<Perfil>("/api/perfil", { method: "PUT", body: data }),

  actualizarPreferencias: (data: PreferenciasRequest) =>
    apiRequest<Perfil>("/api/perfil/preferencias", { method: "PUT", body: data }),

  actualizarFoto: (data: FotoRequest) =>
    apiRequest<Perfil>("/api/perfil/foto", { method: "PUT", body: data }),

  cambiarContrasena: (data: CambiarContrasenaRequest) =>
    apiRequest<void>("/api/perfil/contrasena", { method: "PUT", body: data }),

  actividad: (limite = 10) =>
    apiRequest<ActividadPerfil[]>(`/api/perfil/actividad?limite=${limite}`),
};
