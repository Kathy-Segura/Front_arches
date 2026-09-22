
/** Forma reducida que ya devuelve GET /api/procedimientos (selector de citas). */
export interface ProcedimientoDTO {
  idProcedimiento: number;
  nombreProcedimiento: string;
  duracionMinutos: number;
  precio: number;
  estado: string;
}

/** Forma completa para el listado y detalle del módulo administrativo. */
export interface ProcedimientoDetalleDTO extends ProcedimientoDTO {
  categoria: string;
  descripcion?: string;
}

/** DTO de entrada para crear/editar un procedimiento. */
export interface ProcedimientoRequestDTO {
  nombreProcedimiento: string;
  categoria: string;
  duracionMinutos: number;
  precio: number;
  descripcion?: string;
}

/** Igual que PaginaDTO<T> en types/personal.ts. */
export interface PaginaDTO<T> {
  contenido: T[];
  totalElementos: number;
}
