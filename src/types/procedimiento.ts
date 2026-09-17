// Tipo espejo de com.clinica.arches.dto.ProcedimientoDTO

export interface ProcedimientoDTO {
  idProcedimiento: number;
  nombreProcedimiento: string;
  duracionMinutos: number | null;
  precio: number | null;
  estado: string;
}
