import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/http"; // ajustar al nombre real del cliente HTTP
import { reportesApi } from "@/lib/api/reportes";
import type {
  CargaOdontologoDTO,
  FiltrosReporte,
  PacientesNuevosVsRecurrentesDTO,
  ReporteTabular,
  TipoReporte,
} from "@/types/reportes";

function mensajeError(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof TypeError) return "No se pudo conectar con el servidor";
  return "Error inesperado al cargar el reporte";
}

export interface ConsultaReporte {
  tipo: TipoReporte;
  filtros: FiltrosReporte;
  /** Se incrementa en cada clic de "Generar" para forzar la recarga aunque los filtros no cambien. */
  n: number;
}

const VACIO: Record<TipoReporte, ReporteTabular> = {
  citas: { tipo: "citas", filas: [] },
  procedimientos: { tipo: "procedimientos", filas: [] },
  actividad: { tipo: "actividad", filas: [] },
};

async function cargarTabular(tipo: TipoReporte, f: FiltrosReporte, signal: AbortSignal): Promise<ReporteTabular> {
  switch (tipo) {
    case "citas":
      return { tipo, filas: await reportesApi.citas(f, signal) };
    case "procedimientos":
      return { tipo, filas: await reportesApi.procedimientos(f, signal) };
    case "actividad":
      return { tipo, filas: await reportesApi.actividad(f, signal) };
  }
}

/** Reporte tabular (citas | procedimientos | actividad) según la consulta aplicada. */
export function useReporteTabular(consulta: ConsultaReporte) {
  const [state, setState] = useState<{ data: ReporteTabular; loading: boolean; error: string | null }>({
    data: VACIO[consulta.tipo],
    loading: true,
    error: null,
  });
  const { tipo, n } = consulta;
  const { desde, hasta, estado } = consulta.filtros;

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    cargarTabular(tipo, { desde, hasta, estado }, controller.signal)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setState({ data: VACIO[tipo], loading: false, error: mensajeError(err) });
      });
    return () => controller.abort();
  }, [tipo, desde, hasta, estado, n]);

  return state;
}

/** Datos de los dos gráficos (no dependen de los filtros). */
export function useGraficosReportes() {
  const [state, setState] = useState<{
    pacientes: PacientesNuevosVsRecurrentesDTO[];
    carga: CargaOdontologoDTO[];
    loading: boolean;
    error: string | null;
  }>({ pacientes: [], carga: [], loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      reportesApi.pacientesNuevosVsRecurrentes(controller.signal),
      reportesApi.cargaOdontologos(controller.signal),
    ])
      .then(([pacientes, carga]) => setState({ pacientes, carga, loading: false, error: null }))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setState({ pacientes: [], carga: [], loading: false, error: mensajeError(err) });
      });
    return () => controller.abort();
  }, []);

  return state;
}
