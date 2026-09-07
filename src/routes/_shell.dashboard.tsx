import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Users, ClipboardList, DollarSign, Plus, ArrowRight } from "lucide-react";
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
import { citas, citasPorMes, estadosCitas, ingresosPorMes, procedimientosFrecuentes } from "@/lib/mock-data";

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

const kpis = [
  { label: "Citas de hoy", value: "12", detalle: "4 confirmadas · 2 atendidas", icon: CalendarDays },
  { label: "Pacientes activos", value: "486", detalle: "+8 este mes", icon: Users },
  { label: "Tratamientos en curso", value: "37", detalle: "9 con pago pendiente", icon: ClipboardList },
  { label: "Ingresos del mes", value: "C$ 142,300", detalle: "Agosto 2026", icon: DollarSign },
];

function Dashboard() {
  return (
    <>
      <PageHeader
        title="Panel general"
        description="Resumen de la operación clínica del día."
        breadcrumbs={[{ label: "Panel general" }]}
        actions={
          <>
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="overflow-hidden border-border shadow-card">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="bg-gradient-primary grid h-11 w-11 shrink-0 place-items-center rounded-xl text-primary-foreground">
                <k.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{k.label}</p>
                <p className="mt-1 truncate text-2xl font-semibold">{k.value}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{k.detalle}</p>
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
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={citasPorMes}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickMargin={8} />
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
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Procedimientos más frecuentes</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={procedimientosFrecuentes} barCategoryGap="28%">
                <defs>
                  <linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="nombre" stroke="var(--muted-foreground)" fontSize={11} interval={0} angle={-20} height={54} textAnchor="end" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickMargin={8} />
                <RTooltip cursor={{ stroke: "var(--border)" }} contentStyle={tooltipStyle} labelStyle={labelStyle} />
                <Bar dataKey="total" name="Total" fill="url(#gBar)" radius={[8, 8, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="border-border shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ingresos vs. gastos mensuales (C$)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ingresosPorMes}>
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
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                <RTooltip cursor={{ stroke: "var(--border)" }} contentStyle={tooltipStyle} labelStyle={labelStyle} formatter={(v) => `C$ ${Number(v).toLocaleString("es-NI")}`} />
                <Legend iconType="circle" wrapperStyle={legendStyle} />
                <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="var(--chart-1)" strokeWidth={2} fill="url(#gIng)" />
                <Area type="monotone" dataKey="gastos" name="Gastos" stroke="var(--chart-4)" strokeWidth={2} fill="url(#gGas)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Distribución de citas por estado</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={estadosCitas} dataKey="total" nameKey="estado" innerRadius={54} outerRadius={88} paddingAngle={4} cornerRadius={6} stroke="var(--background)" strokeWidth={2}>
                  {estadosCitas.map((e) => (
                    <Cell key={e.estado} fill={e.color} />
                  ))}
                </Pie>
                <RTooltip cursor={{ stroke: "var(--border)" }} contentStyle={tooltipStyle} labelStyle={labelStyle} />
                <Legend iconType="circle" wrapperStyle={legendStyle} />
              </PieChart>
            </ResponsiveContainer>
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
          {citas.slice(0, 4).map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-border p-3 transition-colors hover:bg-muted/60"
            >
              <div className="w-16 shrink-0 text-center">
                <p className="text-sm font-semibold">{c.hora}</p>
                <p className="text-[11px] text-muted-foreground">{c.duracion}</p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.paciente}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.procedimiento} · {c.odontologo}
                </p>
              </div>
              <StatusBadge estado={c.estado} />
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
