import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataToolbar } from "@/components/common/DataToolbar";
import { TablePagination } from "@/components/common/TablePagination";
import { RowActions } from "@/components/common/RowActions";
import { printRecord } from "@/lib/print";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { odontologos, pacientes, procedimientos, tratamientos } from "@/lib/mock-data";

export const Route = createFileRoute("/_shell/tratamientos")({
  head: () => ({
    meta: [
      { title: "Tratamientos por paciente — ARCHES" },
      { name: "description", content: "Seguimiento de tratamientos asignados, avance clínico y estado de pago." },
      { property: "og:title", content: "Tratamientos por paciente — ARCHES" },
      { property: "og:description", content: "Seguimiento de tratamientos asignados, avance clínico y estado de pago." },
    ],
  }),
  component: Tratamientos,
});

const sesiones = [
  { fecha: "12/07/2026", nota: "Apertura cameral y drenaje.", odontologo: "Dr. Carlos Talavera" },
  { fecha: "28/07/2026", nota: "Instrumentación de conductos y medicación.", odontologo: "Dr. Carlos Talavera" },
];

function Tratamientos() {
  const [open, setOpen] = useState(false);
  const [detalle, setDetalle] = useState<(typeof tratamientos)[number] | null>(null);

  return (
    <>
      <PageHeader
        title="Tratamientos"
        description="Tratamientos asignados a pacientes y su avance."
        breadcrumbs={[{ label: "Tratamientos" }]}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Asignar tratamiento
          </Button>
        }
      />

      <Card className="overflow-hidden border-border p-0 shadow-card">
        <DataToolbar
          placeholder="Buscar por paciente..."
          exportName="Tratamientos"
          exportColumns={["Código", "Paciente", "Procedimiento", "Fecha", "Odontólogo", "Costo", "Avance", "Pago"]}
          exportRows={tratamientos.map((t) => [
            t.id,
            t.paciente,
            t.procedimiento,
            t.fecha,
            t.odontologo,
            `C$ ${t.costo.toLocaleString("es-NI")}`,
            t.avance,
            t.pago,
          ])}
        >

          <Select>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Avance" />
            </SelectTrigger>
            <SelectContent>
              {["pendiente", "en proceso", "completado"].map((e) => (
                <SelectItem key={e} value={e} className="capitalize">
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Estado de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pagado">Pagado</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
            </SelectContent>
          </Select>
        </DataToolbar>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Procedimiento</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Odontólogo</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Avance</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tratamientos.map((t, i) => (
                <TableRow key={t.id} className={i % 2 ? "bg-muted/25" : undefined}>
                  <TableCell className="text-muted-foreground">{t.id}</TableCell>
                  <TableCell className="font-medium">{t.paciente}</TableCell>
                  <TableCell>{t.procedimiento}</TableCell>
                  <TableCell className="text-muted-foreground">{t.fecha}</TableCell>
                  <TableCell className="text-muted-foreground">{t.odontologo}</TableCell>
                  <TableCell>C$ {t.costo.toLocaleString("es-NI")}</TableCell>
                  <TableCell>
                    <StatusBadge estado={t.avance} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge estado={t.pago} />
                  </TableCell>
                  <TableCell>
                    <RowActions
                      label={`tratamiento ${t.id}`}
                      onView={() => setDetalle(t)}
                      onEdit={() => setOpen(true)}
                      onPrint={() =>
                        printRecord(`Tratamiento ${t.id}`, [
                          { label: "Paciente", value: t.paciente },
                          { label: "Procedimiento", value: t.procedimiento },
                          { label: "Fecha", value: t.fecha },
                          { label: "Odontólogo", value: t.odontologo },
                          { label: "Costo", value: `C$ ${t.costo.toLocaleString("es-NI")}` },
                          { label: "Avance", value: t.avance },
                          { label: "Pago", value: t.pago },
                        ])
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <TablePagination total={tratamientos.length} />
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Asignar tratamiento</SheetTitle>
            <SheetDescription>Los campos con * son obligatorios.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
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
                Procedimiento <span className="text-destructive">*</span>
              </Label>
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
              <Label>
                Odontólogo <span className="text-destructive">*</span>
              </Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {odontologos.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Fecha programada</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Costo (C$)</Label>
                <Input type="number" defaultValue={950} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea rows={3} />
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                toast.success("Tratamiento asignado correctamente");
              }}
            >
              Guardar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={!!detalle} onOpenChange={(v) => !v && setDetalle(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del tratamiento {detalle?.id}</DialogTitle>
          </DialogHeader>
          {detalle && (
            <div className="space-y-5">
              <Card className="border-border shadow-none">
                <CardContent className="grid gap-4 py-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Paciente</p>
                    <p className="text-sm font-medium">{detalle.paciente}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Procedimiento</p>
                    <p className="text-sm font-medium">{detalle.procedimiento}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Odontólogo</p>
                    <p className="text-sm font-medium">{detalle.odontologo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Costo</p>
                    <p className="text-sm font-medium">C$ {detalle.costo.toLocaleString("es-NI")}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Historial de sesiones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sesiones.map((s) => (
                    <div key={s.fecha} className="rounded-lg bg-muted/60 p-3">
                      <p className="text-xs font-semibold">
                        {s.fecha} · {s.odontologo}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{s.nota}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
