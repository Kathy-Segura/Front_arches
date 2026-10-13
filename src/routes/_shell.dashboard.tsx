import { useCallback, useEffect, useMemo, useState, type ComponentProps, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Users, ClipboardList, DollarSign, Plus, ArrowRight, RefreshCw } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi } from "@/lib/api/dashboard";
import type { DashboardResumen } from "@/types/dashboard";

export const Route = createFileRoute("/_shell/dashboard")({
  head: () => ({
    meta: [
      { title: "Panel general — ARCHES" },
      { name: "description", content: "Resumen diario de citas, pacientes y tratamientos de la clínica." },
      { property: "og:title", content: "Panel general — ARCHES" },
      { property: "og:description", content: "Resumen diario de citas, pacientes y tratamientos de la clínica." },
    ],
  }),
  component: Dashboard,
});

/* ------------------------------ Estilos charts ------------------------------ */

const ejeTick = { fill: "var(--muted-foreground)", fontSize: 11 } as const;
const ejeX = { tick: ejeTick, tickLine: false, axisLine: { stroke: "var(--border)" }, tickMargin: 10, minTickGap: 8 } as const;
const ejeY = { tick: ejeTick, tickLine: false, axisLine: false, tickMargin: 8, allowDecimals: false, width: 32 } as const;
const cuadricula = { stroke: "var(--border)", strokeOpacity: 0.8, vertical: false } as const;
const margenChart = { top: 8, right: 8, left: 0, bottom: 0 } as const;
const cursorLinea = { stroke: "var(--muted-foreground)", strokeOpacity: 0.4, strokeWidth: 1 } as const;
const cursorBarra = { fill: "var(--muted)", fillOpacity: 0.45 } as const;

/* ------------------------------- Utilidades ------------------------------- */

const capitalizar = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** 'YYYY-MM' -> fecha UTC (evita corrimientos por zona horaria). */
function mesToDate(mes: string): Date {
  const [y = 1970, m = 1] = mes.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
}

/** 'YYYY-MM' -> 'Ago' */
function mesCorto(mes: string): string {
  const txt = new Intl.DateTimeFormat("es-NI", { month: "short", timeZone: "UTC" }).format(mesToDate(mes));
  return capitalizar(txt.replace(".", ""));
}

/** 'YYYY-MM' -> 'Agosto 2026' */
function mesLargo(mes: string): string {
  if (!mes) return "";
  return capitalizar(new Intl.DateTimeFormat("es-NI", { month: "long", year: "numeric", timeZone: "UTC" }).format(mesToDate(mes)));
}

const moneda = (n: number) => `C$ ${Number(n).toLocaleString("es-NI", { maximumFractionDigits: 0 })}`;

/** Color por estado de cita (los estados nuevos usan el color de respaldo). */
const COLOR_ESTADO: Record<string, string> = {
  programada: "var(--chart-2)",
  confirmada: "var(--chart-1)",
  atendida: "var(--chart-3)",
  cancelada: "var(--chart-5)",
  no_asistio: "var(--chart-4)",
};
const colorEstado = (estado: string) => COLOR_ESTADO[estado] ?? "var(--muted-foreground)";
const etiquetaEstado = (estado: string) => capitalizar(estado.replace(/_/g, " "));

type EstadoBadge = ComponentProps<typeof StatusBadge>["estado"];

/* --------------------------------- Hook --------------------------------- */

/** Cada sección puede venir como null si su endpoint falló. */
type DashboardData = { [K in keyof DashboardResumen]: DashboardResumen[K] | null };

function valor<T>(r: PromiseSettledResult<T>): T | null {
  return r.status === "fulfilled" ? r.value : null;
}

function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      // Una petición por sección (en vez de /dashboard): si una consulta falla,
      // el resto del panel se sigue mostrando y se sabe exactamente cuál falló.
      const [kpis, citasPorMes, procedimientosFrecuentes, ingresosVsGastos, estadosCitas, agendaHoy, cargaOdontologos, pacientesNuevosRecurrentes] =
        await Promise.allSettled([
          dashboardApi.getKpis(signal),
          dashboardApi.getCitasPorMes({ meses: 12 }, signal),
          dashboardApi.getProcedimientosFrecuentes({ meses: 12, procedimientos: 6 }, signal),
          dashboardApi.getIngresosVsGastos({ meses: 12 }, signal),
          dashboardApi.getEstadosCitas(signal),
          dashboardApi.getAgendaHoy(signal),
          dashboardApi.getCargaOdontologos({ meses: 12, odontologos: 8 }, signal),
          dashboardApi.getPacientesNuevosRecurrentes({ meses: 12 }, signal),
        ]);

      if (signal?.aborted) return;

      setData({
        kpis: valor(kpis),
        citasPorMes: valor(citasPorMes),
        procedimientosFrecuentes: valor(procedimientosFrecuentes),
        ingresosVsGastos: valor(ingresosVsGastos),
        estadosCitas: valor(estadosCitas),
        agendaHoy: valor(agendaHoy),
        cargaOdontologos: valor(cargaOdontologos),
        pacientesNuevosRecurrentes: valor(pacientesNuevosRecurrentes),
      });

      const resultados: [string, PromiseSettledResult<unknown>][] = [
        ["indicadores", kpis],
        ["citas por mes", citasPorMes],
        ["procedimientos frecuentes", procedimientosFrecuentes],
        ["ingresos vs. gastos", ingresosVsGastos],
        ["estados de citas", estadosCitas],
        ["agenda de hoy", agendaHoy],
        ["carga por odontólogo", cargaOdontologos],
        ["pacientes nuevos vs. recurrentes", pacientesNuevosRecurrentes],
      ];

      const fallos = resultados.flatMap(([etiqueta, r]) => {
        if (r.status !== "rejected") return [];
        const status = (r.reason as { status?: number } | null)?.status;
        const detalle = status !== undefined ? ` (${status || "sin conexión"})` : "";
        console.error(`[dashboard] falló "${etiqueta}"`, r.reason);
        return [`${etiqueta}${detalle}`];
      });

      if (fallos.length === resultados.length) {
        setError("No se pudo cargar el dashboard. Revisa que el servidor esté disponible.");
      } else if (fallos.length > 0) {
        setError(`No se pudo cargar: ${fallos.join(", ")}.`);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "No se pudo cargar el dashboard.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return { data, loading, error, reload: () => void load() };
}

/* ---------------------------- Piezas reutilizables ---------------------------- */

type Rango = 3 | 6 | 12;
const RANGOS: readonly { value: Rango; label: string }[] = [
  { value: 3, label: "3 meses" },
  { value: 6, label: "6 meses" },
  { value: 12, label: "12 meses" },
];

type TopN = 3 | 6;
const TOPS: readonly { value: TopN; label: string }[] = [
  { value: 3, label: "Top 3" },
  { value: 6, label: "Top 6" },
];

type ModoBarras = "agrupado" | "apilado";
const MODOS: readonly { value: ModoBarras; label: string }[] = [
  { value: "agrupado", label: "Agrupado" },
  { value: "apilado", label: "Apilado" },
];

const LIMITE_AGENDA = 8;
const COLUMNAS_AGENDA = "md:grid-cols-[4.5rem_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1fr)_7rem]";

const num = (n: unknown) => Number(n ?? 0).toLocaleString("es-NI");
const pct = (parte: number, total: number) => (total > 0 ? `${Math.round((parte / total) * 100)}%` : "0%");

/** Oculta/muestra una serie, sin permitir que queden todas ocultas. */
function alternarSerie(prev: string[], id: string, totalSeries: number): string[] {
  if (prev.includes(id)) return prev.filter((x) => x !== id);
  return prev.length + 1 >= totalSeries ? prev : [...prev, id];
}

/** Bordes de la franja de indicadores: 1 columna (móvil), 2x2 (sm) y 4 en fila (xl). */
function bordeKpi(i: number): string {
  const movil = i > 0 ? "border-t" : "";
  const sm = `${i < 2 ? "sm:border-t-0" : "sm:border-t"} ${i % 2 === 1 ? "sm:border-l" : "sm:border-l-0"}`;
  const xl = `xl:border-t-0 ${i > 0 ? "xl:border-l" : "xl:border-l-0"}`;
  return `${movil} ${sm} ${xl}`;
}

function ChartEmpty({ loading }: { loading: boolean }) {
  return (
    <div className="grid min-h-0 flex-1 place-items-center text-sm text-muted-foreground">
      {loading ? <div className="h-full w-full animate-pulse rounded-md bg-muted" /> : "Sin datos para mostrar"}
    </div>
  );
}

/** Tarjeta de gráfico: título, descripción, selectores opcionales y área de altura fija. */
function ChartCard({
  title,
  description,
  action,
  className = "",
  children,
}: {
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
  className?: string;
  children: ReactNode;
}) {
  return (
    // min-w-0 + overflow-hidden evitan que un gráfico empuje o se salga de su columna del grid.
    <Card className={`min-w-0 overflow-hidden rounded-lg border-border shadow-none ${className}`}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-x-4 gap-y-2 space-y-0 pb-3">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="h-80 pt-1">
        <div className="flex h-full min-h-0 min-w-0 flex-col">{children}</div>
      </CardContent>
    </Card>
  );
}

/** Zona donde vive el gráfico (ocupa el espacio restante de la tarjeta). */
function ChartBox({ children }: { children: ReactNode }) {
  return <div className="min-h-0 min-w-0 flex-1">{children}</div>;
}

/** Selector discreto: opciones de texto con subrayado en la activa. */
function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex shrink-0 items-center gap-4">
      {options.map((o) => {
        const activo = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={activo}
            onClick={() => onChange(o.value)}
            className={`border-b-2 pb-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activo
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

type TipoMuestra = "linea" | "punteada" | "cuadro";

function Muestra({ color, tipo }: { color: string; tipo: TipoMuestra }) {
  if (tipo === "cuadro") {
    return <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: color }} />;
  }
  return (
    <span
      className="inline-block w-4 shrink-0 border-t-2"
      style={{ borderTopColor: color, borderTopStyle: tipo === "punteada" ? "dashed" : "solid" }}
    />
  );
}

/** Leyenda interactiva: clic para ocultar/mostrar una serie. */
function ChartLegend({
  items,
  ocultos,
  onToggle,
}: {
  items: readonly { id: string; label: string; color: string; tipo: TipoMuestra }[];
  ocultos: readonly string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pb-3">
      {items.map((it) => {
        const oculto = ocultos.includes(it.id);
        return (
          <button
            key={it.id}
            type="button"
            aria-pressed={!oculto}
            title={oculto ? `Mostrar ${it.label}` : `Ocultar ${it.label}`}
            onClick={() => onToggle(it.id)}
            className={`inline-flex items-center gap-2 text-xs text-muted-foreground transition-opacity hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              oculto ? "opacity-40" : ""
            }`}
          >
            <Muestra color={it.color} tipo={it.tipo} />
            <span className={oculto ? "line-through" : ""}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------- Tooltips --------------------------------- */

type TooltipItem = {
  name?: string | number | undefined;
  value?: number | string | undefined;
  color?: string | undefined;
  dataKey?: string | number | undefined;
  payload?: unknown;
};

type ChartTooltipProps = {
  active?: boolean | undefined;
  payload?: readonly TooltipItem[] | undefined;
  label?: string | number | undefined;
  titulo?: ((items: readonly TooltipItem[]) => string) | undefined;
  footer?: ((items: readonly TooltipItem[]) => ReactNode) | undefined;
};

function FilaTooltip({ etiqueta, valor: v }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span>{etiqueta}</span>
      <span className="font-medium text-foreground tabular-nums">{v}</span>
    </div>
  );
}

function ChartTooltip({ active, payload, label, titulo, footer }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const encabezado = titulo ? titulo(payload) : label !== undefined ? String(label) : "";
  const pie = footer ? footer(payload) : null;
  return (
    <div className="min-w-44 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      {encabezado && <p className="mb-1.5 font-semibold">{encabezado}</p>}
      <ul className="space-y-1">
        {payload.map((p, i) => (
          <li key={`${String(p.dataKey ?? p.name)}-${i}`} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2 w-2 rounded-[2px]" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="font-medium tabular-nums">{num(p.value)}</span>
          </li>
        ))}
      </ul>
      {pie && <div className="mt-2 space-y-1 border-t border-border pt-2 text-muted-foreground">{pie}</div>}
    </div>
  );
}

function EstadoTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean | undefined;
  payload?: readonly TooltipItem[] | undefined;
  total: number;
}) {
  const fila = payload?.[0]?.payload as { nombre?: string; total?: number; color?: string } | undefined;
  if (!active || !fila) return null;
  const n = Number(fila.total ?? 0);
  return (
    <div className="min-w-40 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1.5 flex items-center gap-2 font-semibold">
        <span className="h-2 w-2 rounded-[2px]" style={{ background: fila.color }} />
        {fila.nombre}
      </p>
      <div className="space-y-1 text-muted-foreground">
        <FilaTooltip etiqueta="Citas" valor={num(n)} />
        <FilaTooltip etiqueta="Del total" valor={pct(n, total)} />
      </div>
    </div>
  );
}

/** 'YYYY-MM' del primer registro del tooltip -> 'Agosto 2026'. */
function tituloMes(items: readonly TooltipItem[]): string {
  const mes = (items[0]?.payload as { mes?: string } | undefined)?.mes;
  return mes ? mesLargo(mes) : "";
}

function footerAtencion(items: readonly TooltipItem[]): ReactNode {
  const f = items[0]?.payload as { citas?: number; atendidas?: number } | undefined;
  const citas = Number(f?.citas ?? 0);
  const atendidas = Number(f?.atendidas ?? 0);
  return <FilaTooltip etiqueta="Tasa de atención" valor={pct(atendidas, citas)} />;
}

function footerPacientes(items: readonly TooltipItem[]): ReactNode {
  const f = items[0]?.payload as { nuevos?: number; recurrentes?: number } | undefined;
  const nuevos = Number(f?.nuevos ?? 0);
  const total = nuevos + Number(f?.recurrentes ?? 0);
  return (
    <>
      <FilaTooltip etiqueta="Total de pacientes" valor={num(total)} />
      <FilaTooltip etiqueta="Nuevos del total" valor={pct(nuevos, total)} />
    </>
  );
}

/** Etiqueta del eje Y recortada con "…" (el nombre completo sale en el tooltip nativo). */
function TickRecortado({
  x,
  y,
  payload,
  max = 18,
}: {
  x?: number | undefined;
  y?: number | undefined;
  payload?: { value?: string | number | undefined } | undefined;
  max?: number | undefined;
}) {
  const texto = String(payload?.value ?? "");
  const corto = texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      <title>{texto}</title>
      <text x={-8} y={0} dy={4} textAnchor="end" fill="var(--muted-foreground)" fontSize={11}>
        {corto}
      </text>
    </g>
  );
}

/* -------------------------------- Pantalla -------------------------------- */

function Dashboard() {
  const { data, loading, error, reload } = useDashboard();

  // Selectores de la vista (filtran en el cliente; la carga de datos no cambia).
  const [rangoCitas, setRangoCitas] = useState<Rango>(12);
  const [ocultasCitas, setOcultasCitas] = useState<string[]>([]);
  const [rangoPacientes, setRangoPacientes] = useState<Rango>(12);
  const [modoPacientes, setModoPacientes] = useState<ModoBarras>("agrupado");
  const [ocultasPacientes, setOcultasPacientes] = useState<string[]>([]);
  const [topProcedimientos, setTopProcedimientos] = useState<TopN>(6);
  const [estadoActivo, setEstadoActivo] = useState<number | null>(null);
  const [filtroAgenda, setFiltroAgenda] = useState<string>("todas");
  const [actualizado, setActualizado] = useState<Date | null>(null);

  useEffect(() => {
    if (!loading && data) setActualizado(new Date());
  }, [loading, data]);

  const kpis = useMemo(() => {
    const k = data?.kpis;
    return [
      {
        label: "Citas de hoy",
        value: k ? String(k.citasHoy) : "—",
        detalle: k ? `${k.citasHoyConfirmadas} confirmadas, ${k.citasHoyAtendidas} atendidas` : "",
        icon: CalendarDays,
      },
      {
        label: "Pacientes activos",
        value: k ? k.pacientesActivos.toLocaleString("es-NI") : "—",
        detalle: k ? `+${k.pacientesNuevosMes} este mes` : "",
        icon: Users,
      },
      {
        label: "Tratamientos en curso",
        value: k ? String(k.tratamientosEnCurso) : "—",
        detalle: k ? `${k.tratamientosConSaldo} con pago pendiente` : "",
        icon: ClipboardList,
      },
      {
        label: "Ingresos del mes",
        value: k ? moneda(k.ingresosMes) : "—",
        detalle: k ? mesLargo(k.mesReferencia) : "",
        icon: DollarSign,
      },
    ];
  }, [data]);

  const citasPorMes = useMemo(() => (data?.citasPorMes ?? []).map((r) => ({ ...r, label: mesCorto(r.mes) })), [data]);
  const ingresosVsGastos = useMemo(
    () => (data?.ingresosVsGastos ?? []).map((r) => ({ ...r, label: mesCorto(r.mes) })),
    [data],
  );
  const nuevosRecurrentes = useMemo(
    () => (data?.pacientesNuevosRecurrentes ?? []).map((r) => ({ ...r, label: mesCorto(r.mes) })),
    [data],
  );
  const estadosCitas = useMemo(
    () => (data?.estadosCitas ?? []).map((e) => ({ ...e, nombre: etiquetaEstado(e.estado), color: colorEstado(e.estado) })),
    [data],
  );
  const agenda = data?.agendaHoy ?? [];
  const procedimientos = data?.procedimientosFrecuentes ?? [];
  const cargaOdontologos = data?.cargaOdontologos ?? [];

  // Solo para mostrar el total en el encabezado de la gráfica de estados.
  const totalEstados = estadosCitas.reduce((acc, e) => acc + Number(e.total ?? 0), 0);

  // Vistas derivadas según los selectores.
  const citasPorMesVista = useMemo(() => citasPorMes.slice(-rangoCitas), [citasPorMes, rangoCitas]);
  const nuevosRecurrentesVista = useMemo(
    () => nuevosRecurrentes.slice(-rangoPacientes),
    [nuevosRecurrentes, rangoPacientes],
  );
  const procedimientosVista = useMemo(
    () => [...procedimientos].sort((a, b) => Number(b.total) - Number(a.total)).slice(0, topProcedimientos),
    [procedimientos, topProcedimientos],
  );
  const totalProcedimientos = procedimientosVista.reduce((acc, p) => acc + Number(p.total ?? 0), 0);

  const estadosAgenda = useMemo(
    () => Array.from(new Set((data?.agendaHoy ?? []).map((c) => String(c.estado)))),
    [data],
  );
  const filtroEfectivo = filtroAgenda !== "todas" && !estadosAgenda.includes(filtroAgenda) ? "todas" : filtroAgenda;
  const agendaFiltrada = filtroEfectivo === "todas" ? agenda : agenda.filter((c) => String(c.estado) === filtroEfectivo);

  const estadoSel = estadoActivo !== null ? estadosCitas[estadoActivo] : undefined;
  const apilado = modoPacientes === "apilado";
  const radioNuevos: [number, number, number, number] = apilado ? [0, 0, 0, 0] : [2, 2, 0, 0];
  const radioRecurrentes: [number, number, number, number] = [2, 2, 0, 0];

  return (
    <>
      <PageHeader
        title="Panel general"
        description="Resumen de la operación clínica del día."
        breadcrumbs={[{ label: "Panel general" }]}
        actions={
          <>
            {actualizado && (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Actualizado a las {actualizado.toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={reload}
              disabled={loading}
              aria-label="Actualizar"
              title="Actualizar datos"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" asChild>
              <Link to="/pacientes">Ver pacientes</Link>
            </Button>
            <Button asChild>
              <Link to="/citas">
                <Plus className="h-4 w-4" /> Nueva cita
              </Link>
            </Button>
          </>
        }
      />

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between gap-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={reload}>
            Reintentar
          </Button>
        </div>
      )}

      <div className="space-y-5">
        {/* Indicadores: una sola franja dividida con líneas finas */}
        <Card className="gap-0 overflow-hidden rounded-lg border-border py-0 shadow-none">
          <CardContent className="grid p-0 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((k, i) => (
              <div key={k.label} className={`min-w-0 border-border px-5 py-4 ${bordeKpi(i)}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-xs font-medium text-muted-foreground">{k.label}</p>
                  <k.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
                </div>
                <p
                  title={k.value}
                  className={`mt-2 truncate text-[1.75rem] leading-none font-semibold tracking-tight tabular-nums ${
                    loading && !data ? "animate-pulse text-muted-foreground" : ""
                  }`}
                >
                  {k.value}
                </p>
                <p title={k.detalle} className="mt-2 min-h-4 truncate text-xs text-muted-foreground">
                  {k.detalle}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tendencia + procedimientos */}
        <div className="grid gap-5 lg:grid-cols-3">
          <ChartCard
            title="Citas por mes"
            description={`Agendadas frente a atendidas, últimos ${rangoCitas} meses`}
            className="lg:col-span-2"
            action={<Segmented value={rangoCitas} onChange={setRangoCitas} options={RANGOS} label="Rango de meses" />}
          >
            {citasPorMes.length === 0 ? (
              <ChartEmpty loading={loading} />
            ) : (
              <>
                <ChartLegend
                  items={[
                    { id: "citas", label: "Citas", color: "var(--chart-1)", tipo: "linea" },
                    { id: "atendidas", label: "Atendidas", color: "var(--chart-3)", tipo: "punteada" },
                  ]}
                  ocultos={ocultasCitas}
                  onToggle={(id) => setOcultasCitas((p) => alternarSerie(p, id, 2))}
                />
                <ChartBox>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={citasPorMesVista} margin={margenChart}>
                      <CartesianGrid {...cuadricula} />
                      <XAxis dataKey="label" {...ejeX} />
                      <YAxis {...ejeY} />
                      <RTooltip
                        cursor={cursorLinea}
                        content={<ChartTooltip titulo={tituloMes} footer={footerAtencion} />}
                      />
                      <Line
                        type="monotone"
                        dataKey="citas"
                        name="Citas"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
                        hide={ocultasCitas.includes("citas")}
                      />
                      <Line
                        type="monotone"
                        dataKey="atendidas"
                        name="Atendidas"
                        stroke="var(--chart-3)"
                        strokeWidth={2}
                        strokeDasharray="5 4"
                        dot={false}
                        activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
                        hide={ocultasCitas.includes("atendidas")}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartBox>
              </>
            )}
          </ChartCard>

          <ChartCard
            title="Procedimientos más frecuentes"
            description="Registros en los últimos 12 meses"
            action={
              <Segmented value={topProcedimientos} onChange={setTopProcedimientos} options={TOPS} label="Cantidad de procedimientos" />
            }
          >
            {procedimientos.length === 0 ? (
              <ChartEmpty loading={loading} />
            ) : (
              <ChartBox>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={procedimientosVista} layout="vertical" barCategoryGap="38%" margin={{ top: 4, right: 28, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" strokeOpacity={0.8} horizontal={false} />
                    <XAxis type="number" {...ejeX} allowDecimals={false} />
                    <YAxis type="category" dataKey="nombre" width={128} tick={<TickRecortado />} tickLine={false} axisLine={false} />
                    <RTooltip
                      cursor={cursorBarra}
                      content={
                        <ChartTooltip
                          titulo={(items) => String((items[0]?.payload as { nombre?: string } | undefined)?.nombre ?? "")}
                          footer={(items) => {
                            const n = Number((items[0]?.payload as { total?: number } | undefined)?.total ?? 0);
                            return <FilaTooltip etiqueta="Del top mostrado" valor={pct(n, totalProcedimientos)} />;
                          }}
                        />
                      }
                    />
                    <Bar dataKey="total" name="Total" fill="var(--chart-1)" radius={[0, 2, 2, 0]} barSize={12}>
                      <LabelList dataKey="total" position="right" fontSize={11} fill="var(--muted-foreground)" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>
            )}
          </ChartCard>
        </div>

        {/* Pacientes + estados */}
        <div className="grid gap-5 lg:grid-cols-3">
          <ChartCard
            title="Pacientes nuevos vs. recurrentes"
            description={`Por mes, últimos ${rangoPacientes} meses`}
            className="lg:col-span-2"
            action={
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <Segmented value={modoPacientes} onChange={setModoPacientes} options={MODOS} label="Tipo de barras" />
                <Segmented value={rangoPacientes} onChange={setRangoPacientes} options={RANGOS} label="Rango de meses" />
              </div>
            }
          >
            {nuevosRecurrentes.length === 0 ? (
              <ChartEmpty loading={loading} />
            ) : (
              <>
                <ChartLegend
                  items={[
                    { id: "nuevos", label: "Nuevos", color: "var(--chart-1)", tipo: "cuadro" },
                    { id: "recurrentes", label: "Recurrentes", color: "var(--chart-3)", tipo: "cuadro" },
                  ]}
                  ocultos={ocultasPacientes}
                  onToggle={(id) => setOcultasPacientes((p) => alternarSerie(p, id, 2))}
                />
                <ChartBox>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={nuevosRecurrentesVista} margin={margenChart} barCategoryGap="30%" barGap={2}>
                      <CartesianGrid {...cuadricula} />
                      <XAxis dataKey="label" {...ejeX} />
                      <YAxis {...ejeY} />
                      <RTooltip
                        cursor={cursorBarra}
                        content={<ChartTooltip titulo={tituloMes} footer={footerPacientes} />}
                      />
                      <Bar
                        dataKey="nuevos"
                        name="Nuevos"
                        fill="var(--chart-1)"
                        radius={radioNuevos}
                        maxBarSize={20}
                        hide={ocultasPacientes.includes("nuevos")}
                        {...(apilado ? { stackId: "pacientes" } : {})}
                      />
                      <Bar
                        dataKey="recurrentes"
                        name="Recurrentes"
                        fill="var(--chart-3)"
                        radius={radioRecurrentes}
                        maxBarSize={20}
                        hide={ocultasPacientes.includes("recurrentes")}
                        {...(apilado ? { stackId: "pacientes" } : {})}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartBox>
              </>
            )}
          </ChartCard>

          <ChartCard
            title="Citas por estado"
            description={totalEstados > 0 ? `${num(totalEstados)} citas en total` : undefined}
          >
            {estadosCitas.length === 0 ? (
              <ChartEmpty loading={loading} />
            ) : (
              <>
                <ChartBox>
                  <div className="relative h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie
                          data={estadosCitas}
                          dataKey="total"
                          nameKey="nombre"
                          innerRadius="76%"
                          outerRadius="96%"
                          paddingAngle={2}
                          stroke="var(--card)"
                          strokeWidth={2}
                          onMouseEnter={(_, i) => setEstadoActivo(i)}
                          onMouseLeave={() => setEstadoActivo(null)}
                        >
                          {estadosCitas.map((e, i) => (
                            <Cell key={e.estado} fill={e.color} fillOpacity={estadoActivo === null || estadoActivo === i ? 1 : 0.3} />
                          ))}
                        </Pie>
                        <RTooltip content={<EstadoTooltip total={totalEstados} />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
                      <span className="text-2xl font-semibold tracking-tight tabular-nums">
                        {estadoSel ? pct(Number(estadoSel.total ?? 0), totalEstados) : num(totalEstados)}
                      </span>
                      <span className="max-w-24 truncate text-xs text-muted-foreground">
                        {estadoSel ? estadoSel.nombre : "Citas"}
                      </span>
                    </div>
                  </div>
                </ChartBox>
                <ul className="mt-3 max-h-32 divide-y divide-border overflow-y-auto border-t border-border">
                  {estadosCitas.map((e, i) => (
                    <li key={e.estado}>
                      <button
                        type="button"
                        onMouseEnter={() => setEstadoActivo(i)}
                        onMouseLeave={() => setEstadoActivo(null)}
                        onFocus={() => setEstadoActivo(i)}
                        onBlur={() => setEstadoActivo(null)}
                        className="flex w-full items-center gap-2 px-1 py-1.5 text-left text-xs hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: e.color }} />
                        <span className="min-w-0 flex-1 truncate" title={e.nombre}>
                          {e.nombre}
                        </span>
                        <span className="font-medium tabular-nums">{num(e.total)}</span>
                        <span className="w-9 text-right text-muted-foreground tabular-nums">
                          {pct(Number(e.total ?? 0), totalEstados)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </ChartCard>
        </div>

        {/* Agenda de hoy: tabla ligera */}
        <Card className="min-w-0 overflow-hidden rounded-lg border-border shadow-none">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-x-4 gap-y-2 space-y-0 pb-3">
            <div>
              <CardTitle className="text-sm font-semibold">Agenda de hoy</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {agenda.length === 0
                  ? "Sin citas"
                  : filtroEfectivo === "todas"
                    ? `${agenda.length} ${agenda.length === 1 ? "cita" : "citas"}`
                    : `${agendaFiltrada.length} de ${agenda.length} citas`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {agenda.length > 0 && (
                <select
                  aria-label="Filtrar agenda por estado"
                  value={filtroEfectivo}
                  onChange={(e) => setFiltroAgenda(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="todas">Todos los estados</option>
                  {estadosAgenda.map((e) => (
                    <option key={e} value={e}>
                      {etiquetaEstado(e)}
                    </option>
                  ))}
                </select>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link to="/citas">
                  Ver agenda <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {agendaFiltrada.length === 0 ? (
              <div className="grid place-items-center gap-2 border-t border-border py-10 text-center text-sm text-muted-foreground">
                <CalendarDays className="h-7 w-7 opacity-40" />
                <p>
                  {loading
                    ? "Cargando agenda…"
                    : agenda.length === 0
                      ? "No hay citas programadas para hoy."
                      : "Ninguna cita coincide con el filtro."}
                </p>
              </div>
            ) : (
              <div>
                <div
                  className={`hidden gap-4 border-y border-border px-1 py-2 text-xs font-medium text-muted-foreground md:grid ${COLUMNAS_AGENDA}`}
                >
                  <span>Hora</span>
                  <span>Paciente</span>
                  <span>Procedimiento</span>
                  <span>Odontólogo</span>
                  <span className="text-right">Estado</span>
                </div>
                <ul className="divide-y divide-border border-t border-border md:border-t-0">
                  {agendaFiltrada.slice(0, LIMITE_AGENDA).map((c) => (
                    <li
                      key={c.id}
                      className={`grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-x-4 px-1 py-3 transition-colors hover:bg-muted/40 ${COLUMNAS_AGENDA}`}
                    >
                      <div>
                        <p className="text-sm font-semibold tabular-nums">{c.hora}</p>
                        {c.duracionMin ? <p className="text-xs text-muted-foreground">{c.duracionMin} min</p> : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium" title={c.paciente}>
                          {c.paciente}
                        </p>
                        <p className="truncate text-xs text-muted-foreground md:hidden">{c.procedimiento}</p>
                        <p className="truncate text-xs text-muted-foreground md:hidden">{c.odontologo}</p>
                      </div>
                      <p className="hidden truncate text-sm md:block" title={c.procedimiento}>
                        {c.procedimiento}
                      </p>
                      <p className="hidden truncate text-sm text-muted-foreground md:block" title={c.odontologo}>
                        {c.odontologo}
                      </p>
                      <div className="justify-self-end">
                        <StatusBadge estado={c.estado as EstadoBadge} />
                      </div>
                    </li>
                  ))}
                </ul>
                {agendaFiltrada.length > LIMITE_AGENDA && (
                  <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                    <Link to="/citas" className="hover:text-foreground hover:underline">
                      y {agendaFiltrada.length - LIMITE_AGENDA} más en la agenda
                    </Link>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
