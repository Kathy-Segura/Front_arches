// src/lib/password.ts
// Contraseñas temporales: generación segura y validación (misma política que el servidor).

const MAYUSCULAS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // sin I ni O (se confunden con 1 y 0)
const MINUSCULAS = "abcdefghijkmnpqrstuvwxyz"; // sin l
const NUMEROS = "23456789"; // sin 0 ni 1

export const MIN_CARACTERES = 8;
const MAX_BYTES = 72; // límite de BCrypt

/** Entero aleatorio en [0, max) con crypto.getRandomValues, sin sesgo de módulo. */
function aleatorio(max: number): number {
  const buffer = new Uint32Array(1);
  const limite = Math.floor(0x100000000 / max) * max;
  let n = 0;
  do {
    crypto.getRandomValues(buffer);
    n = buffer[0] ?? 0;
  } while (n >= limite);
  return n % max;
}

/** Contraseña aleatoria con al menos una mayúscula, una minúscula y un número. */
export function generarContrasenaTemporal(longitud = 12): string {
  const grupos = [MAYUSCULAS, MINUSCULAS, NUMEROS];
  const todos = grupos.join("");
  const caracteres = grupos.map((g) => g.charAt(aleatorio(g.length)));
  while (caracteres.length < Math.max(longitud, MIN_CARACTERES)) {
    caracteres.push(todos.charAt(aleatorio(todos.length)));
  }
  // Fisher–Yates: que los caracteres obligatorios no queden siempre al inicio
  for (let i = caracteres.length - 1; i > 0; i--) {
    const j = aleatorio(i + 1);
    const a = caracteres[i];
    const b = caracteres[j];
    if (a === undefined || b === undefined) continue;
    caracteres[i] = b;
    caracteres[j] = a;
  }
  return caracteres.join("");
}

/** Devuelve el mensaje de error, o null si la contraseña cumple la política. */
export function validarContrasena(contrasena: string): string | null {
  if (contrasena.length < MIN_CARACTERES) {
    return `La contraseña debe tener al menos ${MIN_CARACTERES} caracteres`;
  }
  if (new TextEncoder().encode(contrasena).length > MAX_BYTES) {
    return "La contraseña es demasiado larga";
  }
  if (!/\p{L}/u.test(contrasena) || !/\p{Nd}/u.test(contrasena)) {
    return "La contraseña debe incluir letras y números";
  }
  return null;
}
