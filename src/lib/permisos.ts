import { permisosActuales } from "@/lib/auth";

export type Accion = "ver" | "crear" | "editar" | "eliminar";

/**
 * Qué módulo de `modulos_sistema` protege cada ruta del front (debe coincidir con PermisoAccessPolicy del back).
 * modulo = null -> libre para cualquier usuario con sesión.
 * Una ruta que no aparece aquí no se restringe en el front.
 */
const RUTAS: { prefijo: string; modulo: string | null }[] = [
  { prefijo: "/dashboard", modulo: null },
  { prefijo: "/perfil", modulo: null },
  { prefijo: "/pacientes", modulo: "Pacientes" },
  { prefijo: "/citas", modulo: "Agenda y Citas" },
  { prefijo: "/expedientes", modulo: "Expediente Clínico" },
  { prefijo: "/procedimientos", modulo: "Procedimientos" },
  { prefijo: "/tratamientos", modulo: "Procedimientos" }, // no hay módulo propio: va con Procedimientos
  { prefijo: "/personal", modulo: "Configuración" }, // no hay módulo propio
  { prefijo: "/reportes", modulo: "Reportes" },
  { prefijo: "/usuarios", modulo: "Usuarios" },
  { prefijo: "/roles", modulo: "Roles y Permisos" },
  { prefijo: "/configuracion", modulo: "Configuración" },
];

/** undefined = la ruta no está en la tabla. */
export function moduloDeRuta(pathname: string): string | null | undefined {
  const r = RUTAS.find((x) => pathname === x.prefijo || pathname.startsWith(x.prefijo + "/"));
  return r === undefined ? undefined : r.modulo;
}

/** ¿El usuario actual puede hacer `accion` en el módulo? (p. ej. para ocultar el botón "Nuevo"). */
export function puede(modulo: string, accion: Accion = "ver"): boolean {
  const p = permisosActuales().find((x) => x.nombreModulo === modulo);
  if (!p) return false;
  switch (accion) {
    case "ver":
      return p.puedeVer;
    case "crear":
      return p.puedeVer && p.puedeCrear;
    case "editar":
      return p.puedeVer && p.puedeEditar;
    case "eliminar":
      return p.puedeVer && p.puedeEliminar;
  }
}

export function puedeAccederARuta(pathname: string): boolean {
  const modulo = moduloDeRuta(pathname);
  if (modulo === undefined || modulo === null) return true;
  return puede(modulo, "ver");
}
