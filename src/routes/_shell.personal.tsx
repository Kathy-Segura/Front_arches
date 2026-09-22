import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Clock} from "lucide-react";
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
import type { PersonalDetalleDTO, PersonalRequestDTO } from "@/types/personal";
import { listarPersonal, obtenerPersonal, crearPersonal, actualizarPersonal, desactivarPersonal } from "@/lib/api/personal";

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

const CARGOS = ["Odontólogo", "Administrativo"] as const;

const emptyForm: PersonalRequestDTO = {
  nombreCompleto: "",
  cargo: "",
  telefono: "",
  correo: "",
  horarioTexto: "",
  numeroLicencia: "",
  fechaIngreso: "",
  estado: "activo",
};

function Personal() {
  const [open, setOpen] = useState(false);
  const [detalle, setDetalle] = useState<PersonalDetalleDTO | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<PersonalRequestDTO>(emptyForm);
  const [guardando, setGuardando] = useState(false);

  const [filas, setFilas] = useState<PersonalDetalleDTO[]>([]);
  const [cargando, setCargando] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0); // 0-indexed, como el backend
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [cargoFiltro, setCargoFiltro] = useState<string | undefined>(undefined);

  const cargar = async () => {
    setCargando(true);
    try {
      const resultado = await listarPersonal({
        q: query,
        page,
        size: pageSize,
        ...(cargoFiltro ? { cargo: cargoFiltro } : {}),
      });
      setFilas(resultado.contenido);
      setTotal(resultado.totalElementos);
    } catch (error) {
      toast.error("No se pudo cargar el personal");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, cargoFiltro]);

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

  const abrirEdicion = (p: PersonalDetalleDTO) => {
    setEditandoId(p.idPersonal);
    setForm({
      nombreCompleto: p.nombreCompleto,
      cargo: p.cargo,
      telefono: p.telefono ?? "",
      correo: p.correo ?? "",
      horarioTexto: p.horarioTexto ?? "",
      numeroLicencia: p.numeroLicencia ?? "",
      fechaIngreso: p.fechaIngreso,
      estado: p.estado,
    });
    setOpen(true);
  };

  const verDetalle = async (id: number) => {
    try {
      const data = await obtenerPersonal(id);
      setDetalle(data);
    } catch (error) {
      toast.error("No se pudo cargar el detalle");
    }
  };

  const guardar = async () => {
    if (!form.nombreCompleto.trim() || !form.cargo || !form.fechaIngreso) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    setGuardando(true);
    try {
      if (editandoId) {
        await actualizarPersonal(editandoId, form);
        toast.success("Registro actualizado correctamente");
      } else {
        await crearPersonal(form);
        toast.success("Registro guardado correctamente");
      }
      setOpen(false);
      cargar();
    } catch (error) {
      toast.error("No se pudo guardar el registro");
    } finally {
      setGuardando(false);
    }
  };

  const desactivar = async (p: PersonalDetalleDTO) => {
    try {
      await desactivarPersonal(p.idPersonal);
      toast.success(`${p.nombreCompleto} fue dado de baja`);
      cargar();
    } catch (error) {
      toast.error("No se pudo dar de baja el registro");
    }
  };

  return (
    <>
      <PageHeader
        title="Personal"
        description="Odontólogos y personal administrativo de la clínica."
        breadcrumbs={[{ label: "Personal" }]}
        actions={
          <Button onClick={abrirNuevo}>
            <Plus className="h-4 w-4" /> Nuevo registro
          </Button>
        }
      />

      <Card className="overflow-hidden border-border p-0 shadow-card">
        {/* Se quitó `placeholder` de DataToolbar: esa prop es la que
            generaba el primer buscador (con ícono de lupa), redundante con
            el Input que ya se pasa como children. Se agregó `onClear` para
            que el enlace "Limpiar filtros" (ya integrado en DataToolbar)
            resetee los filtros reales del listado. NOTA: no tengo el código
            fuente de DataToolbar, así que asumí que su prop de callback se
            llama `onClear`; si el nombre real es otro, ajusta esa línea. */}
        <DataToolbar
          exportName="Personal de la clínica"
          exportColumns={["Nombre", "Cargo", "Teléfono", "Correo", "Estado", "Horario"]}
          exportRows={filas.map((p) => [p.nombreCompleto, p.cargo, p.telefono ?? "", p.correo ?? "", p.estado, p.horarioTexto ?? ""])}
          onClearFilters={() => {
            setQuery("");
            setCargoFiltro(undefined);
            setPage(0);
          }}
        >
          <Input
            placeholder="Buscar por nombres..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-64"
          />
          <Select
            value={cargoFiltro ?? "todos"}
            onValueChange={(value) => setCargoFiltro(value === "todos" ? undefined : value)}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los cargos</SelectItem>
              {CARGOS.map((c) => (
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
                <TableHead>Nombre</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!cargando && filas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No hay personal registrado con esos filtros.
                  </TableCell>
                </TableRow>
              )}
              {filas.map((p, i) => (
                <TableRow key={p.idPersonal} className={i % 2 ? "bg-muted/25" : undefined}>
                  <TableCell className="font-medium">{p.nombreCompleto}</TableCell>
                  <TableCell>{p.cargo}</TableCell>
                  <TableCell className="text-muted-foreground">{p.telefono}</TableCell>
                  <TableCell className="text-muted-foreground">{p.correo}</TableCell>
                  <TableCell>
                    <StatusBadge estado={p.estado} />
                  </TableCell>
                  <TableCell>
                    {/* onDelete es obligatorio si está presente (no admite
                        `undefined` explícito), así que se agrega con spread
                        solo cuando el registro está activo. */}
                    <RowActions
                      label={p.nombreCompleto}
                      onView={() => verDetalle(p.idPersonal)}
                      onEdit={() => abrirEdicion(p)}
                      {...(p.estado === "activo" ? { onDelete: () => desactivar(p) } : {})}
                      onPrint={() =>
                        printRecord(p.nombreCompleto, [
                          { label: "Código", value: String(p.idPersonal) },
                          { label: "Cargo", value: p.cargo },
                          { label: "Teléfono", value: p.telefono ?? "" },
                          { label: "Correo", value: p.correo ?? "" },
                          { label: "Estado", value: p.estado },
                          { label: "Horario", value: p.horarioTexto ?? "" },
                          { label: "Licencia", value: p.numeroLicencia ?? "" },
                        ])
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* TablePagination no admite pageSizeOptions; solo total, page,
            pageSize y los dos callbacks. */}
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

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editandoId ? "Editar registro" : "Registro de personal"}</SheetTitle>
            <SheetDescription>Los campos con * son obligatorios.</SheetDescription>
          </SheetHeader>
          <div className="space-y-6 px-4">
            <section className="space-y-4">
              <h3 className="border-b border-border pb-2 text-sm font-semibold text-primary-dark">Datos personales</h3>
              <div className="space-y-2">
                <Label>
                  Nombre completo <span className="text-destructive">*</span>
                </Label>
                <Input value={form.nombreCompleto} onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input placeholder="8888-0000" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Correo</Label>
                  <Input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
                </div>
              </div>
            </section>
            <section className="space-y-4">
              <h3 className="border-b border-border pb-2 text-sm font-semibold text-primary-dark">Datos laborales</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Cargo <span className="text-destructive">*</span>
                  </Label>
                  <Select value={form.cargo ?? ""} onValueChange={(value) => setForm({ ...form, cargo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                    <SelectContent>
                      {CARGOS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Fecha de ingreso <span className="text-destructive">*</span>
                  </Label>
                  <Input type="date" value={form.fechaIngreso} onChange={(e) => setForm({ ...form, fechaIngreso: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Horario de atención</Label>
                <Input placeholder="Lun–Vie 08:00–17:00" value={form.horarioTexto} onChange={(e) => setForm({ ...form, horarioTexto: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Número de licencia</Label>
                <Input value={form.numeroLicencia} onChange={(e) => setForm({ ...form, numeroLicencia: e.target.value })} />
              </div>
              {editandoId && (
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={form.estado ?? "activo"} onValueChange={(value) => setForm({ ...form, estado: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* Especialidad y documentos se quitaron por ahora: el back
                  todavía no tiene el catálogo de especialidades ni un
                  endpoint de carga de archivos. Se agregan cuando existan. */}
            </section>
          </div>
          <SheetFooter className="flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={!!detalle} onOpenChange={(v) => !v && setDetalle(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{detalle?.nombreCompleto}</DialogTitle>
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
                    <p className="text-xs text-muted-foreground uppercase">Estado</p>
                    <p className="text-sm font-medium">
                      <StatusBadge estado={detalle.estado} />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Teléfono</p>
                    <p className="text-sm font-medium">{detalle.telefono}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Licencia</p>
                    <p className="text-sm font-medium">{detalle.numeroLicencia}</p>
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
                  <p className="text-sm text-muted-foreground">{detalle.horarioTexto}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
