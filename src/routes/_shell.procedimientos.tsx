import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataToolbar } from "@/components/common/DataToolbar";
import { TablePagination } from "@/components/common/TablePagination";
import { RowActions } from "@/components/common/RowActions";
import { DetailDialog } from "@/components/common/DetailDialog";
import { printRecord } from "@/lib/print";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { catalogos, procedimientos } from "@/lib/mock-data";

export const Route = createFileRoute("/_shell/procedimientos")({
  head: () => ({
    meta: [
      { title: "Catálogo de procedimientos — ARCHES" },
      { name: "description", content: "Catálogo de procedimientos odontológicos con costo base y duración." },
      { property: "og:title", content: "Catálogo de procedimientos — ARCHES" },
      { property: "og:description", content: "Catálogo de procedimientos odontológicos con costo base y duración." },
    ],
  }),
  component: Procedimientos,
});

function Procedimientos() {
  const [open, setOpen] = useState(false);
  const [detalle, setDetalle] = useState<(typeof procedimientos)[number] | null>(null);

  return (
    <>
      <PageHeader
        title="Catálogo de procedimientos"
        description="Procedimientos que ofrece la clínica, con su costo base y duración estimada."
        breadcrumbs={[{ label: "Procedimientos" }]}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Nuevo procedimiento
          </Button>
        }
      />

      <Card className="overflow-hidden border-border p-0 shadow-card">
        <DataToolbar
          placeholder="Buscar procedimiento..."
          exportName="Catálogo de procedimientos"
          exportColumns={["Código", "Procedimiento", "Categoría", "Costo base", "Duración"]}
          exportRows={procedimientos.map((p) => [
            p.id,
            p.nombre,
            p.categoria,
            `C$ ${p.costo.toLocaleString("es-NI")}`,
            p.duracion,
          ])}
        >

          <Select>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              {catalogos["Tipos de procedimiento"].map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DataToolbar>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Procedimiento</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Costo base</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {procedimientos.map((p, i) => (
                <TableRow key={p.id} className={i % 2 ? "bg-muted/25" : undefined}>
                  <TableCell className="text-muted-foreground">{p.id}</TableCell>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell>{p.categoria}</TableCell>
                  <TableCell>C$ {p.costo.toLocaleString("es-NI")}</TableCell>
                  <TableCell className="text-muted-foreground">{p.duracion}</TableCell>
                  <TableCell>
                    <RowActions
                      label={p.nombre}
                      onView={() => setDetalle(p)}
                      onEdit={() => setOpen(true)}
                      onPrint={() =>
                        printRecord(p.nombre, [
                          { label: "Código", value: p.id },
                          { label: "Categoría", value: p.categoria },
                          { label: "Costo base", value: `C$ ${p.costo.toLocaleString("es-NI")}` },
                          { label: "Duración", value: p.duracion },
                        ])
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <TablePagination total={procedimientos.length} />
      </Card>

      <DetailDialog
        open={!!detalle}
        onOpenChange={(v) => !v && setDetalle(null)}
        title={detalle?.nombre ?? ""}
        subtitle={detalle ? `Código ${detalle.id} · ${detalle.categoria}` : undefined}
        fields={
          detalle
            ? [
                { label: "Código", value: detalle.id },
                { label: "Categoría", value: detalle.categoria },
                { label: "Costo base", value: `C$ ${detalle.costo.toLocaleString("es-NI")}` },
                { label: "Duración estimada", value: detalle.duracion },
                { label: "Descripción", value: `Procedimiento de ${detalle.categoria.toLowerCase()} incluido en el catálogo institucional.`, full: true },
              ]
            : []
        }
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Procedimiento</SheetTitle>
            <SheetDescription>Los campos con * son obligatorios.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <div className="space-y-2">
              <Label>
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input placeholder="Ej. Resina compuesta" />
            </div>
            <div className="space-y-2">
              <Label>
                Categoría <span className="text-destructive">*</span>
              </Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {catalogos["Tipos de procedimiento"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Costo base (C$) <span className="text-destructive">*</span>
                </Label>
                <Input type="number" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Duración estimada</Label>
                <Input placeholder="60 min" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
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
                toast.success("Procedimiento guardado correctamente");
              }}
            >
              Guardar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
