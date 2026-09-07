import { apiRequest } from "./http";
import type { AntecedenteDTO, AntecedenteInput } from "@/types/paciente";

const base = (idPaciente: number) => `/api/pacientes/${idPaciente}/antecedentes`;

/** GET .../antecedentes — pestaña "Antecedentes" dentro de la vista Ver */
export function listarAntecedentes(idPaciente: number): Promise<AntecedenteDTO[]> {
  return apiRequest<AntecedenteDTO[]>(base(idPaciente));
}

/** POST .../antecedentes — agregar antecedente desde Editar */
export function crearAntecedente(idPaciente: number, data: AntecedenteInput): Promise<AntecedenteDTO> {
  return apiRequest<AntecedenteDTO>(base(idPaciente), {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** PUT .../antecedentes/{idAntecedente} — editar antecedente existente */
export function actualizarAntecedente(
  idPaciente: number,
  idAntecedente: number,
  data: AntecedenteInput,
): Promise<AntecedenteDTO> {
  return apiRequest<AntecedenteDTO>(`${base(idPaciente)}/${idAntecedente}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/** DELETE .../antecedentes/{idAntecedente} — quitar antecedente */
export function eliminarAntecedente(idPaciente: number, idAntecedente: number): Promise<void> {
  return apiRequest<void>(`${base(idPaciente)}/${idAntecedente}`, { method: "DELETE" });
}
