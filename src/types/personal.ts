// Tipo espejo de com.clinica.arches.dto.PersonalDTO

export interface PersonalDTO {
  idPersonal: number;
  nombreCompleto: string;
  cargo: string;
  estado: string;
  numeroLicencia: string | null;
}

export interface PersonalDetalleDTO {
  idPersonal: number;
  idUsuario?: number | null;
  idEspecialidad?: number | null;
  nombreCompleto: string;
  cargo: string;
  telefono?: string;
  correo?: string;
  estado: string;
  horarioTexto?: string;
  numeroLicencia?: string;
  fechaIngreso: string; // ISO yyyy-MM-dd
}

export interface PersonalRequestDTO {
  nombreCompleto: string;
  cargo: string;
  telefono?: string;
  correo?: string;
  horarioTexto?: string;
  numeroLicencia?: string;
  fechaIngreso: string;
  idEspecialidad?: number | null;
  idUsuario?: number | null;
  estado?: string;
}

export interface PaginaDTO<T> {
  contenido: T[];
  pagina: number;
  tamanoPagina: number;
  totalElementos: number;
  totalPaginas: number;
}