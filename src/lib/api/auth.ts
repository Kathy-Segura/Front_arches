// src/lib/api/auth.ts

import { apiRequest } from "./http";
import type { LoginInput, LoginResponseDTO, UsuarioSesionDTO } from "@/types/auth";

const BASE = "/api/auth";

export const authApi = {
  /** POST /api/auth/login — pública. */
  login: (data: LoginInput) =>
    apiRequest<LoginResponseDTO>(`${BASE}/login`, { method: "POST", body: JSON.stringify(data) }),

  /** GET /api/auth/me — usuario del token con sus permisos actuales. */
  me: (signal?: AbortSignal) => apiRequest<UsuarioSesionDTO>(`${BASE}/me`, signal ? { signal } : {}),
};
