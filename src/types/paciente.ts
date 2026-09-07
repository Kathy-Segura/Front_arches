// Tipos espejo de los DTOs de com.clinica.arches.dto.* y las entidades usadas
// como body en POST/PUT. Los nombres de campo coinciden 1:1 con el JSON que
// produce Jackson a partir de tus clases @Data (mismo nombre de propiedad).

export interface ContactoEmergenciaDTO {
  idContacto: number;
  nombreContacto: string;
  telefono: string;
  parentesco: string | null;
}

export interface AntecedenteDTO {
  idAntecedente: number;
  tipoAntecedente: string;
  descripcion: string;
  fechaRegistro: string; // ISO LocalDateTime, ej: "2026-08-30T10:15:00"
}

export interface PacienteDTO {
  idPaciente: number;
  nombreCompleto: string;
  cedula: string;
  fechaNacimiento: string; // ISO LocalDate "yyyy-MM-dd"
  edad: number;
  sexo: string;
  direccion: string | null;
  ocupacion: string | null;
  telefono: string;
  correo: string | null;
  estadoExpediente: "activo" | "inactivo" | string;
  // Solo vienen llenos en GET /api/pacientes/{id} (detalle completo)
  contactos?: ContactoEmergenciaDTO[];
  antecedentes?: AntecedenteDTO[];
}

// Respuesta paginada estándar de Spring Data (org.springframework.data.domain.Page)
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // página actual, 0-based
  size: number;
}

// --- Bodies para crear/actualizar (reflejan la entidad Paciente, no el DTO) ---

export interface PacienteInput {
  nombreCompleto: string;
  cedula: string;
  fechaNacimiento: string; // "yyyy-MM-dd"
  sexo: string;
  direccion?: string;
  ocupacion?: string;
  telefono: string;
  correo?: string;
}

export interface ContactoInput {
  nombreContacto: string;
  telefono: string;
  parentesco?: string;
}

export interface AntecedenteInput {
  tipoAntecedente: string;
  descripcion: string;
}

export interface ListarPacientesParams {
  search?: string;
  estado?: "activo" | "inactivo" | "";
  page?: number;
  size?: number;
}
