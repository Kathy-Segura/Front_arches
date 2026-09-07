import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Clock } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { catalogos, personal } from "@/lib/mock-data";

export const Route = createFileRoute("/_shell/personal")({
  head: () => ({
    meta: [
      { title: "Personal de la clínica — ARCHES" },
      { name: "description", content: "Registro del personal odontológico y administrativo, horarios y documentos." },
      { property: "og:title", content: "Personal de la clínica — ARCHES" },
      { property: "og:description", content: "Registro del personal odontológico y administrativo y sus horarios." },
    ],
  }),
  component: Personal,
});

function Personal() {
  const [open, setOpen] = useState(false);
  const [detalle, setDetalle] = useState<(typeof personal)[number] | null>(null);

  return (
    <>
      <PageHeader
        title="Personal"
        description="Odontólogos y personal administrativo de la clínica."
        breadcrumbs={[{ label: "Personal" }]}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Nuevo registro
          </Button>
        }
      />

      <Card className="overflow-hidden border-border p-0 shadow-card">
        <DataToolbar
          placeholder="Buscar por nombre..."
          exportName="Personal de la clínica"
          exportColumns={["Nombre", "Cargo", "Especialidad", "Teléfono", "Correo", "Estado", "Horario"]}
          exportRows={personal.map((p) => [p.nombre, p.cargo, p.especialidad, p.telefono, p.correo, p.estado, p.horario])}
        >

          <Select>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Odontólogo">Odontólogo</SelectItem>
              <SelectItem value="Administrativo">Administrativo</SelectItem>
            </SelectContent>
          </Select>
        </DataToolbar>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personal.map((p, i) => (
                <TableRow key={p.id} className={i % 2 ? "bg-muted/25" : undefined}>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell>{p.cargo}</TableCell>
                  <TableCell className="text-muted-foreground">{p.especialidad}</TableCell>
                  <TableCell className="text-muted-foreground">{p.telefono}</TableCell>
                  <TableCell className="text-muted-foreground">{p.correo}</TableCell>
                  <TableCell>
                    <StatusBadge estado={p.estado} />
                  </TableCell>
                  <TableCell>
                    <RowActions
                      label={p.nombre}
                      onView={() => setDetalle(p)}
                      onEdit={() => setOpen(true)}
                      onPrint={() =>
                        printRecord(p.nombre, [
                          { label: "Código", value: p.id },
                          { label: "Cargo", value: p.cargo },
                          { label: "Especialidad", value: p.especialidad },
                          { label: "Teléfono", value: p.telefono },
                          { label: "Correo", value: p.correo },
                          { label: "Estado", value: p.estado },
                          { label: "Horario", value: p.horario },
                          { label: "Licencia", value: p.licencia },
                        ])
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <TablePagination total={personal.length} />
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Registro de personal</SheetTitle>
            <SheetDescription>Los campos con * son obligatorios.</SheetDescription>
          </SheetHeader>
          <div className="space-y-6 px-4">
            <section className="space-y-4">
              <h3 className="border-b border-border pb-2 text-sm font-semibold text-primary-dark">Datos personales</h3>
              <div className="space-y-2">
                <Label>
                  Nombre completo <span className="text-destructive">*</span>
                </Label>
                <Input />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input placeholder="8888-0000" />
                </div>
                <div className="space-y-2">
                  <Label>Correo</Label>
                  <Input type="email" />
                </div>
              </div>
            </section>
            <section className="space-y-4">
              <h3 className="border-b border-border pb-2 text-sm font-semibold text-primary-dark">Datos laborales</h3>
              <div className="space-y-2">
                <Label>
                  Cargo <span className="text-destructive">*</span>
                </Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="odontologo">Odontólogo</SelectItem>
                    <SelectItem value="admin">Administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Especialidad</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogos.Especialidades.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Horario de atención</Label>
                <Input placeholder="Lun–Vie 08:00–17:00" />
              </div>
              <div className="space-y-2">
                <Label>Documentos (cédula profesional, licencias)</Label>
                <Input type="file" />
              </div>
            </section>
          </div>
          <SheetFooter className="flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                toast.success("Registro guardado correctamente");
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
            <DialogTitle>{detalle?.nombre}</DialogTitle>
          </DialogHeader>
          {detalle && (
            <div className="space-y-4">
              <Card className="border-border shadow-none">
                <CardContent className="grid gap-4 py-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Cargo</p>
                    <p className="text-sm font-medium">{detalle.cargo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Especialidad</p>
                    <p className="text-sm font-medium">{detalle.especialidad}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Teléfono</p>
                    <p className="text-sm font-medium">{detalle.telefono}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Licencia</p>
                    <p className="text-sm font-medium">{detalle.licencia}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" /> Horario de atención
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{detalle.horario}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
