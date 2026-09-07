export type Estado =
  | "activo"
  | "inactivo"
  | "pendiente"
  | "cancelado"
  | "completado"
  | "en proceso"
  | "programada"
  | "confirmada"
  | "atendida"
  | "propuesto"
  | "en curso"
  | "finalizado"
  | "pagado"
  | "urgente";

export const usuarios = [
  { id: "U-001", nombre: "Dra. María Fernanda Rivas", correo: "mrivas@arches.ni", rol: "Administrador", estado: "activo", ultimoAcceso: "07/08/2026 08:12" },
  { id: "U-002", nombre: "Dr. Carlos Talavera", correo: "ctalavera@arches.ni", rol: "Odontólogo", estado: "activo", ultimoAcceso: "07/08/2026 07:45" },
  { id: "U-003", nombre: "Dra. Ana Lucía Meza", correo: "ameza@arches.ni", rol: "Odontólogo", estado: "activo", ultimoAcceso: "06/08/2026 16:30" },
  { id: "U-004", nombre: "Karla Jarquín", correo: "kjarquin@arches.ni", rol: "Recepcionista", estado: "activo", ultimoAcceso: "07/08/2026 08:02" },
  { id: "U-005", nombre: "José Ramón Corea", correo: "jcorea@arches.ni", rol: "Personal autorizado", estado: "inactivo", ultimoAcceso: "12/07/2026 14:20" },
  { id: "U-006", nombre: "Hilda Espinoza", correo: "hespinoza@arches.ni", rol: "Recepcionista", estado: "activo", ultimoAcceso: "05/08/2026 09:10" },
] as const;

export const roles = ["Administrador", "Odontólogo", "Recepcionista", "Personal autorizado"];

export const modulosPermisos = [
  "Pacientes",
  "Agenda y Citas",
  "Expediente Clínico",
  "Procedimientos",
  "Personal",
  "Reportes",
  "Usuarios y Roles",
  "Configuración",
];

export const pacientes = [
  { id: "P-1001", nombre: "Juan Carlos Espinoza López", cedula: "081-150390-1002B", telefono: "8455-1290", nacimiento: "15/03/1990", sexo: "Masculino", estado: "activo", ultimaVisita: "04/08/2026", registro: "12/01/2024", direccion: "Barrio Guadalupe, Chinandega", ocupacion: "Comerciante", correo: "jcespinoza@gmail.com", emergencia: "Rosa López — 8712-3390", alergias: "Penicilina", cronicas: "Hipertensión controlada", medicamentos: "Losartán 50mg", familiares: "Diabetes (madre)" },
  { id: "P-1002", nombre: "María José Bermúdez Sáenz", cedula: "081-220785-0004K", telefono: "8890-4471", nacimiento: "22/07/1985", sexo: "Femenino", estado: "activo", ultimaVisita: "01/08/2026", registro: "03/02/2024", direccion: "Reparto Los Ángeles, Chinandega", ocupacion: "Docente", correo: "mjbermudez@gmail.com", emergencia: "Luis Sáenz — 8600-1122", alergias: "Ninguna conocida", cronicas: "Ninguna", medicamentos: "Ninguno", familiares: "Hipertensión (padre)" },
  { id: "P-1003", nombre: "Álvaro Antonio Munguía", cedula: "081-091278-0007M", telefono: "8321-7788", nacimiento: "09/12/1978", sexo: "Masculino", estado: "activo", ultimaVisita: "28/07/2026", registro: "19/05/2024", direccion: "El Viejo, Chinandega", ocupacion: "Ingeniero", correo: "amunguia@hotmail.com", emergencia: "Sofía Munguía — 8455-9080", alergias: "Látex", cronicas: "Diabetes tipo 2", medicamentos: "Metformina 850mg", familiares: "Diabetes (ambos padres)" },
  { id: "P-1004", nombre: "Karen Vanessa Ortiz", cedula: "081-030199-1001C", telefono: "7712-3040", nacimiento: "03/01/1999", sexo: "Femenino", estado: "activo", ultimaVisita: "22/07/2026", registro: "08/09/2024", direccion: "Barrio San Luis, Chinandega", ocupacion: "Estudiante", correo: "kvortiz@gmail.com", emergencia: "Marta Ortiz — 8811-2244", alergias: "Ninguna conocida", cronicas: "Asma leve", medicamentos: "Salbutamol PRN", familiares: "Asma (madre)" },
  { id: "P-1005", nombre: "Roberto José Delgadillo", cedula: "081-141165-0003D", telefono: "8100-5566", nacimiento: "14/11/1965", sexo: "Masculino", estado: "inactivo", ultimaVisita: "11/02/2026", registro: "22/11/2023", direccion: "Chichigalpa, Chinandega", ocupacion: "Agricultor", correo: "—", emergencia: "Elena Pérez — 8990-0021", alergias: "Sulfas", cronicas: "Hipertensión", medicamentos: "Enalapril", familiares: "Cardiopatía (padre)" },
  { id: "P-1006", nombre: "Lucía Fernanda Aguirre", cedula: "081-260892-0009L", telefono: "8677-2211", nacimiento: "26/08/1992", sexo: "Femenino", estado: "activo", ultimaVisita: "06/08/2026", registro: "14/03/2025", direccion: "Reparto Bolonia, Chinandega", ocupacion: "Contadora", correo: "lfaguirre@gmail.com", emergencia: "Pedro Aguirre — 8712-4455", alergias: "Ninguna conocida", cronicas: "Ninguna", medicamentos: "Ninguno", familiares: "Ninguno relevante" },
  { id: "P-1007", nombre: "Néstor Iván Pavón", cedula: "081-170581-0002N", telefono: "8233-9911", nacimiento: "17/05/1981", sexo: "Masculino", estado: "activo", ultimaVisita: "30/07/2026", registro: "05/06/2025", direccion: "Posoltega, Chinandega", ocupacion: "Transportista", correo: "nipavon@gmail.com", emergencia: "Ivania Pavón — 8455-6677", alergias: "Ibuprofeno", cronicas: "Ninguna", medicamentos: "Ninguno", familiares: "Diabetes (abuela)" },
  { id: "P-1008", nombre: "Silvia Margarita Roque", cedula: "081-021170-0005S", telefono: "8944-1212", nacimiento: "02/11/1970", sexo: "Femenino", estado: "activo", ultimaVisita: "18/07/2026", registro: "27/07/2025", direccion: "Barrio Rosario, Chinandega", ocupacion: "Ama de casa", correo: "—", emergencia: "Julio Roque — 8100-3344", alergias: "Ninguna conocida", cronicas: "Osteoporosis", medicamentos: "Calcio + Vit. D", familiares: "Osteoporosis (madre)" },
];

export const odontologos = ["Dr. Carlos Talavera", "Dra. Ana Lucía Meza", "Dra. María Fernanda Rivas"];

export const citas = [
  { id: "C-3001", paciente: "Juan Carlos Espinoza López", odontologo: "Dr. Carlos Talavera", fecha: "07/08/2026", hora: "08:00", duracion: "45 min", procedimiento: "Limpieza dental", estado: "confirmada", notas: "Control semestral" },
  { id: "C-3002", paciente: "María José Bermúdez Sáenz", odontologo: "Dra. Ana Lucía Meza", fecha: "07/08/2026", hora: "09:00", duracion: "60 min", procedimiento: "Resina compuesta", estado: "programada", notas: "Pieza 26" },
  { id: "C-3003", paciente: "Álvaro Antonio Munguía", odontologo: "Dr. Carlos Talavera", fecha: "07/08/2026", hora: "10:30", duracion: "90 min", procedimiento: "Endodoncia", estado: "atendida", notas: "Segunda sesión" },
  { id: "C-3004", paciente: "Karen Vanessa Ortiz", odontologo: "Dra. María Fernanda Rivas", fecha: "07/08/2026", hora: "13:00", duracion: "30 min", procedimiento: "Valoración inicial", estado: "cancelada", notas: "Paciente reprogramará" },
  { id: "C-3005", paciente: "Lucía Fernanda Aguirre", odontologo: "Dra. Ana Lucía Meza", fecha: "08/08/2026", hora: "08:30", duracion: "60 min", procedimiento: "Blanqueamiento", estado: "confirmada", notas: "—" },
  { id: "C-3006", paciente: "Néstor Iván Pavón", odontologo: "Dr. Carlos Talavera", fecha: "08/08/2026", hora: "11:00", duracion: "45 min", procedimiento: "Extracción simple", estado: "programada", notas: "Pieza 38" },
  { id: "C-3007", paciente: "Silvia Margarita Roque", odontologo: "Dra. María Fernanda Rivas", fecha: "10/08/2026", hora: "14:00", duracion: "60 min", procedimiento: "Prótesis parcial — prueba", estado: "programada", notas: "Traer prótesis anterior" },
  { id: "C-3008", paciente: "Juan Carlos Espinoza López", odontologo: "Dra. Ana Lucía Meza", fecha: "11/08/2026", hora: "09:30", duracion: "30 min", procedimiento: "Control post-operatorio", estado: "programada", notas: "—" },
];

export const procedimientos = [
  { id: "PR-01", nombre: "Limpieza dental (profilaxis)", categoria: "Preventiva", costo: 700, duracion: "45 min" },
  { id: "PR-02", nombre: "Resina compuesta", categoria: "Restaurativa", costo: 950, duracion: "60 min" },
  { id: "PR-03", nombre: "Endodoncia unirradicular", categoria: "Endodoncia", costo: 3200, duracion: "90 min" },
  { id: "PR-04", nombre: "Extracción simple", categoria: "Cirugía", costo: 800, duracion: "45 min" },
  { id: "PR-05", nombre: "Extracción de tercer molar", categoria: "Cirugía", costo: 2500, duracion: "90 min" },
  { id: "PR-06", nombre: "Blanqueamiento dental", categoria: "Estética", costo: 3500, duracion: "60 min" },
  { id: "PR-07", nombre: "Corona de porcelana", categoria: "Prótesis", costo: 6800, duracion: "120 min" },
  { id: "PR-08", nombre: "Prótesis parcial removible", categoria: "Prótesis", costo: 8500, duracion: "120 min" },
  { id: "PR-09", nombre: "Sellante de fosas y fisuras", categoria: "Preventiva", costo: 450, duracion: "30 min" },
  { id: "PR-10", nombre: "Aplicación de flúor", categoria: "Preventiva", costo: 350, duracion: "20 min" },
];

export const tratamientos = [
  { id: "T-501", paciente: "Álvaro Antonio Munguía", procedimiento: "Endodoncia unirradicular", fecha: "28/07/2026", odontologo: "Dr. Carlos Talavera", costo: 3200, avance: "en proceso", pago: "pendiente" },
  { id: "T-502", paciente: "Juan Carlos Espinoza López", procedimiento: "Limpieza dental (profilaxis)", fecha: "04/08/2026", odontologo: "Dra. Ana Lucía Meza", costo: 700, avance: "completado", pago: "pagado" },
  { id: "T-503", paciente: "María José Bermúdez Sáenz", procedimiento: "Resina compuesta", fecha: "07/08/2026", odontologo: "Dra. Ana Lucía Meza", costo: 950, avance: "pendiente", pago: "pendiente" },
  { id: "T-504", paciente: "Silvia Margarita Roque", procedimiento: "Prótesis parcial removible", fecha: "18/07/2026", odontologo: "Dra. María Fernanda Rivas", costo: 8500, avance: "en proceso", pago: "pendiente" },
  { id: "T-505", paciente: "Lucía Fernanda Aguirre", procedimiento: "Blanqueamiento dental", fecha: "06/08/2026", odontologo: "Dra. Ana Lucía Meza", costo: 3500, avance: "completado", pago: "pagado" },
  { id: "T-506", paciente: "Néstor Iván Pavón", procedimiento: "Extracción de tercer molar", fecha: "08/08/2026", odontologo: "Dr. Carlos Talavera", costo: 2500, avance: "pendiente", pago: "pendiente" },
];

export const personal = [
  { id: "PE-01", nombre: "Dr. Carlos Talavera", cargo: "Odontólogo", especialidad: "Endodoncia", telefono: "8455-0011", correo: "ctalavera@arches.ni", estado: "activo", horario: "Lun–Vie 08:00–17:00", licencia: "MINSA-OD-3391" },
  { id: "PE-02", nombre: "Dra. Ana Lucía Meza", cargo: "Odontólogo", especialidad: "Odontología estética", telefono: "8712-4402", correo: "ameza@arches.ni", estado: "activo", horario: "Lun–Sáb 08:00–14:00", licencia: "MINSA-OD-4120" },
  { id: "PE-03", nombre: "Dra. María Fernanda Rivas", cargo: "Odontólogo", especialidad: "Prótesis dental", telefono: "8100-7789", correo: "mrivas@arches.ni", estado: "activo", horario: "Lun–Vie 09:00–18:00", licencia: "MINSA-OD-2870" },
  { id: "PE-04", nombre: "Karla Jarquín", cargo: "Administrativo", especialidad: "—", telefono: "8944-3312", correo: "kjarquin@arches.ni", estado: "activo", horario: "Lun–Sáb 07:30–16:00", licencia: "—" },
  { id: "PE-05", nombre: "José Ramón Corea", cargo: "Administrativo", especialidad: "—", telefono: "8233-1190", correo: "jcorea@arches.ni", estado: "inactivo", horario: "—", licencia: "—" },
];

export const bitacora = [
  { id: 1, usuario: "Karla Jarquín", accion: "Creó cita C-3008", modulo: "Agenda y Citas", fecha: "07/08/2026 08:41", ip: "192.168.1.24" },
  { id: 2, usuario: "Dr. Carlos Talavera", accion: "Actualizó odontograma de P-1003", modulo: "Expediente Clínico", fecha: "07/08/2026 08:22", ip: "192.168.1.31" },
  { id: 3, usuario: "Dra. María Fernanda Rivas", accion: "Editó usuario U-005", modulo: "Usuarios y Roles", fecha: "06/08/2026 17:05", ip: "192.168.1.10" },
  { id: 4, usuario: "Karla Jarquín", accion: "Registró paciente P-1008", modulo: "Pacientes", fecha: "06/08/2026 11:14", ip: "192.168.1.24" },
  { id: 5, usuario: "Dra. Ana Lucía Meza", accion: "Cerró tratamiento T-505", modulo: "Procedimientos", fecha: "06/08/2026 10:48", ip: "192.168.1.19" },
  { id: 6, usuario: "Sistema", accion: "Respaldo automático generado", modulo: "Configuración", fecha: "06/08/2026 02:00", ip: "127.0.0.1" },
];

export const respaldos = [
  { id: "B-0091", fecha: "07/08/2026 02:00", tamano: "148 MB", tipo: "Automático", estado: "completado" },
  { id: "B-0090", fecha: "06/08/2026 02:00", tamano: "147 MB", tipo: "Automático", estado: "completado" },
  { id: "B-0089", fecha: "05/08/2026 16:35", tamano: "146 MB", tipo: "Manual", estado: "completado" },
  { id: "B-0088", fecha: "05/08/2026 02:00", tamano: "—", tipo: "Automático", estado: "cancelado" },
];

export const catalogos = {
  "Tipos de procedimiento": ["Preventiva", "Restaurativa", "Endodoncia", "Cirugía", "Estética", "Prótesis"],
  Especialidades: ["Endodoncia", "Ortodoncia", "Periodoncia", "Odontopediatría", "Prótesis dental", "Odontología estética"],
  "Motivos de cancelación": ["Paciente no asistió", "Reprogramación solicitada", "Emergencia del odontólogo", "Falla de equipo"],
  "Estados de expediente": ["Activo", "Inactivo", "Archivado"],
};

export const diagnosticos = [
  { fecha: "28/07/2026", diagnostico: "Pulpitis irreversible pieza 36", descripcion: "Dolor espontáneo nocturno, respuesta prolongada al frío.", odontologo: "Dr. Carlos Talavera" },
  { fecha: "12/05/2026", diagnostico: "Caries oclusal pieza 46", descripcion: "Lesión cavitada en esmalte y dentina superficial.", odontologo: "Dra. Ana Lucía Meza" },
  { fecha: "03/02/2026", diagnostico: "Gingivitis generalizada leve", descripcion: "Sangrado al sondaje en sextantes 2 y 5.", odontologo: "Dra. Ana Lucía Meza" },
];

export const planTratamiento = [
  { procedimiento: "Endodoncia pieza 36", sesiones: "2 de 3", costo: 3200, estado: "en curso", odontologo: "Dr. Carlos Talavera" },
  { procedimiento: "Corona de porcelana pieza 36", sesiones: "0 de 2", costo: 6800, estado: "propuesto", odontologo: "Dra. María Fernanda Rivas" },
  { procedimiento: "Resina pieza 46", sesiones: "1 de 1", costo: 950, estado: "finalizado", odontologo: "Dra. Ana Lucía Meza" },
];

export const evolucion = [
  { fecha: "28/07/2026 10:30", odontologo: "Dr. Carlos Talavera", nota: "Segunda sesión de endodoncia en pieza 36. Instrumentación de conductos y medicación intraconducto con hidróxido de calcio. Paciente tolera bien el procedimiento." },
  { fecha: "12/07/2026 09:15", odontologo: "Dr. Carlos Talavera", nota: "Apertura cameral pieza 36, drenaje de exudado. Se indica amoxicilina 500mg cada 8h por 7 días." },
  { fecha: "12/05/2026 11:00", odontologo: "Dra. Ana Lucía Meza", nota: "Restauración con resina compuesta A2 en pieza 46. Ajuste oclusal y pulido final." },
  { fecha: "03/02/2026 08:45", odontologo: "Dra. Ana Lucía Meza", nota: "Profilaxis y aplicación tópica de flúor. Se refuerza técnica de cepillado y uso de hilo dental." },
];

export const citasPorMes = [
  { mes: "Feb", citas: 128, atendidas: 112 },
  { mes: "Mar", citas: 156, atendidas: 141 },
  { mes: "Abr", citas: 143, atendidas: 130 },
  { mes: "May", citas: 178, atendidas: 165 },
  { mes: "Jun", citas: 192, atendidas: 174 },
  { mes: "Jul", citas: 205, atendidas: 189 },
  { mes: "Ago", citas: 96, atendidas: 84 },
];

export const procedimientosFrecuentes = [
  { nombre: "Limpieza", total: 148 },
  { nombre: "Resina", total: 121 },
  { nombre: "Extracción", total: 76 },
  { nombre: "Endodoncia", total: 54 },
  { nombre: "Corona", total: 31 },
  { nombre: "Blanqueamiento", total: 22 },
];

export const ingresosPorMes = [
  { mes: "Feb", ingresos: 98400, gastos: 41200 },
  { mes: "Mar", ingresos: 118700, gastos: 46800 },
  { mes: "Abr", ingresos: 109300, gastos: 44100 },
  { mes: "May", ingresos: 134900, gastos: 51500 },
  { mes: "Jun", ingresos: 147200, gastos: 55300 },
  { mes: "Jul", ingresos: 158600, gastos: 58900 },
  { mes: "Ago", ingresos: 142300, gastos: 52400 },
];

export const estadosCitas = [
  { estado: "Atendidas", total: 189, color: "var(--chart-1)" },
  { estado: "Confirmadas", total: 42, color: "var(--chart-2)" },
  { estado: "Programadas", total: 31, color: "var(--chart-3)" },
  { estado: "Canceladas", total: 14, color: "var(--chart-4)" },
];

export const pacientesNuevosVsRecurrentes = [
  { mes: "Feb", nuevos: 24, recurrentes: 104 },
  { mes: "Mar", nuevos: 31, recurrentes: 125 },
  { mes: "Abr", nuevos: 27, recurrentes: 116 },
  { mes: "May", nuevos: 35, recurrentes: 143 },
  { mes: "Jun", nuevos: 29, recurrentes: 163 },
  { mes: "Jul", nuevos: 38, recurrentes: 167 },
  { mes: "Ago", nuevos: 18, recurrentes: 78 },
];

export const cargaOdontologos = [
  { nombre: "Dr. Talavera", citas: 96, horas: 118 },
  { nombre: "Dra. Meza", citas: 84, horas: 102 },
  { nombre: "Dra. Rivas", citas: 61, horas: 77 },
];
