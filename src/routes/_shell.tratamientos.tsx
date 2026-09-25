// src/routes/_shell/tratamientos.tsx

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import type { TratamientoDTO, TratamientoRequestDTO } from "@/types/tratamiento";
import {
  listarTratamientos,
  obtenerTratamiento,
  crearTratamiento,
  actualizarTratamiento,
  registrarSesion,
} from "@/lib/api/tratamientos";
import { listarPacientes } from "@/lib/api/pacientes";
import type { PacienteDTO } from "@/types/paciente";
import { listarProcedimientos } from "@/lib/api/procedimientos";
import type { ProcedimientoDTO } from "@/types/procedimiento";
import { listarOdontologos } from "@/lib/api/personal";
import type { PersonalDTO } from "@/types/personal";

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

const AVANCES = ["propuesto", "pendiente", "en_proceso", "completado"] as const;
const PAGOS = ["pendiente", "parcial", "pagado"] as const;

const emptyForm: TratamientoRequestDTO = {
  idPaciente: 0,
  idProcedimiento: 0,
  idPersonal: 0,
  fechaProgramada: "",
  costoTotal: 0,
  sesionesPlanificadas: 1,
  notas: "",
};

function Tratamientos() {
  // Catálogos de apoyo (una sola carga) para resolver nombre y poblar los Select
  const [pacientes, setPacientes] = useState<PacienteDTO[]>([]);
  const [procedimientos, setProcedimientos] = useState<ProcedimientoDTO[]>([]);
  const [odontologos, setOdontologos] = useState<PersonalDTO[]>([]);

  useEffect(() => {
    // listarPacientes es paginado (PageResponse<PacienteDTO>); pedimos un
    // tamaño amplio para poblar el selector. Si la clínica llega a tener
    // más de 200 pacientes activos, conviene un endpoint dedicado sin
    // paginar (ej. /api/pacientes/opciones) en vez de subir este número.
    listarPacientes({ size: 200 })
      .then((res) => setPacientes(res.content))
      .catch(() => toast.error("No se pudo cargar la lista de pacientes"));
    listarProcedimientos().then(setProcedimientos).catch(() => toast.error("No se pudo cargar la lista de procedimientos"));
    listarOdontologos().then(setOdontologos).catch(() => toast.error("No se pudo cargar la lista de odontólogos"));
  }, []);

  const nombrePaciente = useMemo(() => {
    const mapa = new Map(pacientes.map((p) => [p.idPaciente, p.nombreCompleto]));
    return (id: number) => mapa.get(id) ?? `Paciente #${id}`;
  }, [pacientes]);

  const nombreProcedimiento = useMemo(() => {
    const mapa = new Map(procedimientos.map((p) => [p.idProcedimiento, p.nombreProcedimiento]));
    return (id: number) => mapa.get(id) ?? `Procedimiento #${id}`;
  }, [procedimientos]);

  // Listado
  const [filas, setFilas] = useState<TratamientoDTO[]>([]);
  const [cargando, setCargando] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [idPacienteFiltro, setIdPacienteFiltro] = useState<number | undefined>();
  const [avanceFiltro, setAvanceFiltro] = useState<string | undefined>();
  const [pagoFiltro, setPagoFiltro] = useState<string | undefined>();

  const cargar = async () => {
    setCargando(true);
    try {
      const resultado = await listarTratamientos({
        idPaciente: idPacienteFiltro,
        estadoAvance: avanceFiltro,
        estadoPago: pagoFiltro,
        page,
        size: pageSize,
      });
      setFilas(resultado.contenido);
      setTotal(resultado.totalElementos);
    } catch (error) {
      toast.error("No se pudo cargar los tratamientos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, idPacienteFiltro, avanceFiltro, pagoFiltro]);

  // Formulario (asignar / editar)
  const [open, setOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<TratamientoRequestDTO>(emptyForm);
  const [guardando, setGuardando] = useState(false);

  const abrirNuevo = () => {
    setEditandoId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const abrirEdicion = (t: TratamientoDTO) => {
    setEditandoId(t.idTratamiento);
    setForm({
      idPaciente: t.idPaciente,
      idProcedimiento: t.idProcedimiento,
      idPersonal: t.idPersonal,
      fechaProgramada: t.fechaProgramada ?? "",
      costoTotal: t.costoTotal,
      sesionesPlanificadas: t.sesionesPlanificadas,
      notas: t.notas ?? "",
      estadoAvance: t.estadoAvance,
      estadoPago: t.estadoPago,
    });
    setOpen(true);
  };

  const guardar = async () => {
    if (!form.idPaciente || !form.idProcedimiento || !form.idPersonal || !form.costoTotal) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    setGuardando(true);
    try {
      if (editandoId) {
        await actualizarTratamiento(editandoId, form);
        toast.success("Tratamiento actualizado correctamente");
      } else {
        await crearTratamiento(form);
        toast.success("Tratamiento asignado correctamente");
      }
      setOpen(false);
      cargar();
    } catch (error) {
      toast.error("No se pudo guardar el tratamiento");
    } finally {
      setGuardando(false);
    }
  };

  // Detalle + registrar sesión de avance
  const [detalle, setDetalle] = useState<TratamientoDTO | null>(null);
  const [nuevaSesion, setNuevaSesion] = useState("");
  const [guardandoSesion, setGuardandoSesion] = useState(false);

  const verDetalle = async (id: number) => {
    try {
      const data = await obtenerTratamiento(id);
      setDetalle(data);
    } catch (error) {
      toast.error("No se pudo cargar el detalle");
    }
  };

  const guardarSesion = async () => {
    if (!detalle || !nuevaSesion.trim()) return;
    setGuardandoSesion(true);
    try {
      const actualizado = await registrarSesion(detalle.idTratamiento, { descripcionAvance: nuevaSesion.trim() });
      setDetalle(actualizado);
      setNuevaSesion("");
      cargar(); // el avance pudo haber cambiado por el trigger de la BD
      toast.success("Sesión registrada");
    } catch (error) {
      toast.error("No se pudo registrar la sesión");
    } finally {
      setGuardandoSesion(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Tratamientos"
        description="Tratamientos asignados a pacientes y su avance."
        breadcrumbs={[{ label: "Tratamientos" }]}
        actions={
          <Button onClick={abrirNuevo}>
            <Plus className="h-4 w-4" /> Asignar tratamiento
          </Button>
        }
      />

      <Card className="overflow-hidden border-border p-0 shadow-card">
        {/* NOTA: sin buscador de texto libre por paciente (requeriría un
            JOIN a clinica.pacientes cuyo esquema no tengo). En su lugar,
            filtro por paciente con un Select cargado de /api/pacientes. */}
        <DataToolbar
          placeholder="Filtrar por paciente, avance o pago"
          exportName="Tratamientos"
          exportColumns={["Código", "Paciente", "Procedimiento", "Fecha", "Odontólogo", "Costo", "Avance", "Pago"]}
          exportRows={filas.map((t) => [
            t.idTratamiento,
            nombrePaciente(t.idPaciente),
            nombreProcedimiento(t.idProcedimiento),
            t.fechaProgramada ?? "",
            t.personalNombre ?? "",
            `C$ ${Number(t.costoTotal).toLocaleString("es-NI")}`,
            t.estadoAvance,
            t.estadoPago,
          ])}
        >
          <Select
            value={idPacienteFiltro != null ? String(idPacienteFiltro) : "todos"}
            onValueChange={(value) => setIdPacienteFiltro(value === "todos" ? undefined : Number(value))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Paciente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los pacientes</SelectItem>
              {pacientes.map((p) => (
                <SelectItem key={p.idPaciente} value={String(p.idPaciente)}>
                  {p.nombreCompleto}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={avanceFiltro ?? "todos"} onValueChange={(value) => setAvanceFiltro(value === "todos" ? undefined : value)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Avance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {AVANCES.map((e) => (
                <SelectItem key={e} value={e} className="capitalize">
                  {e.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={pagoFiltro ?? "todos"} onValueChange={(value) => setPagoFiltro(value === "todos" ? undefined : value)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Estado de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {PAGOS.map((e) => (
                <SelectItem key={e} value={e} className="capitalize">
                  {e}
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
              {!cargando && filas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                    No hay tratamientos con esos filtros.
                  </TableCell>
                </TableRow>
              )}
              {filas.map((t, i) => (
                <TableRow key={t.idTratamiento} className={i % 2 ? "bg-muted/25" : undefined}>
                  <TableCell className="text-muted-foreground">{t.idTratamiento}</TableCell>
                  <TableCell className="font-medium">{nombrePaciente(t.idPaciente)}</TableCell>
                  <TableCell>{nombreProcedimiento(t.idProcedimiento)}</TableCell>
                  <TableCell className="text-muted-foreground">{t.fechaProgramada ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{t.personalNombre}</TableCell>
                  <TableCell>C$ {Number(t.costoTotal).toLocaleString("es-NI")}</TableCell>
                  <TableCell>
                    <StatusBadge estado={t.estadoAvance} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge estado={t.estadoPago} />
                  </TableCell>
                  <TableCell>
                    <RowActions
                      label={`tratamiento ${t.idTratamiento}`}
                      onView={() => verDetalle(t.idTratamiento)}
                      onEdit={() => abrirEdicion(t)}
                      onPrint={() =>
                        printRecord(`Tratamiento ${t.idTratamiento}`, [
                          { label: "Paciente", value: nombrePaciente(t.idPaciente) },
                          { label: "Procedimiento", value: nombreProcedimiento(t.idProcedimiento) },
                          { label: "Fecha", value: t.fechaProgramada ?? "" },
                          { label: "Odontólogo", value: t.personalNombre ?? "" },
                          { label: "Costo", value: `C$ ${Number(t.costoTotal).toLocaleString("es-NI")}` },
                          { label: "Avance", value: t.estadoAvance },
                          { label: "Pago", value: t.estadoPago },
                        ])
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* Ver NOTA de paginación en personal.tsx: props de TablePagination asumidas. */}
        <TablePagination
          total={total}
          page={page}
          pageSize={pageSize}
          pageSizeOptions={[10, 25, 50]}
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
            <SheetTitle>{editandoId ? "Editar tratamiento" : "Asignar tratamiento"}</SheetTitle>
            <SheetDescription>Los campos con * son obligatorios.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <div className="space-y-2">
              <Label>
                Paciente <span className="text-destructive">*</span>
              </Label>
              <Select value={form.idPaciente ? String(form.idPaciente) : ""} onValueChange={(value) => setForm({ ...form, idPaciente: Number(value) })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map((p) => (
                    <SelectItem key={p.idPaciente} value={String(p.idPaciente)}>
                      {p.nombreCompleto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Procedimiento <span className="text-destructive">*</span>
              </Label>
              <Select value={form.idProcedimiento ? String(form.idProcedimiento) : ""} onValueChange={(value) => setForm({ ...form, idProcedimiento: Number(value) })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {procedimientos.map((p) => (
                    <SelectItem key={p.idProcedimiento} value={String(p.idProcedimiento)}>
                      {p.nombreProcedimiento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Odontólogo <span className="text-destructive">*</span>
              </Label>
              <Select value={form.idPersonal ? String(form.idPersonal) : ""} onValueChange={(value) => setForm({ ...form, idPersonal: Number(value) })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {odontologos.map((o) => (
                    <SelectItem key={o.idPersonal} value={String(o.idPersonal)}>
                      {o.nombreCompleto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Fecha programada</Label>
                <Input type="date" value={form.fechaProgramada ?? ""} onChange={(e) => setForm({ ...form, fechaProgramada: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>
                  Costo (C$) <span className="text-destructive">*</span>
                </Label>
                <Input type="number" min="0" value={form.costoTotal} onChange={(e) => setForm({ ...form, costoTotal: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sesiones planificadas</Label>
              <Input
                type="number"
                min="1"
                value={form.sesionesPlanificadas ?? 1}
                onChange={(e) => setForm({ ...form, sesionesPlanificadas: Number(e.target.value) })}
              />
            </div>
            {editandoId && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Avance</Label>
                  <Select value={form.estadoAvance ?? ""} onValueChange={(value) => setForm({ ...form, estadoAvance: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVANCES.map((e) => (
                        <SelectItem key={e} value={e} className="capitalize">
                          {e.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pago</Label>
                  <Select value={form.estadoPago ?? ""} onValueChange={(value) => setForm({ ...form, estadoPago: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGOS.map((e) => (
                        <SelectItem key={e} value={e} className="capitalize">
                          {e}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea rows={3} value={form.notas ?? ""} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
            </div>
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
            <DialogTitle>Detalle del tratamiento {detalle?.idTratamiento}</DialogTitle>
          </DialogHeader>
          {detalle && (
            <div className="space-y-5">
              <Card className="border-border shadow-none">
                <CardContent className="grid gap-4 py-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Paciente</p>
                    <p className="text-sm font-medium">{nombrePaciente(detalle.idPaciente)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Procedimiento</p>
                    <p className="text-sm font-medium">{nombreProcedimiento(detalle.idProcedimiento)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Odontólogo</p>
                    <p className="text-sm font-medium">{detalle.personalNombre}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Costo</p>
                    <p className="text-sm font-medium">C$ {Number(detalle.costoTotal).toLocaleString("es-NI")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Avance</p>
                    <StatusBadge estado={detalle.estadoAvance} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Pago</p>
                    <StatusBadge estado={detalle.estadoPago} />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Historial de sesiones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(detalle.sesiones ?? []).length === 0 && <p className="text-sm text-muted-foreground">Sin sesiones registradas todavía.</p>}
                  {(detalle.sesiones ?? []).map((s) => (
                    <div key={s.idSesion} className="rounded-lg bg-muted/60 p-3">
                      <p className="text-xs font-semibold">{new Date(s.fechaSesion).toLocaleString("es-NI")}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{s.descripcionAvance}</p>
                    </div>
                  ))}
                  <div className="flex items-end gap-2 pt-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Registrar avance</Label>
                      <Textarea rows={2} value={nuevaSesion} onChange={(e) => setNuevaSesion(e.target.value)} placeholder="Descripción de lo realizado en esta sesión" />
                    </div>
                    <Button size="sm" onClick={guardarSesion} disabled={guardandoSesion || !nuevaSesion.trim()}>
                      {guardandoSesion ? "Guardando..." : "Agregar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}