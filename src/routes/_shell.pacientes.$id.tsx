import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Printer, ArrowLeft, Phone, Mail, MapPin, CalendarDays, FileHeart, Plus, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { citas, planTratamiento } from "@/lib/mock-data";
import { ApiError, abrirBlobEnPestana } from "@/lib/api/http";
import { obtenerPaciente, actualizarPaciente, obtenerFichaPaciente } from "@/lib/api/pacientes";
import {
  crearContacto,
  actualizarContacto,
  eliminarContacto,
} from "@/lib/api/contactosEmergencia";
import {
  crearAntecedente,
  actualizarAntecedente,
  eliminarAntecedente,
} from "@/lib/api/antecedentes";
import type { PacienteDTO, ContactoEmergenciaDTO, AntecedenteDTO, PacienteInput } from "@/types/paciente";

export const Route = createFileRoute("/_shell/pacientes/$id")({
  validateSearch: (search: Record<string, unknown>) => ({
    edit: search.edit === true || search.edit === "true",
  }),
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
      { title: loaderData ? `${loaderData.paciente.nombreCompleto} — ARCHES` : "Paciente no encontrado — ARCHES" },
      { name: "description", content: "Ficha detallada del paciente: datos generales, contactos y antecedentes." },
      { property: "og:title", content: "Ficha de paciente — ARCHES" },
      { property: "og:description", content: "Ficha detallada del paciente: datos generales, contactos y antecedentes." },
    ],
  }),
  component: DetallePaciente,
});

function Dato({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

function DetallePaciente() {
  const router = useRouter();
  const { paciente: pacienteInicial } = Route.useLoaderData();
  const { edit } = Route.useSearch();

  const [paciente, setPaciente] = useState<PacienteDTO>(pacienteInicial);
  const [editMode, setEditMode] = useState(edit);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState<PacienteInput>({
    nombreCompleto: pacienteInicial.nombreCompleto,
    cedula: pacienteInicial.cedula,
    fechaNacimiento: pacienteInicial.fechaNacimiento,
    sexo: pacienteInicial.sexo,
    direccion: pacienteInicial.direccion ?? "",
    ocupacion: pacienteInicial.ocupacion ?? "",
    telefono: pacienteInicial.telefono,
    correo: pacienteInicial.correo ?? "",
  });

  const citasPaciente = citas.filter((c) => c.paciente === paciente.nombreCompleto);

  async function recargar() {
    const actualizado = await obtenerPaciente(paciente.idPaciente);
    setPaciente(actualizado);
  }

  async function handleImprimir() {
    try {
      const blob = await obtenerFichaPaciente(paciente.idPaciente);
      abrirBlobEnPestana(blob);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo generar la ficha");
    }
  }

  async function handleGuardarDatos() {
    setGuardando(true);
    try {
      const actualizado = await actualizarPaciente(paciente.idPaciente, form);
      setPaciente((prev) => ({ ...prev, ...actualizado }));
      setEditMode(false);
      toast.success("Datos del paciente actualizados");
      // Limpia el ?edit=true de la URL si vino desde el listado
      router.navigate({ to: "/pacientes/$id", params: { id: String(paciente.idPaciente) }, search: {} });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar el paciente");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <PageHeader
        title={paciente.nombreCompleto}
        description={`Expediente P-${String(paciente.idPaciente).padStart(4, "0")}`}
        breadcrumbs={[{ label: "Pacientes", to: "/pacientes" }, { label: paciente.nombreCompleto }]}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/pacientes">
                <ArrowLeft className="h-4 w-4" /> Volver
              </Link>
            </Button>
            <Button variant="outline" onClick={handleImprimir}>
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button onClick={() => setEditMode((v) => !v)}>
              <Pencil className="h-4 w-4" /> {editMode ? "Cancelar edición" : "Editar"}
            </Button>
          </>
        }
      />

      <Card className="mb-6 overflow-hidden border-border shadow-card">
        <div className="bg-gradient-soft grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5 p-6 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="bg-gradient-primary grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-xl font-semibold text-primary-foreground">
              {paciente.nombreCompleto
                .split(" ")
                .slice(0, 2)
                .map((n: string) => n[0])
                .join("")}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{paciente.nombreCompleto}</h2>
              <p className="truncate text-sm text-muted-foreground">
                {paciente.cedula} · {paciente.sexo} · {paciente.fechaNacimiento} · {paciente.edad} años
              </p>
              <div className="mt-2">
                <StatusBadge estado={paciente.estadoExpediente} />
              </div>
            </div>
          </div>
          <div className="col-span-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-1">
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" /> {paciente.telefono || "—"}
            </span>
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" /> {paciente.correo || "—"}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" /> {paciente.direccion || "—"}
            </span>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="generales">
        <TabsList className="flex-wrap">
          <TabsTrigger value="generales">Datos generales</TabsTrigger>
          <TabsTrigger value="citas">Historial de citas</TabsTrigger>
          <TabsTrigger value="expediente">Expediente clínico</TabsTrigger>
          <TabsTrigger value="tratamientos">Tratamientos</TabsTrigger>
        </TabsList>

        <TabsContent value="generales" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle className="text-base">Datos personales y contacto</CardTitle>
              </CardHeader>
              <CardContent>
                {!editMode ? (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Dato label="Cédula" value={paciente.cedula} />
                    <Dato label="Fecha de nacimiento" value={paciente.fechaNacimiento} />
                    <Dato label="Sexo" value={paciente.sexo} />
                    <Dato label="Ocupación" value={paciente.ocupacion} />
                    <Dato label="Teléfono" value={paciente.telefono} />
                    <Dato label="Correo" value={paciente.correo} />
                    <Dato label="Dirección" value={paciente.direccion} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Nombre completo</Label>
                        <Input
                          value={form.nombreCompleto}
                          onChange={(e) => setForm((f) => ({ ...f, nombreCompleto: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cédula</Label>
                        <Input value={form.cedula} onChange={(e) => setForm((f) => ({ ...f, cedula: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha de nacimiento</Label>
                        <Input
                          type="date"
                          value={form.fechaNacimiento}
                          onChange={(e) => setForm((f) => ({ ...f, fechaNacimiento: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sexo</Label>
                        <Select value={form.sexo} onValueChange={(v) => setForm((f) => ({ ...f, sexo: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Femenino">Femenino</SelectItem>
                            <SelectItem value="Masculino">Masculino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Ocupación</Label>
                        <Input
                          value={form.ocupacion}
                          onChange={(e) => setForm((f) => ({ ...f, ocupacion: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Teléfono</Label>
                        <Input
                          value={form.telefono}
                          onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Correo</Label>
                        <Input
                          type="email"
                          value={form.correo}
                          onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Dirección</Label>
                        <Textarea
                          rows={2}
                          value={form.direccion}
                          onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditMode(false)} disabled={guardando}>
                        Cancelar
                      </Button>
                      <Button onClick={handleGuardarDatos} disabled={guardando}>
                        {guardando ? "Guardando..." : "Guardar cambios"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <ContactosCard idPaciente={paciente.idPaciente} contactos={paciente.contactos ?? []} onChange={recargar} />
          </div>

          <AntecedentesCard idPaciente={paciente.idPaciente} antecedentes={paciente.antecedentes ?? []} onChange={recargar} />
        </TabsContent>

        <TabsContent value="citas" className="mt-4">
          <Card className="overflow-hidden border-border p-0 shadow-card">
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Procedimiento</TableHead>
                  <TableHead>Odontólogo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {citasPaciente.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Sin citas registradas para este paciente.
                    </TableCell>
                  </TableRow>
                )}
                {citasPaciente.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.fecha}</TableCell>
                    <TableCell>{c.hora}</TableCell>
                    <TableCell>{c.procedimiento}</TableCell>
                    <TableCell className="text-muted-foreground">{c.odontologo}</TableCell>
                    <TableCell>
                      <StatusBadge estado={c.estado} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <p className="mt-2 text-xs text-muted-foreground">
            Este tab sigue usando datos de ejemplo — se conecta cuando el módulo de Agenda y Citas tenga su propia API.
          </p>
        </TabsContent>

        <TabsContent value="expediente" className="mt-4">
          <Card className="border-border shadow-card">
            <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
              <FileHeart className="h-10 w-10 text-primary" strokeWidth={1.5} />
              <div>
                <p className="font-medium">Expediente clínico odontológico</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Historia clínica, odontograma, diagnósticos y evolución del paciente.
                </p>
              </div>
              <Button asChild>
                <Link to="/expedientes/$id" params={{ id: String(paciente.idPaciente) }}>
                  Abrir expediente
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tratamientos" className="mt-4">
          <Card className="overflow-hidden border-border p-0 shadow-card">
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead>Procedimiento</TableHead>
                  <TableHead>Sesiones</TableHead>
                  <TableHead>Odontólogo</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planTratamiento.map((t) => (
                  <TableRow key={t.procedimiento}>
                    <TableCell className="font-medium">{t.procedimiento}</TableCell>
                    <TableCell className="text-muted-foreground">{t.sesiones}</TableCell>
                    <TableCell className="text-muted-foreground">{t.odontologo}</TableCell>
                    <TableCell>C$ {t.costo.toLocaleString("es-NI")}</TableCell>
                    <TableCell>
                      <StatusBadge estado={t.estado} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <p className="mt-2 text-xs text-muted-foreground">
            Este tab sigue usando datos de ejemplo — se conecta cuando el módulo de Procedimientos tenga su propia API.
          </p>
        </TabsContent>
      </Tabs>

      <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5" /> Estado del expediente: {paciente.estadoExpediente}
      </p>
    </>
  );
}

// ---------------------------------------------------------------------------
// Contactos de emergencia: lista + alta/edición/baja contra el backend real
// ---------------------------------------------------------------------------
function ContactosCard({
  idPaciente,
  contactos,
  onChange,
}: {
  idPaciente: number;
  contactos: ContactoEmergenciaDTO[];
  onChange: () => Promise<void>;
}) {
  const [agregando, setAgregando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombreContacto: "", telefono: "", parentesco: "" });
  const [guardando, setGuardando] = useState(false);

  function abrirNuevo() {
    setForm({ nombreContacto: "", telefono: "", parentesco: "" });
    setEditandoId(null);
    setAgregando(true);
  }

  function abrirEdicion(c: ContactoEmergenciaDTO) {
    setForm({ nombreContacto: c.nombreContacto, telefono: c.telefono, parentesco: c.parentesco ?? "" });
    setEditandoId(c.idContacto);
    setAgregando(true);
  }

  async function guardar() {
    if (!form.nombreContacto.trim() || !form.telefono.trim()) {
      toast.error("Nombre y teléfono son obligatorios");
      return;
    }
    setGuardando(true);
    try {
      if (editandoId) {
        await actualizarContacto(idPaciente, editandoId, form);
      } else {
        await crearContacto(idPaciente, form);
      }
      setAgregando(false);
      await onChange();
      toast.success("Contacto guardado");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar el contacto");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(idContacto: number) {
    try {
      await eliminarContacto(idPaciente, idContacto);
      await onChange();
      toast.success("Contacto eliminado");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar el contacto");
    }
  }

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Contactos de emergencia</CardTitle>
        {!agregando && (
          <Button variant="outline" size="sm" onClick={abrirNuevo}>
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {contactos.length === 0 && !agregando && (
          <p className="text-sm text-muted-foreground">Sin contactos registrados.</p>
        )}
        {contactos.map((c) => (
          <div key={c.idContacto} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{c.nombreContacto}</p>
              <p className="truncate text-xs text-muted-foreground">
                {c.telefono} {c.parentesco ? `· ${c.parentesco}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEdicion(c)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => eliminar(c.idContacto)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {agregando && (
          <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Nombre"
                value={form.nombreContacto}
                onChange={(e) => setForm((f) => ({ ...f, nombreContacto: e.target.value }))}
              />
              <Input
                placeholder="Teléfono"
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              />
              <Input
                placeholder="Parentesco"
                className="sm:col-span-2"
                value={form.parentesco}
                onChange={(e) => setForm((f) => ({ ...f, parentesco: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setAgregando(false)} disabled={guardando}>
                <X className="h-4 w-4" /> Cancelar
              </Button>
              <Button size="sm" onClick={guardar} disabled={guardando}>
                <Check className="h-4 w-4" /> {guardando ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Antecedentes: lista + alta/edición/baja contra el backend real
// ---------------------------------------------------------------------------
function AntecedentesCard({
  idPaciente,
  antecedentes,
  onChange,
}: {
  idPaciente: number;
  antecedentes: AntecedenteDTO[];
  onChange: () => Promise<void>;
}) {
  const [agregando, setAgregando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState({ tipoAntecedente: "", descripcion: "" });
  const [guardando, setGuardando] = useState(false);

  function abrirNuevo() {
    setForm({ tipoAntecedente: "", descripcion: "" });
    setEditandoId(null);
    setAgregando(true);
  }

  function abrirEdicion(a: AntecedenteDTO) {
    setForm({ tipoAntecedente: a.tipoAntecedente, descripcion: a.descripcion });
    setEditandoId(a.idAntecedente);
    setAgregando(true);
  }

  async function guardar() {
    if (!form.tipoAntecedente.trim() || !form.descripcion.trim()) {
      toast.error("Tipo y descripción son obligatorios");
      return;
    }
    setGuardando(true);
    try {
      if (editandoId) {
        await actualizarAntecedente(idPaciente, editandoId, form);
      } else {
        await crearAntecedente(idPaciente, form);
      }
      setAgregando(false);
      await onChange();
      toast.success("Antecedente guardado");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar el antecedente");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(idAntecedente: number) {
    try {
      await eliminarAntecedente(idPaciente, idAntecedente);
      await onChange();
      toast.success("Antecedente eliminado");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar el antecedente");
    }
  }

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Antecedentes</CardTitle>
        {!agregando && (
          <Button variant="outline" size="sm" onClick={abrirNuevo}>
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {antecedentes.length === 0 && !agregando && (
          <p className="text-sm text-muted-foreground">Sin antecedentes registrados.</p>
        )}
        {antecedentes.map((a) => (
          <div
            key={a.idAntecedente}
            className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{a.tipoAntecedente}</p>
              <p className="text-sm text-muted-foreground">{a.descripcion}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEdicion(a)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => eliminar(a.idAntecedente)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {agregando && (
          <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
            <Input
              placeholder="Tipo (ej. Alergias, Enfermedad crónica)"
              value={form.tipoAntecedente}
              onChange={(e) => setForm((f) => ({ ...f, tipoAntecedente: e.target.value }))}
            />
            <Textarea
              rows={2}
              placeholder="Descripción"
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setAgregando(false)} disabled={guardando}>
                <X className="h-4 w-4" /> Cancelar
              </Button>
              <Button size="sm" onClick={guardar} disabled={guardando}>
                <Check className="h-4 w-4" /> {guardando ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
