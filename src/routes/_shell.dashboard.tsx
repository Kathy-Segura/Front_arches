import { useCallback, useEffect, useMemo, useState, type ComponentProps } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Users, ClipboardList, DollarSign, Plus, ArrowRight, RefreshCw } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  CartesianGrid,
  Line,
  LineChart,
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

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  boxShadow: "0 8px 24px -12px rgb(0 0 0 / 0.25)",
  fontSize: 12,
} as const;

const labelStyle = { fontWeight: 600, marginBottom: 4 } as const;
const legendStyle = { fontSize: 12, paddingTop: 8 } as const;

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

function ChartEmpty({ loading }: { loading: boolean }) {
  return (
    <div className="grid h-full place-items-center text-sm text-muted-foreground">
      {loading ? <div className="h-full w-full animate-pulse rounded-lg bg-muted" /> : "Sin datos para mostrar"}
    </div>
  );
}

/* -------------------------------- Pantalla -------------------------------- */

function Dashboard() {
  const { data, loading, error, reload } = useDashboard();

  const kpis = useMemo(() => {
    const k = data?.kpis;
    return [
      {
        label: "Citas de hoy",
        value: k ? String(k.citasHoy) : "—",
        detalle: k ? `${k.citasHoyConfirmadas} confirmadas · ${k.citasHoyAtendidas} atendidas` : "",
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

  return (
    <>
      <PageHeader
        title="Panel general"
        description="Resumen de la operación clínica del día."
        breadcrumbs={[{ label: "Panel general" }]}
        actions={
          <>
            <Button variant="outline" size="icon" onClick={reload} disabled={loading} aria-label="Actualizar">
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
          className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={reload}>
            Reintentar
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="overflow-hidden border-border shadow-card">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="bg-gradient-primary grid h-11 w-11 shrink-0 place-items-center rounded-xl text-primary-foreground">
                <k.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{k.label}</p>
                <p className={`mt-1 truncate text-2xl font-semibold ${loading && !data ? "animate-pulse text-muted-foreground" : ""}`}>
                  {k.value}
                </p>
                <p className="mt-0.5 min-h-4 truncate text-xs text-muted-foreground">{k.detalle}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="border-border shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Citas por mes</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {citasPorMes.length === 0 ? (
              <ChartEmpty loading={loading} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={citasPorMes}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                  <RTooltip cursor={{ stroke: "var(--border)" }} contentStyle={tooltipStyle} labelStyle={labelStyle} />
                  <Legend iconType="circle" wrapperStyle={legendStyle} />
                  <Line
                    type="monotone"
                    dataKey="citas"
                    name="Citas"
                    stroke="var(--chart-1)"
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 0, fill: "var(--chart-1)" }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="atendidas"
                    name="Atendidas"
                    stroke="var(--chart-3)"
                    strokeWidth={3}
                    strokeDasharray="5 4"
                    dot={{ r: 3, strokeWidth: 0, fill: "var(--chart-3)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Procedimientos más frecuentes</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {procedimientos.length === 0 ? (
              <ChartEmpty loading={loading} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={procedimientos} barCategoryGap="28%">
                  <defs>
                    <linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="nombre" stroke="var(--muted-foreground)" fontSize={11} interval={0} angle={-20} height={54} textAnchor="end" tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                  <RTooltip cursor={{ stroke: "var(--border)" }} contentStyle={tooltipStyle} labelStyle={labelStyle} />
                  <Bar dataKey="total" name="Total" fill="url(#gBar)" radius={[8, 8, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="border-border shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ingresos vs. gastos mensuales (C$)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {ingresosVsGastos.length === 0 ? (
              <ChartEmpty loading={loading} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ingresosVsGastos}>
                  <defs>
                    <linearGradient id="gIng" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gGas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                  <RTooltip cursor={{ stroke: "var(--border)" }} contentStyle={tooltipStyle} labelStyle={labelStyle} formatter={(v) => moneda(Number(v))} />
                  <Legend iconType="circle" wrapperStyle={legendStyle} />
                  <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="var(--chart-1)" strokeWidth={2} fill="url(#gIng)" />
                  <Area type="monotone" dataKey="gastos" name="Gastos" stroke="var(--chart-4)" strokeWidth={2} fill="url(#gGas)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Distribución de citas por estado</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {estadosCitas.length === 0 ? (
              <ChartEmpty loading={loading} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={estadosCitas} dataKey="total" nameKey="nombre" innerRadius={54} outerRadius={88} paddingAngle={4} cornerRadius={6} stroke="var(--background)" strokeWidth={2}>
                    {estadosCitas.map((e) => (
                      <Cell key={e.estado} fill={e.color} />
                    ))}
                  </Pie>
                  <RTooltip cursor={{ stroke: "var(--border)" }} contentStyle={tooltipStyle} labelStyle={labelStyle} />
                  <Legend iconType="circle" wrapperStyle={legendStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Carga por odontólogo</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {cargaOdontologos.length === 0 ? (
              <ChartEmpty loading={loading} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cargaOdontologos} layout="vertical" barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="odontologo" width={110} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <RTooltip cursor={{ fill: "var(--muted)" }} contentStyle={tooltipStyle} labelStyle={labelStyle} />
                  <Bar dataKey="total" name="Citas" fill="var(--chart-2)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Pacientes nuevos vs. recurrentes</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {nuevosRecurrentes.length === 0 ? (
              <ChartEmpty loading={loading} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nuevosRecurrentes} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                  <RTooltip cursor={{ fill: "var(--muted)" }} contentStyle={tooltipStyle} labelStyle={labelStyle} />
                  <Legend iconType="circle" wrapperStyle={legendStyle} />
                  <Bar dataKey="nuevos" name="Nuevos" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="recurrentes" name="Recurrentes" fill="var(--chart-3)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-border shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Agenda de hoy</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/citas">
              Ver agenda completa <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {agenda.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {loading ? "Cargando agenda…" : "No hay citas programadas para hoy."}
            </p>
          )}
          {agenda.slice(0, 4).map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-border p-3 transition-colors hover:bg-muted/60"
            >
              <div className="w-16 shrink-0 text-center">
                <p className="text-sm font-semibold">{c.hora}</p>
                <p className="text-[11px] text-muted-foreground">{c.duracionMin ? `${c.duracionMin} min` : ""}</p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.paciente}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.procedimiento} · {c.odontologo}
                </p>
              </div>
              <StatusBadge estado={c.estado as EstadoBadge} />
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
