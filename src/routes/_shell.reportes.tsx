import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Stethoscope, Activity, FileDown, Printer, Play } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useGraficosReportes, useReporteTabular, type ConsultaReporte } from "@/hooks/useReportes";
import { exportarCsv } from "@/lib/export-csv";
import { printTable } from "@/lib/print";
import {
  DASH,
  formatEstado,
  formatFecha,
  formatFechaHora,
  formatHora,
  formatMoneda,
  mesCorto,
} from "@/lib/reportes-format";
import type { ReporteTabular, TipoReporte } from "@/types/reportes";

export const Route = createFileRoute("/_shell/reportes")({
  head: () => ({
    meta: [
      { title: "Reportes clínicos — ARCHES" },
      { name: "description", content: "Reportes de citas, procedimientos realizados y actividad general del sistema." },
      { property: "og:title", content: "Reportes clínicos — ARCHES" },
      { property: "og:description", content: "Reportes de citas, procedimientos realizados y actividad general." },
    ],
  }),
  component: Reportes,
});

const tipos: { id: TipoReporte; label: string; icon: typeof CalendarDays; detalle: string }[] = [
  { id: "citas", label: "Citas", icon: CalendarDays, detalle: "Por periodo, odontólogo y estado" },
  { id: "procedimientos", label: "Procedimientos realizados", icon: Stethoscope, detalle: "Por categoría y monto" },
  { id: "actividad", label: "Actividad general", icon: Activity, detalle: "Bitácora de usuarios del sistema" },
];

// Valores exactos que acepta el back (ReporteService.ESTADOS_CITA / ESTADOS_AVANCE).
const ESTADOS: Record<TipoReporte, string[]> = {
  citas: ["programada", "confirmada", "atendida", "cancelada"],
  procedimientos: ["propuesto", "pendiente", "en_proceso", "completado"],
  actividad: [],
};

const TODOS = "todos";

interface Preview {
  columns: string[];
  rows: string[][];
  estadoIndex: number;
}

function construirPreview(reporte: ReporteTabular): Preview {
  switch (reporte.tipo) {
    case "citas":
      return {
        columns: ["Paciente", "Procedimiento", "Fecha", "Hora", "Odontólogo", "Estado"],
        rows: reporte.filas.map((c) => [
          c.paciente ?? DASH,
          c.procedimiento ?? DASH,
          formatFecha(c.fechaHora),
          formatHora(c.fechaHora),
          c.odontologo ?? DASH,
          formatEstado(c.estado),
        ]),
        estadoIndex: 5,
      };
    case "procedimientos":
      return {
        columns: ["Paciente", "Procedimiento", "Categoría", "Fecha", "Odontólogo", "Monto", "Avance", "Pago"],
        rows: reporte.filas.map((t) => [
          t.paciente,
          t.procedimiento,
          t.categoria ?? DASH,
          formatFecha(t.fechaProgramada),
          t.odontologo,
          formatMoneda(t.costoTotal),
          formatEstado(t.estadoAvance),
          formatEstado(t.estadoPago),
        ]),
        estadoIndex: 6,
      };
    case "actividad":
      return {
        columns: ["Usuario", "Acción", "Módulo", "Fecha", "IP"],
        rows: reporte.filas.map((b) => [
          b.usuario ?? DASH,
          b.accion,
          b.modulo ?? DASH,
          formatFechaHora(b.fechaHora),
          b.direccionIp ?? DASH,
        ]),
        estadoIndex: -1,
      };
  }
}

function Reportes() {
  // Parámetros del formulario (se aplican al pulsar "Generar" o al cambiar de tipo).
  const [tipo, setTipo] = useState<TipoReporte>("citas");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [estado, setEstado] = useState(TODOS);
  const [consulta, setConsulta] = useState<ConsultaReporte>({ tipo: "citas", filtros: {}, n: 0 });

  const { data: reporte, loading, error } = useReporteTabular(consulta);
  const graficos = useGraficosReportes();

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);
  useEffect(() => {
    if (graficos.error) toast.error(`Gráficos: ${graficos.error}`);
  }, [graficos.error]);

  const generar = (nuevoTipo: TipoReporte, nuevoEstado: string) => {
    if (desde && hasta && desde > hasta) {
      toast.error("La fecha 'Desde' no puede ser posterior a 'Hasta'");
      return;
    }
    setConsulta((c) => ({
      tipo: nuevoTipo,
      filtros: {
        desde: desde || undefined,
        hasta: hasta || undefined,
        estado: nuevoEstado === TODOS ? undefined : nuevoEstado,
      },
      n: c.n + 1,
    }));
  };

  const cambiarTipo = (nuevo: TipoReporte) => {
    setTipo(nuevo);
    setEstado(TODOS); // los estados válidos dependen del tipo
    generar(nuevo, TODOS);
  };

  const preview = useMemo(() => construirPreview(reporte), [reporte]);
  const tituloReporte = tipos.find((t) => t.id === reporte.tipo)!.label;

  const datosPacientes = useMemo(
    () =>
      graficos.pacientes.map((p) => ({
        mes: mesCorto(p.mes),
        nuevos: p.pacientesNuevos,
        recurrentes: p.pacientesRecurrentes,
      })),
    [graficos.pacientes],
  );

  const datosCarga = useMemo(
    () => graficos.carga.map((c) => ({ nombre: c.odontologo, citas: c.totalCitas, horas: c.horas })),
    [graficos.carga],
  );

  const sinFiltroEstado = ESTADOS[tipo].length === 0;

  return (
    <>
      <PageHeader
        title="Reportes"
        description="Genere reportes operativos y de tendencia de la clínica."
        breadcrumbs={[{ label: "Reportes" }]}
      />

      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Parámetros del reporte</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>Tipo de reporte</Label>
            <Select value={tipo} onValueChange={(v) => cambiarTipo(v as TipoReporte)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tipos.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Desde</Label>
            <Input type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Hasta</Label>
            <Input type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={estado} onValueChange={setEstado} disabled={sinFiltroEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                {ESTADOS[tipo].map((e) => (
                  <SelectItem key={e} value={e} className="capitalize">
                    {formatEstado(e)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full" disabled={loading} onClick={() => generar(tipo, estado)}>
              <Play className="h-4 w-4" /> {loading ? "Generando…" : "Generar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tipos.map((t) => (
          <Card
            key={t.id}
            role="button"
            tabIndex={0}
            onClick={() => cambiarTipo(t.id)}
            onKeyDown={(e) => e.key === "Enter" && cambiarTipo(t.id)}
            className={`cursor-pointer border-border shadow-card transition-shadow hover:shadow-panel ${
              tipo === t.id ? "ring-2 ring-primary" : ""
            }`}
          >
            <CardContent className="flex items-start gap-4 p-5">
              <div className="bg-gradient-primary grid h-11 w-11 shrink-0 place-items-center rounded-xl text-primary-foreground">
                <t.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium">{t.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.detalle}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Pacientes nuevos vs. recurrentes</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {graficos.loading ? (
              <p className="py-24 text-center text-sm text-muted-foreground">Cargando…</p>
            ) : datosPacientes.length === 0 ? (
              <p className="py-24 text-center text-sm text-muted-foreground">Sin datos para graficar</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={datosPacientes}>
                  <defs>
                    <linearGradient id="gNuevos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} />
                  <RTooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="recurrentes"
                    stackId="1"
                    stroke="var(--chart-3)"
                    fill="url(#gRec)"
                    name="Recurrentes"
                  />
                  <Area
                    type="monotone"
                    dataKey="nuevos"
                    stackId="1"
                    stroke="var(--chart-1)"
                    fill="url(#gNuevos)"
                    name="Nuevos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Carga de trabajo por odontólogo</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {graficos.loading ? (
              <p className="py-24 text-center text-sm text-muted-foreground">Cargando…</p>
            ) : datosCarga.length === 0 ? (
              <p className="py-24 text-center text-sm text-muted-foreground">Sin datos para graficar</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosCarga} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis type="category" dataKey="nombre" stroke="var(--muted-foreground)" fontSize={11} width={92} />
                  <RTooltip />
                  <Legend />
                  <Bar dataKey="citas" name="Citas" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
                  <Bar dataKey="horas" name="Horas" fill="var(--chart-4)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden border-border p-0 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <h3 className="text-sm font-semibold">Vista previa del reporte</h3>
            <p className="text-xs text-muted-foreground">
              {tituloReporte} · {loading ? "cargando…" : `${preview.rows.length} registros`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loading || preview.rows.length === 0}
              onClick={() => {
                // Sin endpoint de PDF en el back: se usa el diálogo de impresión ("Guardar como PDF").
                const ok = printTable(
                  `Reporte de ${tituloReporte.toLowerCase()}`,
                  preview.columns,
                  preview.rows,
                  `${preview.rows.length} registros`,
                );
                if (!ok) toast.error("Permita las ventanas emergentes para generar el PDF");
              }}
            >
              <FileDown className="h-4 w-4" /> PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading || preview.rows.length === 0}
              onClick={() => {
                exportarCsv(`reporte-${reporte.tipo}.csv`, preview.columns, preview.rows);
                toast.success("Reporte exportado (CSV compatible con Excel)");
              }}
            >
              <FileDown className="h-4 w-4" /> Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading || preview.rows.length === 0}
              onClick={() => {
                const ok = printTable(
                  `Reporte de ${tituloReporte.toLowerCase()}`,
                  preview.columns,
                  preview.rows,
                  `${preview.rows.length} registros`,
                );
                if (!ok) toast.error("Permita las ventanas emergentes para imprimir");
              }}
            >
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
          </div>
        </div>
        <div className="max-h-[420px] overflow-x-auto overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                {preview.columns.map((c) => (
                  <TableHead key={c}>{c}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={preview.columns.length} className="py-10 text-center text-muted-foreground">
                    Cargando reporte…
                  </TableCell>
                </TableRow>
              ) : preview.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={preview.columns.length} className="py-10 text-center text-muted-foreground">
                    {error ?? "No hay registros para los parámetros seleccionados"}
                  </TableCell>
                </TableRow>
              ) : (
                preview.rows.map((r, i) => (
                  <TableRow key={i} className={i % 2 ? "bg-muted/25" : undefined}>
                    {r.map((cell, j) => (
                      <TableCell key={j} className={j === 0 ? "font-medium" : "text-muted-foreground"}>
                        {j === preview.estadoIndex ? <StatusBadge estado={cell as never} /> : cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}
