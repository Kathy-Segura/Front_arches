//type/tratamientos

export interface PaginaDTO<T> {
  contenido: T[];
  totalElementos: number;
  totalPaginas: number;
  pagina: number;
  tamanoPagina: number;
}

export interface SesionDTO {
  idSesion: number;
  idTratamiento: number;
  idCita?: number | null;
  fechaSesion: string; // ISO
  descripcionAvance: string;
}

export interface SesionRequestDTO {
  idCita?: number | null;
  fechaSesion?: string;
  descripcionAvance: string;
}

export interface TratamientoDTO {
  idTratamiento: number;
  idPaciente: number;
  idProcedimiento: number;
  idPersonal: number;
  personalNombre?: string;
  fechaProgramada?: string | null;
  costoTotal: number;
  sesionesPlanificadas: number;
  estadoAvance: "propuesto" | "pendiente" | "en_proceso" | "completado";
  estadoPago: "pendiente" | "parcial" | "pagado";
  notas?: string;
  fechaCreacion: string;
  sesiones?: SesionDTO[] | null;
}

export interface TratamientoRequestDTO {
  idPaciente: number;
  idProcedimiento: number;
  idPersonal: number;
  fechaProgramada?: string | null;
  costoTotal: number;
  sesionesPlanificadas?: number;
  notas?: string;
  estadoAvance?: string;
  estadoPago?: string;
}



