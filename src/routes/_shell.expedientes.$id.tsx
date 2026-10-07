import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Pencil, Plus, Printer, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AutorSelect, autorPorDefecto } from "@/components/clinical/AutorSelect";
import { OdontogramaPaciente } from "@/components/clinical/OdontogramaPaciente";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/http";
import { obtenerPaciente } from "@/lib/api/pacientes";
import {
  actualizarDiagnostico,
  actualizarEvolucion,
  crearDiagnostico,
  crearEvolucion,
  eliminarDiagnostico,
  eliminarEvolucion,
  guardarHistoriaClinica,
  listarDiagnosticos,
  listarEvolucion,
  listarOdontologos,
  listarPlanTratamiento,
  obtenerHistoriaClinica,
} from "@/lib/api/expedientes";
import { mensajeError, useCarga } from "@/lib/useCarga";
import { labelAntecedente } from "@/types/paciente";
import type { AntecedenteDTO } from "@/types/paciente";
import { formatearFecha, formatearFechaHora } from "@/types/expediente";
import type { DiagnosticoDTO, EvolucionDTO, OdontologoDTO } from "@/types/expediente";

export const Route = createFileRoute("/_shell/expedientes/$id")({
  loader: async ({ params }) => {
    const idPaciente = Number(params.id);
    if (Number.isNaN(idPaciente)) throw notFound();
    try {
      const paciente = await obtenerPaciente(idPaciente);
      return { paciente };
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) throw notFound();
      throw err;
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `Expediente de ${loaderData.paciente.nombreCompleto} — ARCHES` : "Expediente — ARCHES" },
      { name: "description", content: "Historia clínica, odontograma, diagnósticos, plan de tratamiento y evolución." },
      { property: "og:title", content: "Expediente clínico odontológico — ARCHES" },
      { property: "og:description", content: "Historia clínica, odontograma, diagnósticos, plan de tratamiento y evolución." },
    ],
  }),
  component: Expediente,
});

/** Fecha de hoy en hora local como yyyy-MM-dd (toISOString usaría UTC y podría adelantar el día). */
function hoyLocal(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function Expediente() {
  const { paciente: p } = Route.useLoaderData();
  const idPaciente = p.idPaciente;
  const [odontologos, setOdontologos] = useState<OdontologoDTO[]>([]);

  useEffect(() => {
    listarOdontologos()
      .then(setOdontologos)
      .catch((err) => toast.error(mensajeError(err, "No se pudo cargar la lista de odontólogos")));
  }, []);

  return (
    <>
      <PageHeader
        title={`Expediente clínico — ${p.nombreCompleto}`}
        description={`P-${String(idPaciente).padStart(4, "0")} · ${p.cedula}`}
        breadcrumbs={[{ label: "Expediente Clínico", to: "/expedientes" }, { label: p.nombreCompleto }]}
        actions={
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Imprimir expediente
          </Button>
        }
      />

      <Tabs defaultValue="historia">
        <TabsList className="flex-wrap">
          <TabsTrigger value="historia">Historia clínica</TabsTrigger>
          <TabsTrigger value="odontograma">Odontograma</TabsTrigger>
          <TabsTrigger value="diagnosticos">Diagnósticos</TabsTrigger>
          <TabsTrigger value="plan">Plan de tratamiento</TabsTrigger>
          <TabsTrigger value="evolucion">Evolución y notas</TabsTrigger>
        </TabsList>

        <TabsContent value="historia" className="mt-4">
          <HistoriaTab idPaciente={idPaciente} antecedentes={p.antecedentes ?? []} />
        </TabsContent>

        <TabsContent value="odontograma" className="mt-4">
          <OdontogramaPaciente idPaciente={idPaciente} odontologos={odontologos} />
        </TabsContent>

        <TabsContent value="diagnosticos" className="mt-4">
          <DiagnosticosTab idPaciente={idPaciente} odontologos={odontologos} />
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          <PlanTab idPaciente={idPaciente} />
        </TabsContent>

        <TabsContent value="evolucion" className="mt-4">
          <EvolucionTab idPaciente={idPaciente} odontologos={odontologos} />
        </TabsContent>
      </Tabs>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Historia clínica                                                    */
/* ------------------------------------------------------------------ */

function HistoriaTab({ idPaciente, antecedentes }: { idPaciente: number; antecedentes: AntecedenteDTO[] }) {
  const { datos, cargando, error, setDatos } = useCarga(
    () => obtenerHistoriaClinica(idPaciente),
    [idPaciente],
    "No se pudo cargar la historia clínica",
  );
  const [form, setForm] = useState({ antecedentesMedicos: "", antecedentesOdontologicos: "", habitos: "" });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (datos) {
      setForm({
        antecedentesMedicos: datos.antecedentesMedicos ?? "",
        antecedentesOdontologicos: datos.antecedentesOdontologicos ?? "",
        habitos: datos.habitos ?? "",
      });
    }
  }, [datos]);

  async function guardar() {
    setGuardando(true);
    try {
      setDatos(await guardarHistoriaClinica(idPaciente, form));
      toast.success("Historia clínica guardada");
    } catch (err) {
      toast.error(mensajeError(err, "No se pudo guardar la historia clínica"));
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <p className="py-8 text-center text-sm text-muted-foreground">Cargando historia clínica…</p>;
  if (error) return <p className="py-8 text-center text-sm text-destructive">{error}</p>;

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Antecedentes médicos</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/pacientes/$id" params={{ id: String(idPaciente) }} search={{ edit: false }}>
              Editar en la ficha del paciente
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          {antecedentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin antecedentes registrados en la ficha del paciente.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {antecedentes.map((a) => (
                <li key={a.idAntecedente} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{labelAntecedente(a.tipoAntecedente)}</p>
                  <p className="text-sm text-muted-foreground">{a.descripcion}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="space-y-2">
            <Label>Observaciones médicas</Label>
            <Textarea
              rows={3}
              value={form.antecedentesMedicos}
              onChange={(e) => setForm((f) => ({ ...f, antecedentesMedicos: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Antecedentes odontológicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>Motivo de consulta, tratamientos previos y otros</Label>
            <Textarea
              rows={6}
              value={form.antecedentesOdontologicos}
              onChange={(e) => setForm((f) => ({ ...f, antecedentesOdontologicos: e.target.value }))}
            />
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Hábitos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>Tabaquismo, bruxismo, higiene oral, etc.</Label>
            <Textarea
              rows={6}
              value={form.habitos}
              onChange={(e) => setForm((f) => ({ ...f, habitos: e.target.value }))}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {datos?.fechaActualizacion
            ? `Última actualización: ${formatearFechaHora(datos.fechaActualizacion)}`
            : "Aún no se ha registrado la historia clínica de este paciente."}
        </p>
        <Button onClick={guardar} disabled={guardando}>
          <Save className="h-4 w-4" /> {guardando ? "Guardando…" : "Guardar historia clínica"}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Diagnósticos                                                        */
/* ------------------------------------------------------------------ */

type FormDiagnostico = { diagnostico: string; descripcion: string; fechaDiagnostico: string; idPersonal: string };

function DiagnosticosTab({ idPaciente, odontologos }: { idPaciente: number; odontologos: OdontologoDTO[] }) {
  const { datos, cargando, error, recargar } = useCarga(
    () => listarDiagnosticos(idPaciente),
    [idPaciente],
    "No se pudieron cargar los diagnósticos",
  );
  // null = formulario cerrado; "nuevo" = alta; DiagnosticoDTO = edición
  const [editando, setEditando] = useState<DiagnosticoDTO | "nuevo" | null>(null);
  const [form, setForm] = useState<FormDiagnostico>({ diagnostico: "", descripcion: "", fechaDiagnostico: "", idPersonal: "" });
  const [guardando, setGuardando] = useState(false);

  function abrirNuevo() {
    setForm({ diagnostico: "", descripcion: "", fechaDiagnostico: hoyLocal(), idPersonal: autorPorDefecto(odontologos) });
    setEditando("nuevo");
  }

  function abrirEdicion(d: DiagnosticoDTO) {
    setForm({
      diagnostico: d.diagnostico,
      descripcion: d.descripcion ?? "",
      fechaDiagnostico: d.fechaDiagnostico,
      idPersonal: String(d.idPersonal),
    });
    setEditando(d);
  }

  async function guardar() {
    if (!form.diagnostico.trim()) return void toast.error("El diagnóstico es obligatorio");
    if (!form.idPersonal) return void toast.error("Seleccione el odontólogo");
    const descripcion = form.descripcion.trim();
    const payload = {
      idPersonal: Number(form.idPersonal),
      diagnostico: form.diagnostico.trim(),
      ...(descripcion ? { descripcion } : {}),
      ...(form.fechaDiagnostico ? { fechaDiagnostico: form.fechaDiagnostico } : {}),
    };
    setGuardando(true);
    try {
      if (editando && editando !== "nuevo") {
        await actualizarDiagnostico(idPaciente, editando.idDiagnostico, payload);
      } else {
        await crearDiagnostico(idPaciente, payload);
      }
      toast.success("Diagnóstico guardado");
      setEditando(null);
      recargar();
    } catch (err) {
      toast.error(mensajeError(err, "No se pudo guardar el diagnóstico"));
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(d: DiagnosticoDTO) {
    if (!window.confirm(`¿Eliminar el diagnóstico "${d.diagnostico}"?`)) return;
    try {
      await eliminarDiagnostico(idPaciente, d.idDiagnostico);
      toast.success("Diagnóstico eliminado");
      recargar();
    } catch (err) {
      toast.error(mensajeError(err, "No se pudo eliminar el diagnóstico"));
    }
  }

  return (
    <Card className="overflow-hidden border-border p-0 shadow-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="text-sm font-semibold">Diagnósticos registrados</h3>
        <Button size="sm" onClick={abrirNuevo} disabled={editando !== null}>
          <Plus className="h-4 w-4" /> Agregar diagnóstico
        </Button>
      </div>

      {editando !== null && (
        <div className="grid gap-4 border-b border-border bg-muted/30 p-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Diagnóstico</Label>
            <Input
              maxLength={150}
              value={form.diagnostico}
              onChange={(e) => setForm((f) => ({ ...f, diagnostico: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input
              type="date"
              value={form.fechaDiagnostico}
              onChange={(e) => setForm((f) => ({ ...f, fechaDiagnostico: e.target.value }))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Descripción (opcional)</Label>
            <Textarea
              rows={2}
              maxLength={300}
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Odontólogo</Label>
            <AutorSelect odontologos={odontologos} value={form.idPersonal} onChange={(v) => setForm((f) => ({ ...f, idPersonal: v }))} />
          </div>
          <div className="flex items-end justify-end gap-2">
            <Button variant="outline" onClick={() => setEditando(null)} disabled={guardando}>
              <X className="h-4 w-4" /> Cancelar
            </Button>
            <Button onClick={guardar} disabled={guardando}>
              <Check className="h-4 w-4" /> {guardando ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader className="bg-muted/60">
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Diagnóstico</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Odontólogo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cargando && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                Cargando diagnósticos…
              </TableCell>
            </TableRow>
          )}
          {error && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-destructive">
                {error}
              </TableCell>
            </TableRow>
          )}
          {!cargando && !error && (datos ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                Este paciente no tiene diagnósticos registrados.
              </TableCell>
            </TableRow>
          )}
          {!cargando &&
            (datos ?? []).map((d, i) => (
              <TableRow key={d.idDiagnostico} className={i % 2 ? "bg-muted/25" : undefined}>
                <TableCell className="whitespace-nowrap">{formatearFecha(d.fechaDiagnostico)}</TableCell>
                <TableCell className="font-medium">{d.diagnostico}</TableCell>
                <TableCell className="text-muted-foreground">{d.descripcion ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{d.nombrePersonal ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" aria-label="Editar diagnóstico" onClick={() => abrirEdicion(d)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Eliminar diagnóstico" onClick={() => eliminar(d)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Plan de tratamiento (lectura; se administra en el módulo Tratamientos) */
/* ------------------------------------------------------------------ */

function PlanTab({ idPaciente }: { idPaciente: number }) {
  const { datos, cargando, error } = useCarga(
    () => listarPlanTratamiento(idPaciente),
    [idPaciente],
    "No se pudo cargar el plan de tratamiento",
  );

  return (
    <Card className="overflow-hidden border-border p-0 shadow-card">
      <div className="border-b border-border p-4">
        <h3 className="text-sm font-semibold">Plan de tratamiento</h3>
        <p className="text-xs text-muted-foreground">Los tratamientos se crean y se actualizan desde el módulo Tratamientos.</p>
      </div>
      <Table>
        <TableHeader className="bg-muted/60">
          <TableRow>
            <TableHead>Procedimiento</TableHead>
            <TableHead>Sesiones</TableHead>
            <TableHead>Odontólogo</TableHead>
            <TableHead>Costo</TableHead>
            <TableHead>Avance</TableHead>
            <TableHead>Pago</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cargando && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                Cargando plan de tratamiento…
              </TableCell>
            </TableRow>
          )}
          {error && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-destructive">
                {error}
              </TableCell>
            </TableRow>
          )}
          {!cargando && !error && (datos ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                Este paciente no tiene tratamientos registrados.
              </TableCell>
            </TableRow>
          )}
          {!cargando &&
            (datos ?? []).map((t, i) => (
              <TableRow key={t.idTratamiento} className={i % 2 ? "bg-muted/25" : undefined}>
                <TableCell className="font-medium">{t.nombreProcedimiento ?? `Procedimiento #${t.idProcedimiento}`}</TableCell>
                <TableCell className="text-muted-foreground">{t.sesionesPlanificadas}</TableCell>
                <TableCell className="text-muted-foreground">{t.nombrePersonal ?? "—"}</TableCell>
                <TableCell>C$ {Number(t.costoTotal).toLocaleString("es-NI")}</TableCell>
                <TableCell>
                  <StatusBadge estado={t.estadoAvance} />
                </TableCell>
                <TableCell>
                  <StatusBadge estado={t.estadoPago} />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Evolución y notas                                                   */
/* ------------------------------------------------------------------ */

function EvolucionTab({ idPaciente, odontologos }: { idPaciente: number; odontologos: OdontologoDTO[] }) {
  const { datos, cargando, error, recargar } = useCarga(
    () => listarEvolucion(idPaciente),
    [idPaciente],
    "No se pudo cargar la bitácora de evolución",
  );
  // null = formulario cerrado; "nueva" = alta; EvolucionDTO = edición (solo el texto)
  const [editando, setEditando] = useState<EvolucionDTO | "nueva" | null>(null);
  const [nota, setNota] = useState("");
  const [idPersonal, setIdPersonal] = useState("");
  const [guardando, setGuardando] = useState(false);

  function abrirNueva() {
    setNota("");
    setIdPersonal(autorPorDefecto(odontologos));
    setEditando("nueva");
  }

  function abrirEdicion(e: EvolucionDTO) {
    setNota(e.nota);
    setIdPersonal(String(e.idPersonal));
    setEditando(e);
  }

  async function guardar() {
    if (!nota.trim()) return void toast.error("La nota es obligatoria");
    if (!idPersonal) return void toast.error("Seleccione el odontólogo");
    const payload = { idPersonal: Number(idPersonal), nota: nota.trim() };
    setGuardando(true);
    try {
      if (editando && editando !== "nueva") {
        await actualizarEvolucion(idPaciente, editando.idEvolucion, payload);
      } else {
        await crearEvolucion(idPaciente, payload);
      }
      toast.success("Nota guardada");
      setEditando(null);
      recargar();
    } catch (err) {
      toast.error(mensajeError(err, "No se pudo guardar la nota"));
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(e: EvolucionDTO) {
    if (!window.confirm("¿Eliminar esta nota de evolución?")) return;
    try {
      await eliminarEvolucion(idPaciente, e.idEvolucion);
      toast.success("Nota eliminada");
      recargar();
    } catch (err) {
      toast.error(mensajeError(err, "No se pudo eliminar la nota"));
    }
  }

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Bitácora de evolución</CardTitle>
        <Button size="sm" onClick={abrirNueva} disabled={editando !== null}>
          <Plus className="h-4 w-4" /> Nueva nota
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {editando !== null && (
          <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
            <div className="space-y-2">
              <Label>Nota clínica</Label>
              <Textarea rows={4} value={nota} onChange={(e) => setNota(e.target.value)} />
            </div>
            {editando === "nueva" && (
              <div className="space-y-2 sm:max-w-sm">
                <Label>Odontólogo</Label>
                <AutorSelect odontologos={odontologos} value={idPersonal} onChange={setIdPersonal} />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditando(null)} disabled={guardando}>
                <X className="h-4 w-4" /> Cancelar
              </Button>
              <Button onClick={guardar} disabled={guardando}>
                <Check className="h-4 w-4" /> {guardando ? "Guardando…" : "Guardar nota"}
              </Button>
            </div>
          </div>
        )}

        {cargando && <p className="py-4 text-center text-sm text-muted-foreground">Cargando bitácora…</p>}
        {error && <p className="py-4 text-center text-sm text-destructive">{error}</p>}
        {!cargando && !error && (datos ?? []).length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">Este paciente no tiene notas de evolución.</p>
        )}

        <ol className="relative space-y-6 border-l border-border pl-6">
          {(datos ?? []).map((e) => (
            <li key={e.idEvolucion}>
              <span className="absolute -left-[7px] mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary" />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="text-sm font-semibold">{formatearFechaHora(e.fechaRegistro)}</p>
                <p className="text-xs text-muted-foreground">{e.nombrePersonal ?? "—"}</p>
                <span className="ml-auto flex">
                  <Button variant="ghost" size="icon" aria-label="Editar nota" onClick={() => abrirEdicion(e)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Eliminar nota" onClick={() => eliminar(e)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </span>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">{e.nota}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
