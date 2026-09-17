import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  XCircle,
  Eye,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { printRecord } from "@/lib/print";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/http";
import {
  listarCitas,
  listarCitasCalendario,
  listarMotivosCancelacion,
  obtenerCita,
  crearCita,
  actualizarCita,
  marcarCitaAtendida,
  cancelarCita,
  eliminarCita,
} from "@/lib/api/citas";
import { listarOdontologos } from "@/lib/api/personal";
import { listarProcedimientos } from "@/lib/api/procedimientos";
import { listarPacientes } from "@/lib/api/pacientes";
import type { CitaDTO, CitaInput, MotivoCancelacionDTO, EstadoCita } from "@/types/cita";
import { OPCIONES_ESTADO_CITA, codigoCita, combinarFechaHora, separarFechaHora } from "@/types/cita";
import type { PersonalDTO } from "@/types/personal";
import type { ProcedimientoDTO } from "@/types/procedimiento";
import type { PacienteDTO } from "@/types/paciente";

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

// ---------------------------------------------------------------------------
// Helpers de fecha (sin dependencias externas)
// ---------------------------------------------------------------------------
const HORAS_CALENDARIO = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
const NOMBRES_DIA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const NOMBRES_MES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function lunesDeSemana(fecha: Date): Date {
  const d = new Date(fecha);
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function sumarDias(fecha: Date, n: number): Date {
  const d = new Date(fecha);
  d.setDate(d.getDate() + n);
  return d;
}

function formatISO(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatEtiquetaDia(fecha: Date): string {
  return `${NOMBRES_DIA[fecha.getDay()]} ${String(fecha.getDate()).padStart(2, "0")}`;
}

function formatRangoSemana(inicio: Date, fin: Date): string {
  return `${String(inicio.getDate()).padStart(2, "0")} – ${String(fin.getDate()).padStart(2, "0")} de ${NOMBRES_MES[fin.getMonth()]}, ${fin.getFullYear()}`;
}

function formatFechaLegible(iso: string): string {
  const { fecha } = separarFechaHora(iso);
  const [y = 0, m = 1, d = 1] = fecha.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${(NOMBRES_MES[m - 1] ?? "").slice(0, 3)} ${y}`;
}

const COLOR_ESTADO: Record<string, string> = {
  programada: "bg-info-soft border-primary/40 text-primary-dark",
  confirmada: "bg-success-soft border-success/40 text-success",
  cancelada: "bg-danger-soft border-destructive/40 text-destructive line-through",
  atendida: "bg-primary text-primary-foreground border-primary",
};

const FORM_INICIAL = {
  idPaciente: "",
  idPersonal: "",
  idProcedimiento: "",
  fecha: "",
  hora: "",
  duracionMinutos: "30",
  notas: "",
};

function Citas() {
  // ------------------------------------------------------------------------
  // Catálogos compartidos por calendario, listado y formulario
  // ------------------------------------------------------------------------
  const [odontologos, setOdontologos] = useState<PersonalDTO[]>([]);
  const [procedimientos, setProcedimientos] = useState<ProcedimientoDTO[]>([]);
  const [motivos, setMotivos] = useState<MotivoCancelacionDTO[]>([]);

  useEffect(() => {
    listarOdontologos().then(setOdontologos).catch(() => toast.error("No se pudo cargar el listado de odontólogos"));
    listarProcedimientos().then(setProcedimientos).catch(() => toast.error("No se pudo cargar el catálogo de procedimientos"));
    listarMotivosCancelacion().then(setMotivos).catch(() => toast.error("No se pudo cargar el catálogo de motivos de cancelación"));
  }, []);

  function nombreOdontologo(id: number) {
    return odontologos.find((o) => o.idPersonal === id)?.nombreCompleto ?? "—";
  }

  // ------------------------------------------------------------------------
  // Pestaña Calendario
  // ------------------------------------------------------------------------
  const [weekStart, setWeekStart] = useState<Date>(() => lunesDeSemana(new Date()));
  const [odontologoCalendario, setOdontologoCalendario] = useState<string>("");
  const [citasCalendario, setCitasCalendario] = useState<CitaDTO[]>([]);
  const [cargandoCalendario, setCargandoCalendario] = useState(false);

  const diasSemana = useMemo(() => Array.from({ length: 6 }, (_, i) => sumarDias(weekStart, i)), [weekStart]);
  const weekEnd = useMemo(() => sumarDias(weekStart, 5), [weekStart]);


  async function cargarCalendario() {
    setCargandoCalendario(true);
    try {
      const res = await listarCitasCalendario(
        formatISO(weekStart),
        formatISO(weekEnd),
        odontologoCalendario ? Number(odontologoCalendario) : undefined,
      );
      setCitasCalendario(res);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cargar el calendario de citas");
    } finally {
      setCargandoCalendario(false);
    }
  }

  useEffect(() => {
    cargarCalendario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, odontologoCalendario]);

  const bloquesCalendario = useMemo(() => {
    const mapa: Record<string, CitaDTO> = {};
    for (const cita of citasCalendario) {
      const { fecha, hora } = separarFechaHora(cita.fechaHora);
      const horaSlot = `${hora.slice(0, 2)}:00`;
      mapa[`${fecha}|${horaSlot}`] = cita;
    }
    return mapa;
  }, [citasCalendario]);

  // ------------------------------------------------------------------------
  // Pestaña Listado
  // ------------------------------------------------------------------------
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [odontologoFiltro, setOdontologoFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [data, setData] = useState<CitaDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function onSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      setSearch(value);
    }, 400);
  }

  async function cargarListado() {
    setCargando(true);
    try {
      const res = await listarCitas({
        search,
        ...(odontologoFiltro && { idPersonal: Number(odontologoFiltro) }),
        ...(estadoFiltro && { estado: estadoFiltro as EstadoCita }),
        ...(fechaFiltro && { desde: fechaFiltro, hasta: fechaFiltro }),
        page,
        size: pageSize,
      });
      setData(res.content);
      setTotal(res.totalElements);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cargar el listado de citas");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarListado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, odontologoFiltro, estadoFiltro, fechaFiltro, page, pageSize]);

  function limpiarFiltros() {
    setSearchInput("");
    setSearch("");
    setOdontologoFiltro("");
    setEstadoFiltro("");
    setFechaFiltro("");
    setPage(0);
  }

  async function recargarTodo() {
    await Promise.all([cargarListado(), cargarCalendario()]);
  }

  // ------------------------------------------------------------------------
  // Diálogo Nueva/Editar cita
  // ------------------------------------------------------------------------
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);

  const [pacienteBusqueda, setPacienteBusqueda] = useState("");
  const [opcionesPaciente, setOpcionesPaciente] = useState<PacienteDTO[]>([]);
  const pacienteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!dialogoAbierto) return;
    if (pacienteDebounceRef.current) clearTimeout(pacienteDebounceRef.current);
    pacienteDebounceRef.current = setTimeout(() => {
      listarPacientes({ search: pacienteBusqueda, estado: "activo", size: 30 })
        .then((res) => setOpcionesPaciente(res.content))
        .catch(() => toast.error("No se pudo buscar pacientes"));
    }, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteBusqueda, dialogoAbierto]);

  function abrirNuevaCita() {
    setForm(FORM_INICIAL);
    setEditandoId(null);
    setPacienteBusqueda("");
    setOpcionesPaciente([]);
    setDialogoAbierto(true);
  }

  function abrirEditarCita(cita: CitaDTO) {
    const { fecha, hora } = separarFechaHora(cita.fechaHora);
    setForm({
      idPaciente: String(cita.idPaciente),
      idPersonal: String(cita.idPersonal),
      idProcedimiento: cita.idProcedimiento ? String(cita.idProcedimiento) : "",
      fecha,
      hora,
      duracionMinutos: String(cita.duracionMinutos),
      notas: cita.notas ?? "",
    });
    setEditandoId(cita.idCita);
    setOpcionesPaciente([{ idPaciente: cita.idPaciente, nombreCompleto: cita.nombrePaciente } as PacienteDTO]);
    setDialogoAbierto(true);
  }

  function actualizarCampo(campo: keyof typeof FORM_INICIAL, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function validarFormulario(): string | null {
    if (!form.idPaciente) return "Debe seleccionar un paciente";
    if (!form.idPersonal) return "Debe seleccionar un odontólogo";
    if (!form.fecha) return "Debe indicar la fecha de la cita";
    if (!form.hora) return "Debe indicar la hora de la cita";
    return null;
  }

  async function handleGuardar() {
    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      toast.error(errorValidacion);
      return;
    }

    setGuardando(true);
    try {
      const payload: CitaInput = {
        idPaciente: Number(form.idPaciente),
        idPersonal: Number(form.idPersonal),
        fechaHora: combinarFechaHora(form.fecha, form.hora),
        ...(form.duracionMinutos && { duracionMinutos: Number(form.duracionMinutos) }),
        ...(form.notas.trim() && { notas: form.notas.trim() }),
        ...(form.idProcedimiento && { idProcedimiento: Number(form.idProcedimiento) }),
      };

      if (editandoId) {
        await actualizarCita(editandoId, payload);
        toast.success("Cita actualizada correctamente");
      } else {
        await crearCita(payload);
        toast.success("Cita agendada correctamente");
      }

      setDialogoAbierto(false);
      await recargarTodo();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar la cita");
    } finally {
      setGuardando(false);
    }
  }

  // ------------------------------------------------------------------------
  // Ver detalle
  // ------------------------------------------------------------------------
  const [viendoCita, setViendoCita] = useState<CitaDTO | null>(null);

  async function handleVer(idCita: number) {
    try {
      const cita = await obtenerCita(idCita);
      setViendoCita(cita);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cargar la cita");
    }
  }

  // ------------------------------------------------------------------------
  // Atender
  // ------------------------------------------------------------------------
  async function handleAtender(idCita: number) {
    try {
      await marcarCitaAtendida(idCita);
      toast.success("Cita marcada como atendida");
      await recargarTodo();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar la cita");
    }
  }

  // ------------------------------------------------------------------------
  // Cancelar (con motivo)
  // ------------------------------------------------------------------------
  const [cancelandoCita, setCancelandoCita] = useState<CitaDTO | null>(null);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState("");
  const [notaCancelacion, setNotaCancelacion] = useState("");
  const [cancelando, setCancelando] = useState(false);

  function abrirCancelar(cita: CitaDTO) {
    setCancelandoCita(cita);
    setMotivoSeleccionado("");
    setNotaCancelacion("");
  }

  async function confirmarCancelacion() {
    if (!cancelandoCita) return;
    setCancelando(true);
    try {
      await cancelarCita(cancelandoCita.idCita, {
        ...(motivoSeleccionado && { idMotivo: Number(motivoSeleccionado) }),
        ...(notaCancelacion.trim() && { notas: notaCancelacion.trim() }),
      });
      toast.success("Cita cancelada");
      setCancelandoCita(null);
      await recargarTodo();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cancelar la cita");
    } finally {
      setCancelando(false);
    }
  }

  // ------------------------------------------------------------------------
  // Eliminar
  // ------------------------------------------------------------------------
  async function handleEliminar(cita: CitaDTO) {
    if (!window.confirm(`¿Eliminar la cita ${codigoCita(cita.idCita)} de ${cita.nombrePaciente}? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await eliminarCita(cita.idCita);
      toast.success("Cita eliminada");
      await recargarTodo();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar la cita");
    }
  }

  // ------------------------------------------------------------------------
  // Imprimir (client-side, igual que el diseño original)
  // ------------------------------------------------------------------------
  function handleImprimir(cita: CitaDTO) {
    printRecord(`Cita ${codigoCita(cita.idCita)}`, [
      { label: "Paciente", value: cita.nombrePaciente },
      { label: "Procedimiento", value: cita.nombreProcedimiento ?? "—" },
      { label: "Fecha", value: formatFechaLegible(cita.fechaHora) },
      { label: "Hora", value: `${separarFechaHora(cita.fechaHora).hora} (${cita.duracionMinutos} min)` },
      { label: "Odontólogo", value: cita.nombrePersonal },
      { label: "Estado", value: cita.estadoCita },
      { label: "Notas", value: cita.notas ?? "—", full: true },
    ]);
  }

  return (
    <>
      <PageHeader
        title="Agenda y Citas"
        description="Programación y seguimiento de las citas de la clínica."
        breadcrumbs={[{ label: "Agenda y Citas" }]}
        actions={
          <Button onClick={abrirNuevaCita}>
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

        {/* ------------------------------------------------------------ CALENDARIO */}
        <TabsContent value="calendario" className="mt-4">
          <Card className="overflow-hidden border-border p-0 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekStart((d) => sumarDias(d, -7))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold">{formatRangoSemana(weekStart, weekEnd)}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekStart((d) => sumarDias(d, 7))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={odontologoCalendario || "__todos__"}
                  onValueChange={(v) => setOdontologoCalendario(v === "__todos__" ? "" : v)}
                >
                  <SelectTrigger className="w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__todos__">Todos los odontólogos</SelectItem>
                    {odontologos.map((o) => (
                      <SelectItem key={o.idPersonal} value={String(o.idPersonal)}>
                        {o.nombreCompleto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto p-4">
              <div className="min-w-[820px]">
                <div className="grid grid-cols-[70px_repeat(6,minmax(0,1fr))] gap-1.5">
                  <div />
                  {diasSemana.map((d) => (
                    <div key={formatISO(d)} className="rounded-lg bg-primary-soft py-2 text-center text-xs font-semibold text-primary-dark">
                      {formatEtiquetaDia(d)}
                    </div>
                  ))}
                  {HORAS_CALENDARIO.map((h) => (
                    <div key={h} className="contents">
                      <div className="py-3 text-right text-xs text-muted-foreground">{h}</div>
                      {diasSemana.map((d) => {
                        const b = bloquesCalendario[`${formatISO(d)}|${h}`];
                        return (
                          <div key={formatISO(d) + h} className="min-h-14 rounded-lg border border-dashed border-border p-1">
                            {b && (
                              <button
                                onClick={() => handleVer(b.idCita)}
                                className={cn(
                                  "h-full w-full rounded-md border px-2 py-1.5 text-left text-[11px] leading-tight transition-transform hover:scale-[1.02]",
                                  COLOR_ESTADO[b.estadoCita] ?? "bg-muted border-border",
                                )}
                              >
                                <span className="block font-semibold">{b.nombrePaciente}</span>
                                <span className="block opacity-80">{b.nombreProcedimiento ?? "—"}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                {cargandoCalendario && (
                  <p className="mt-3 text-center text-xs text-muted-foreground">Cargando citas de la semana...</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-border p-4 text-xs text-muted-foreground">
              <span className="font-medium">Estados:</span>
              {["programada", "confirmada", "atendida", "cancelada"].map((e) => (
                <span key={e} className="flex items-center gap-1.5 capitalize">
                  <span className={cn("h-3 w-3 rounded border", COLOR_ESTADO[e])} /> {e}
                </span>
              ))}
              <span className="ml-auto">Clic en un bloque para ver el detalle de la cita.</span>
            </div>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------ LISTADO */}
        <TabsContent value="lista" className="mt-4">
          <Card className="overflow-hidden border-border p-0 shadow-card">
            <DataToolbar
              placeholder="Buscar por paciente..."
              searchValue={searchInput}
              onSearchChange={onSearchChange}
              onClearFilters={limpiarFiltros}
              exportName="Agenda de citas"
              exportColumns={["Código", "Paciente", "Procedimiento", "Fecha", "Hora", "Odontólogo", "Estado"]}
              exportRows={data.map((c) => {
                const { fecha, hora } = separarFechaHora(c.fechaHora);
                return [codigoCita(c.idCita), c.nombrePaciente, c.nombreProcedimiento ?? "—", fecha, hora, c.nombrePersonal, c.estadoCita];
              })}
            >
              <Select
                value={odontologoFiltro || "__todos__"}
                onValueChange={(v) => {
                  setOdontologoFiltro(v === "__todos__" ? "" : v);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Odontólogo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__todos__">Todos los odontólogos</SelectItem>
                  {odontologos.map((o) => (
                    <SelectItem key={o.idPersonal} value={String(o.idPersonal)}>
                      {o.nombreCompleto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={estadoFiltro || "__todos__"}
                onValueChange={(v) => {
                  setEstadoFiltro(v === "__todos__" ? "" : v);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__todos__">Todos los estados</SelectItem>
                  {OPCIONES_ESTADO_CITA.map((e) => (
                    <SelectItem key={e.value} value={e.value} className="capitalize">
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                className="w-40"
                value={fechaFiltro}
                onChange={(e) => {
                  setFechaFiltro(e.target.value);
                  setPage(0);
                }}
              />
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
                  {cargando && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        Cargando citas...
                      </TableCell>
                    </TableRow>
                  )}
                  {!cargando && data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        No se encontraron citas con los filtros aplicados.
                      </TableCell>
                    </TableRow>
                  )}
                  {!cargando &&
                    data.map((c, i) => {
                      const { hora } = separarFechaHora(c.fechaHora);
                      return (
                        <TableRow key={c.idCita} className={i % 2 ? "bg-muted/25" : undefined}>
                          <TableCell className="text-muted-foreground">{codigoCita(c.idCita)}</TableCell>
                          <TableCell className="font-medium">{c.nombrePaciente}</TableCell>
                          <TableCell>
                            {formatFechaLegible(c.fechaHora)}
                            <span className="block text-xs text-muted-foreground">
                              {hora} · {c.duracionMinutos} min
                            </span>
                          </TableCell>
                          <TableCell>{c.nombreProcedimiento ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{c.nombrePersonal}</TableCell>
                          <TableCell>
                            <StatusBadge estado={c.estadoCita} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-success disabled:opacity-30"
                                title="Marcar como atendida"
                                disabled={c.estadoCita === "atendida" || c.estadoCita === "cancelada"}
                                onClick={() => handleAtender(c.idCita)}
                              >
                                <CircleCheck className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive disabled:opacity-30"
                                title="Cancelar cita"
                                disabled={c.estadoCita === "cancelada" || c.estadoCita === "atendida"}
                                onClick={() => abrirCancelar(c)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                title="Ver cita"
                                onClick={() => handleVer(c.idCita)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <RowActions
                                label={`cita ${codigoCita(c.idCita)}`}
                                onEdit={() => abrirEditarCita(c)}
                                onPrint={() => handleImprimir(c)}
                                onDelete={() => handleEliminar(c)}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              total={total}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(0);
              }}
            />
          </Card>
        </TabsContent>
      </Tabs>

      {/* ------------------------------------------------------------ DIÁLOGO NUEVA/EDITAR */}
      <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editandoId ? "Editar cita" : "Nueva cita"}</DialogTitle>
            <DialogDescription>Los campos con * son obligatorios.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Paciente <span className="text-destructive">*</span>
              </Label>
              <Select value={form.idPaciente} onValueChange={(v) => actualizarCampo("idPaciente", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Buscar paciente..." />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 pb-2">
                    <Input
                      placeholder="Escriba para buscar..."
                      value={pacienteBusqueda}
                      onChange={(e) => setPacienteBusqueda(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  {opcionesPaciente.map((p) => (
                    <SelectItem key={p.idPaciente} value={String(p.idPaciente)}>
                      {p.nombreCompleto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Odontólogo <span className="text-destructive">*</span>
              </Label>
              <Select value={form.idPersonal} onValueChange={(v) => actualizarCampo("idPersonal", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione odontólogo" />
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
                <Label>
                  Fecha <span className="text-destructive">*</span>
                </Label>
                <Input type="date" value={form.fecha} onChange={(e) => actualizarCampo("fecha", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>
                  Hora <span className="text-destructive">*</span>
                </Label>
                <Input type="time" value={form.hora} onChange={(e) => actualizarCampo("hora", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Procedimiento</Label>
                <Select
                  value={form.idProcedimiento || "__ninguno__"}
                  onValueChange={(v) => actualizarCampo("idProcedimiento", v === "__ninguno__" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__ninguno__">Sin especificar</SelectItem>
                    {procedimientos.map((p) => (
                      <SelectItem key={p.idProcedimiento} value={String(p.idProcedimiento)}>
                        {p.nombreProcedimiento}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duración estimada (min)</Label>
                <Input
                  type="number"
                  min={5}
                  step={5}
                  placeholder="45"
                  value={form.duracionMinutos}
                  onChange={(e) => actualizarCampo("duracionMinutos", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                rows={3}
                placeholder="Observaciones para la cita"
                value={form.notas}
                onChange={(e) => actualizarCampo("notas", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoAbierto(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------ DIÁLOGO VER */}
      <Dialog open={!!viendoCita} onOpenChange={(open) => !open && setViendoCita(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{viendoCita ? codigoCita(viendoCita.idCita) : ""}</DialogTitle>
            <DialogDescription>Detalle de la cita</DialogDescription>
          </DialogHeader>
          {viendoCita && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Paciente</span><span className="font-medium">{viendoCita.nombrePaciente}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Odontólogo</span><span className="font-medium">{viendoCita.nombrePersonal}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Procedimiento</span><span className="font-medium">{viendoCita.nombreProcedimiento ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Fecha</span><span className="font-medium">{formatFechaLegible(viendoCita.fechaHora)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Hora</span><span className="font-medium">{separarFechaHora(viendoCita.fechaHora).hora} ({viendoCita.duracionMinutos} min)</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Estado</span><StatusBadge estado={viendoCita.estadoCita} /></div>
              {viendoCita.nombreMotivo && (
                <div className="flex justify-between"><span className="text-muted-foreground">Motivo de cancelación</span><span className="font-medium">{viendoCita.nombreMotivo}</span></div>
              )}
              <div>
                <span className="text-muted-foreground">Notas</span>
                <p className="mt-1 rounded-md border border-border p-2 text-sm">{viendoCita.notas || "—"}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViendoCita(null)}>Cerrar</Button>
            {viendoCita && (
              <Button onClick={() => { abrirEditarCita(viendoCita); setViendoCita(null); }}>Editar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------ DIÁLOGO CANCELAR */}
      <Dialog open={!!cancelandoCita} onOpenChange={(open) => !open && setCancelandoCita(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar cita</DialogTitle>
            <DialogDescription>
              {cancelandoCita ? `${codigoCita(cancelandoCita.idCita)} — ${cancelandoCita.nombrePaciente}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Select value={motivoSeleccionado} onValueChange={setMotivoSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un motivo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {motivos.map((m) => (
                    <SelectItem key={m.idMotivo} value={String(m.idMotivo)}>
                      {m.nombreMotivo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notas adicionales</Label>
              <Textarea rows={3} value={notaCancelacion} onChange={(e) => setNotaCancelacion(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelandoCita(null)} disabled={cancelando}>
              Volver
            </Button>
            <Button variant="destructive" onClick={confirmarCancelacion} disabled={cancelando}>
              {cancelando ? "Cancelando..." : "Confirmar cancelación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
