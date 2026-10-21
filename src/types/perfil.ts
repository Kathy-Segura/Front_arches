export interface Perfil {
  idUsuario: number;
  nombreCompleto: string;
  correo: string;
  telefono: string | null;
  rol: string;
  /** null si el usuario no está vinculado a un registro de personal */
  cargo: "Odontólogo" | "Administrativo" | null;
  especialidad: string | null;
  numeroLicencia: string | null;
  /** yyyy-MM-dd */
  fechaIngreso: string | null;
  /** yyyy-MM-ddTHH:mm:ss */
  fechaCreacion: string | null;
  notificacionesCorreo: boolean;
  /** data URL de la foto o null */
  foto: string | null;
}

export interface ActualizarPerfilRequest {
  nombreCompleto: string;
  correo: string;
  telefono: string | null;
}

export interface CambiarContrasenaRequest {
  contrasenaActual: string;
  contrasenaNueva: string;
  confirmarContrasena: string;
}

export interface PreferenciasRequest {
  notificacionesCorreo: boolean;
}

export interface FotoRequest {
  foto: string | null;
}

export interface ActividadPerfil {
  idBitacora: number;
  accion: string;
  modulo: string;
  /** yyyy-MM-ddTHH:mm:ss */
  fechaHora: string;
  direccionIp: string | null;
}
