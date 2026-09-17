// Tipo espejo de com.clinica.arches.dto.PersonalDTO

export interface PersonalDTO {
  idPersonal: number;
  nombreCompleto: string;
  cargo: string;
  estado: string;
  numeroLicencia: string | null;
}

