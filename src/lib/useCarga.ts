import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/http";

/** Mensaje legible para un error de la API (o el de respaldo si no es un ApiError). */
export function mensajeError(err: unknown, respaldo: string): string {
  return err instanceof ApiError ? err.message : respaldo;
}

/**
 * Carga datos al montar y cada vez que cambian `deps`; ignora respuestas de peticiones viejas.
 * `recargar()` vuelve a ejecutar la carga con las mismas dependencias.
 */
export function useCarga<T>(cargar: () => Promise<T>, deps: readonly unknown[], mensajeRespaldo = "No se pudo cargar la información") {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);
    cargar()
      .then((d) => {
        if (!cancelado) setDatos(d);
      })
      .catch((err) => {
        if (!cancelado) setError(mensajeError(err, mensajeRespaldo));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  return { datos, setDatos, cargando, error, recargar: () => setVersion((v) => v + 1) };
}
