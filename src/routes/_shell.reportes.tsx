import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { bitacora, cargaOdontologos, citas, pacientesNuevosVsRecurrentes, tratamientos } from "@/lib/mock-data";
import { printTable } from "@/lib/print";

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

type TipoReporte = "citas" | "procedimientos" | "actividad";

const tipos: { id: TipoReporte; label: string; icon: typeof CalendarDays; detalle: string }[] = [
  { id: "citas", label: "Citas", icon: CalendarDays, detalle: "Por periodo, odontólogo y estado" },
  { id: "procedimientos", label: "Procedimientos realizados", icon: Stethoscope, detalle: "Por categoría y monto" },
  { id: "actividad", label: "Actividad general", icon: Activity, detalle: "Bitácora de usuarios del sistema" },
];

function Reportes() {
  const [tipo, setTipo] = useState<TipoReporte>("citas");

  const preview = useMemo(() => {
    if (tipo === "citas") {
      return {
        columns: ["Paciente", "Procedimiento", "Fecha", "Hora", "Odontólogo", "Estado"],
        rows: citas.map((c) => [c.paciente, c.procedimiento, c.fecha, c.hora, c.odontologo, c.estado]),
        estadoIndex: 5,
      };
    }
    if (tipo === "procedimientos") {
      return {
        columns: ["Paciente", "Procedimiento", "Fecha", "Odontólogo", "Monto", "Avance"],
        rows: tratamientos.map((t) => [
          t.paciente,
          t.procedimiento,
          t.fecha,
          t.odontologo,
          `C$ ${t.costo.toLocaleString("es-NI")}`,
          t.avance,
        ]),
        estadoIndex: 5,
      };
    }
    return {
      columns: ["Usuario", "Acción", "Módulo", "Fecha", "IP"],
      rows: bitacora.map((b) => [b.usuario, b.accion, b.modulo, b.fecha, b.ip ?? "—"]),
      estadoIndex: -1,
    };
  }, [tipo]);

  const tituloReporte = tipos.find((t) => t.id === tipo)!.label;

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
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoReporte)}>
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
            <Input type="date" />
          </div>
          <div className="space-y-2">
            <Label>Hasta</Label>
            <Input type="date" />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                {["pendiente", "en proceso", "completado"].map((e) => (
                  <SelectItem key={e} value={e} className="capitalize">
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={() => toast.success("Reporte generado correctamente")}>
              <Play className="h-4 w-4" /> Generar
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
            onClick={() => setTipo(t.id)}
            onKeyDown={(e) => e.key === "Enter" && setTipo(t.id)}
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
                <Button
                  variant="link"
                  className="mt-1 h-auto p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTipo(t.id);
                    toast.success(`Reporte de ${t.label.toLowerCase()} generado`);
                  }}
                >
                  Generar reporte
                </Button>
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
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pacientesNuevosVsRecurrentes}>
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
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
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
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Carga de trabajo por odontólogo</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cargaOdontologos} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis type="category" dataKey="nombre" stroke="var(--muted-foreground)" fontSize={11} width={92} />
                <RTooltip />
                <Legend />
                <Bar dataKey="citas" name="Citas" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
                <Bar dataKey="horas" name="Horas" fill="var(--chart-4)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden border-border p-0 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <h3 className="text-sm font-semibold">Vista previa del reporte</h3>
            <p className="text-xs text-muted-foreground">
              {tituloReporte} · {preview.rows.length} registros
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.success("Reporte exportado a PDF")}>
              <FileDown className="h-4 w-4" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.success("Reporte exportado a Excel")}>
              <FileDown className="h-4 w-4" /> Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
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
              {preview.rows.map((r, i) => (
                <TableRow key={i} className={i % 2 ? "bg-muted/25" : undefined}>
                  {r.map((cell, j) => (
                    <TableCell key={j} className={j === 0 ? "font-medium" : "text-muted-foreground"}>
                      {j === preview.estadoIndex ? <StatusBadge estado={String(cell) as never} /> : cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}
