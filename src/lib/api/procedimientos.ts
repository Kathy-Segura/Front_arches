import { apiRequest } from "./http";
import type { ProcedimientoDTO } from "@/types/procedimiento";

const BASE = "/api/procedimientos";

/** GET /api/procedimientos — selector de procedimiento en el formulario de citas */
export function listarProcedimientos(): Promise<ProcedimientoDTO[]> {
  return apiRequest<ProcedimientoDTO[]>(BASE);
}
