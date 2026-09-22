import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { StatusBadge } from "@/components/common/StatusBadge";
import type { ProcedimientoDetalleDTO, ProcedimientoRequestDTO } from "@/types/procedimiento";
import {
  buscarProcedimientos,
  obtenerProcedimiento,
  crearProcedimiento,
  actualizarProcedimiento,
  desactivarProcedimiento,
} from "@/lib/api/procedimientos";
import { catalogos } from "@/lib/mock-data";

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

const emptyForm: ProcedimientoRequestDTO = {
  nombreProcedimiento: "",
  categoria: "",
  duracionMinutos: 30,
  precio: 0,
  descripcion: "",
};

function Procedimientos() {
  const [open, setOpen] = useState(false);
  const [detalle, setDetalle] = useState<ProcedimientoDetalleDTO | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<ProcedimientoRequestDTO>(emptyForm);
  const [guardando, setGuardando] = useState(false);

  const [filas, setFilas] = useState<ProcedimientoDetalleDTO[]>([]);
  const [cargando, setCargando] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0); // 0-indexed, como el backend
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | undefined>(undefined);

  const cargar = async () => {
    setCargando(true);
    try {
      const resultado = await buscarProcedimientos({
        q: query,
        page,
        size: pageSize,
        ...(categoriaFiltro ? { categoria: categoriaFiltro } : {}),
      });
      setFilas(resultado.contenido);
      setTotal(resultado.totalElementos);
    } catch (error) {
      toast.error("No se pudo cargar el catálogo de procedimientos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, categoriaFiltro]);

  // Búsqueda con pequeño debounce para no disparar una petición por cada tecla
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(0);
      cargar();
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const abrirNuevo = () => {
    setEditandoId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  // Usa los datos que ya están en la fila (vienen completos del listado),
  // sin ida y vuelta extra al backend.
  const abrirEdicion = (p: ProcedimientoDetalleDTO) => {
    setEditandoId(p.idProcedimiento);
    setForm({
      nombreProcedimiento: p.nombreProcedimiento,
      categoria: p.categoria,
      duracionMinutos: p.duracionMinutos,
      precio: p.precio,
      descripcion: p.descripcion ?? "",
    });
    setOpen(true);
  };

  const verDetalle = async (id: number) => {
    try {
      const p = await obtenerProcedimiento(id);
      setDetalle(p);
    } catch (error) {
      toast.error("No se pudo obtener el procedimiento");
    }
  };

  const guardar = async () => {
    if (!form.nombreProcedimiento.trim() || !form.categoria || !form.duracionMinutos || !form.precio) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    setGuardando(true);
    try {
      if (editandoId != null) {
        await actualizarProcedimiento(editandoId, form);
        toast.success("Procedimiento actualizado correctamente");
      } else {
        await crearProcedimiento(form);
        toast.success("Procedimiento guardado correctamente");
      }
      setOpen(false);
      cargar();
    } catch (error) {
      toast.error("No se pudo guardar el procedimiento");
    } finally {
      setGuardando(false);
    }
  };

  const desactivar = async (p: ProcedimientoDetalleDTO) => {
    try {
      await desactivarProcedimiento(p.idProcedimiento);
      toast.success("Procedimiento desactivado");
      cargar();
    } catch (error) {
      toast.error("No se pudo desactivar el procedimiento");
    }
  };

  return (
    <>
      <PageHeader
        title="Catálogo de procedimientos"
        description="Procedimientos que ofrece la clínica, con su costo base y duración estimada."
        breadcrumbs={[{ label: "Procedimientos" }]}
        actions={
          <Button onClick={abrirNuevo}>
            <Plus className="h-4 w-4" /> Nuevo procedimiento
          </Button>
        }
      />

      <Card className="overflow-hidden border-border p-0 shadow-card">
        {/* Igual que en Personal: sin `placeholder` en DataToolbar (evita el
            buscador redundante propio del componente), buscador y filtro
            como children, y `onClear` para el enlace "Limpiar filtros" que
            ya trae DataToolbar. NOTA: asumí que esa prop se llama `onClear`;
            ajústala si el nombre real es otro. */}
        <DataToolbar
          exportName="Catálogo de procedimientos"
          exportColumns={["Código", "Procedimiento", "Categoría", "Costo base", "Duración"]}
          exportRows={filas.map((p) => [
            String(p.idProcedimiento),
            p.nombreProcedimiento,
            p.categoria,
            `C$ ${p.precio.toLocaleString("es-NI")}`,
            `${p.duracionMinutos} min`,
          ])}
          onClearFilters={() => {
            setQuery("");
            setCategoriaFiltro(undefined);
            setPage(0);
          }}
        >
          <Input
            placeholder="Buscar procedimiento..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-64"
          />
          <Select
            value={categoriaFiltro ?? "todas"}
            onValueChange={(value) => setCategoriaFiltro(value === "todas" ? undefined : value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
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
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!cargando && filas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No hay procedimientos registrados con esos filtros.
                  </TableCell>
                </TableRow>
              )}
              {filas.map((p, i) => (
                <TableRow key={p.idProcedimiento} className={i % 2 ? "bg-muted/25" : undefined}>
                  <TableCell className="text-muted-foreground">{p.idProcedimiento}</TableCell>
                  <TableCell className="font-medium">{p.nombreProcedimiento}</TableCell>
                  <TableCell>{p.categoria}</TableCell>
                  <TableCell>C$ {p.precio.toLocaleString("es-NI")}</TableCell>
                  <TableCell className="text-muted-foreground">{p.duracionMinutos} min</TableCell>
                  <TableCell>
                    <StatusBadge estado={p.estado} />
                  </TableCell>
                  <TableCell>
                    {/* onDelete no admite `undefined` explícito (mismo caso
                        que en Personal): se agrega con spread solo cuando
                        el procedimiento sigue activo. */}
                    <RowActions
                      label={p.nombreProcedimiento}
                      onView={() => verDetalle(p.idProcedimiento)}
                      onEdit={() => abrirEdicion(p)}
                      {...(p.estado === "activo" ? { onDelete: () => desactivar(p) } : {})}
                      onPrint={() =>
                        printRecord(p.nombreProcedimiento, [
                          { label: "Código", value: String(p.idProcedimiento) },
                          { label: "Categoría", value: p.categoria },
                          { label: "Costo base", value: `C$ ${p.precio.toLocaleString("es-NI")}` },
                          { label: "Duración", value: `${p.duracionMinutos} min` },
                          { label: "Estado", value: p.estado },
                        ])
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* Igual que en Personal: TablePagination no admite pageSizeOptions. */}
        <TablePagination
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size: number) => {
            setPageSize(size);
            setPage(0);
          }}
        />
      </Card>

      <DetailDialog
        open={!!detalle}
        onOpenChange={(v) => !v && setDetalle(null)}
        title={detalle?.nombreProcedimiento ?? ""}
        subtitle={detalle ? `Código ${detalle.idProcedimiento} · ${detalle.categoria}` : undefined}
        fields={
          detalle
            ? [
                { label: "Código", value: String(detalle.idProcedimiento) },
                { label: "Categoría", value: detalle.categoria },
                { label: "Costo base", value: `C$ ${detalle.precio.toLocaleString("es-NI")}` },
                { label: "Duración estimada", value: `${detalle.duracionMinutos} min` },
                { label: "Estado", value: detalle.estado },
                { label: "Descripción", value: detalle.descripcion || "Sin descripción registrada.", full: true },
              ]
            : []
        }
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editandoId != null ? "Editar procedimiento" : "Nuevo procedimiento"}</SheetTitle>
            <SheetDescription>Los campos con * son obligatorios.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <div className="space-y-2">
              <Label>
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ej. Resina compuesta"
                value={form.nombreProcedimiento}
                onChange={(e) => setForm({ ...form, nombreProcedimiento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Categoría <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.categoria ?? ""}
                onValueChange={(value) => setForm({ ...form, categoria: value })}
              >
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
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.precio || ""}
                  onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Duración estimada (min) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="60"
                  value={form.duracionMinutos || ""}
                  onChange={(e) => setForm({ ...form, duracionMinutos: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                rows={3}
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={guardando}>
              Guardar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
