import { apiRequest } from "./http";
import type { PersonalDTO } from "@/types/personal";

const BASE = "/api/personal";

/** GET /api/personal/odontologos — selector de odontólogo en calendario, listado y formulario de citas */
export function listarOdontologos(): Promise<PersonalDTO[]> {
  return apiRequest<PersonalDTO[]>(`${BASE}/odontologos`);
}
