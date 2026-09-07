import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, CalendarDays, List, ChevronLeft, ChevronRight, CircleCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataToolbar } from "@/components/common/DataToolbar";
import { TablePagination } from "@/components/common/TablePagination";
import { RowActions } from "@/components/common/RowActions";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { citas, odontologos, pacientes, procedimientos } from "@/lib/mock-data";
import { printRecord } from "@/lib/print";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/citas")({
  head: () => ({
    meta: [
      { title: "Agenda y Citas — ARCHES" },
      { name: "description", content: "Calendario y listado de citas odontológicas con control de estados." },
      { property: "og:title", content: "Agenda y Citas — ARCHES" },
      { property: "og:description", content: "Calendario y listado de citas odontológicas con control de estados." },
    ],
  }),
  component: Citas,
});

const dias = ["Lunes 03", "Martes 04", "Miércoles 05", "Jueves 06", "Viernes 07", "Sábado 08"];
const horas = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

const bloques: Record<string, { paciente: string; proc: string; estado: string }> = {
  "Lunes 03|08:00": { paciente: "J. Espinoza", proc: "Limpieza", estado: "atendida" },
  "Lunes 03|10:00": { paciente: "S. Roque", proc: "Prótesis", estado: "atendida" },
  "Martes 04|09:00": { paciente: "M. Bermúdez", proc: "Resina", estado: "atendida" },
  "Miércoles 05|13:00": { paciente: "K. Ortiz", proc: "Valoración", estado: "cancelada" },
  "Jueves 06|11:00": { paciente: "L. Aguirre", proc: "Blanqueamiento", estado: "confirmada" },
  "Viernes 07|08:00": { paciente: "J. Espinoza", proc: "Limpieza", estado: "confirmada" },
  "Viernes 07|09:00": { paciente: "M. Bermúdez", proc: "Resina", estado: "programada" },
  "Viernes 07|10:00": { paciente: "Á. Munguía", proc: "Endodoncia", estado: "atendida" },
  "Sábado 08|09:00": { paciente: "N. Pavón", proc: "Extracción", estado: "programada" },
};

const colorEstado: Record<string, string> = {
  programada: "bg-info-soft border-primary/40 text-primary-dark",
  confirmada: "bg-success-soft border-success/40 text-success",
  cancelada: "bg-danger-soft border-destructive/40 text-destructive line-through",
  atendida: "bg-primary text-primary-foreground border-primary",
};

function Citas() {
  const [nueva, setNueva] = useState(false);

  return (
    <>
      <PageHeader
        title="Agenda y Citas"
        description="Programación y seguimiento de las citas de la clínica."
        breadcrumbs={[{ label: "Agenda y Citas" }]}
        actions={
          <Button onClick={() => setNueva(true)}>
            <Plus className="h-4 w-4" /> Nueva cita
          </Button>
        }
      />

      <Tabs defaultValue="calendario">
        <TabsList>
          <TabsTrigger value="calendario">
            <CalendarDays className="h-4 w-4" /> Calendario
          </TabsTrigger>
          <TabsTrigger value="lista">
            <List className="h-4 w-4" /> Listado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendario" className="mt-4">
          <Card className="overflow-hidden border-border p-0 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold">03 – 08 de agosto, 2026</span>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select defaultValue="todos">
                  <SelectTrigger className="w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los odontólogos</SelectItem>
                    {odontologos.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex rounded-lg border border-border p-0.5">
                  {["Día", "Semana", "Mes"].map((v, i) => (
                    <button
                      key={v}
                      className={cn(
                        "rounded-md px-3 py-1 text-sm",
                        i === 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto p-4">
              <div className="min-w-[820px]">
                <div className="grid grid-cols-[70px_repeat(6,minmax(0,1fr))] gap-1.5">
                  <div />
                  {dias.map((d) => (
                    <div key={d} className="rounded-lg bg-primary-soft py-2 text-center text-xs font-semibold text-primary-dark">
                      {d}
                    </div>
                  ))}
                  {horas.map((h) => (
                    <div key={h} className="contents">
                      <div className="py-3 text-right text-xs text-muted-foreground">{h}</div>
                      {dias.map((d) => {
                        const b = bloques[`${d}|${h}`];
                        return (
                          <div key={d + h} className="min-h-14 rounded-lg border border-dashed border-border p-1">
                            {b && (
                              <button
                                onClick={() => toast.info(`Cita: ${b.paciente} — ${b.proc}`)}
                                className={cn(
                                  "h-full w-full rounded-md border px-2 py-1.5 text-left text-[11px] leading-tight transition-transform hover:scale-[1.02]",
                                  colorEstado[b.estado],
                                )}
                              >
                                <span className="block font-semibold">{b.paciente}</span>
                                <span className="block opacity-80">{b.proc}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-border p-4 text-xs text-muted-foreground">
              <span className="font-medium">Estados:</span>
              {["programada", "confirmada", "atendida", "cancelada"].map((e) => (
                <span key={e} className="flex items-center gap-1.5 capitalize">
                  <span className={cn("h-3 w-3 rounded border", colorEstado[e])} /> {e}
                </span>
              ))}
              <span className="ml-auto">Arrastre un bloque para reprogramar la cita.</span>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="lista" className="mt-4">
          <Card className="overflow-hidden border-border p-0 shadow-card">
            <DataToolbar
              placeholder="Buscar por paciente..."
              exportName="Agenda de citas"
              exportColumns={["Código", "Paciente", "Procedimiento", "Fecha", "Hora", "Odontólogo", "Estado"]}
              exportRows={citas.map((c) => [c.id, c.paciente, c.procedimiento, c.fecha, c.hora, c.odontologo, c.estado])}
            >

              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Odontólogo" />
                </SelectTrigger>
                <SelectContent>
                  {odontologos.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {["programada", "confirmada", "atendida", "cancelada"].map((e) => (
                    <SelectItem key={e} value={e} className="capitalize">
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" className="w-40" />
            </DataToolbar>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/60">
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Fecha / Hora</TableHead>
                    <TableHead>Procedimiento</TableHead>
                    <TableHead>Odontólogo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {citas.map((c, i) => (
                    <TableRow key={c.id} className={i % 2 ? "bg-muted/25" : undefined}>
                      <TableCell className="text-muted-foreground">{c.id}</TableCell>
                      <TableCell className="font-medium">{c.paciente}</TableCell>
                      <TableCell>
                        {c.fecha}
                        <span className="block text-xs text-muted-foreground">
                          {c.hora} · {c.duracion}
                        </span>
                      </TableCell>
                      <TableCell>{c.procedimiento}</TableCell>
                      <TableCell className="text-muted-foreground">{c.odontologo}</TableCell>
                      <TableCell>
                        <StatusBadge estado={c.estado} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-success"
                            title="Marcar como atendida"
                            onClick={() => toast.success("Cita marcada como atendida")}
                          >
                            <CircleCheck className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Cancelar cita"
                            onClick={() => toast.warning("Indique el motivo de cancelación")}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <RowActions
                            label={`cita ${c.id}`}
                            onEdit={() => setNueva(true)}
                            onPrint={() =>
                              printRecord(`Cita ${c.id}`, [
                                { label: "Paciente", value: c.paciente },
                                { label: "Procedimiento", value: c.procedimiento },
                                { label: "Fecha", value: c.fecha },
                                { label: "Hora", value: `${c.hora} (${c.duracion})` },
                                { label: "Odontólogo", value: c.odontologo },
                                { label: "Estado", value: c.estado },
                                { label: "Notas", value: c.notas, full: true },
                              ])
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <TablePagination total={citas.length} />
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={nueva} onOpenChange={setNueva}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva cita</DialogTitle>
            <DialogDescription>Los campos con * son obligatorios.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Paciente <span className="text-destructive">*</span>
              </Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Buscar paciente..." />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Odontólogo <span className="text-destructive">*</span>
              </Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione odontólogo" />
                </SelectTrigger>
                <SelectContent>
                  {odontologos.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="flex items-center gap-1.5 text-xs text-success">
                <span className="h-2 w-2 rounded-full bg-success" /> Disponible el 08/08/2026 de 08:00 a 12:00
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Fecha <span className="text-destructive">*</span>
                </Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>
                  Hora <span className="text-destructive">*</span>
                </Label>
                <Input type="time" />
              </div>
              <div className="space-y-2">
                <Label>Procedimiento</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    {procedimientos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duración estimada</Label>
                <Input placeholder="45 min" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea rows={3} placeholder="Observaciones para la cita" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNueva(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setNueva(false);
                toast.success("Cita agendada correctamente");
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
