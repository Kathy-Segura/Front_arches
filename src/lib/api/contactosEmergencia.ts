import { apiRequest } from "./http";
import type { ContactoEmergenciaDTO, ContactoInput } from "@/types/paciente";

const base = (idPaciente: number) => `/api/pacientes/${idPaciente}/contactos`;

/** GET .../contactos — pestaña "Contactos" dentro de la vista Ver */
export function listarContactos(idPaciente: number): Promise<ContactoEmergenciaDTO[]> {
  return apiRequest<ContactoEmergenciaDTO[]>(base(idPaciente));
}

/** POST .../contactos — agregar contacto desde Editar */
export function crearContacto(idPaciente: number, data: ContactoInput): Promise<ContactoEmergenciaDTO> {
  return apiRequest<ContactoEmergenciaDTO>(base(idPaciente), {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** PUT .../contactos/{idContacto} — editar contacto existente */
export function actualizarContacto(
  idPaciente: number,
  idContacto: number,
  data: ContactoInput,
): Promise<ContactoEmergenciaDTO> {
  return apiRequest<ContactoEmergenciaDTO>(`${base(idPaciente)}/${idContacto}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/** DELETE .../contactos/{idContacto} — quitar contacto */
export function eliminarContacto(idPaciente: number, idContacto: number): Promise<void> {
  return apiRequest<void>(`${base(idPaciente)}/${idContacto}`, { method: "DELETE" });
}
