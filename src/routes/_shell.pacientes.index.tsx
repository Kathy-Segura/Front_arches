import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plus, Printer } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataToolbar } from "@/components/common/DataToolbar";
import { TablePagination } from "@/components/common/TablePagination";
import { RowActions } from "@/components/common/RowActions";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { descargarBlob, abrirBlobEnPestana, ApiError } from "@/lib/api/http";
import {
  listarPacientes,
  crearPaciente,
  archivarPaciente,
  exportarPacientesExcel,
  exportarPacientesPdf,
  obtenerFichaPaciente,
} from "@/lib/api/pacientes";
import { crearContacto } from "@/lib/api/contactosEmergencia";
import { crearAntecedente } from "@/lib/api/antecedentes";
import type { PacienteDTO } from "@/types/paciente";

export const Route = createFileRoute("/_shell/pacientes/")({
  head: () => ({
    meta: [
      { title: "Pacientes — ARCHES" },
      { name: "description", content: "Listado y registro de pacientes de la clínica odontológica." },
      { property: "og:title", content: "Pacientes — ARCHES" },
      { property: "og:description", content: "Listado y registro de pacientes de la clínica odontológica." },
    ],
  }),
  component: Pacientes,
});

function Campo({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

// El campo "Contacto de emergencia" del formulario rápido sigue siendo un solo
// texto libre ("Nombre — Teléfono"), pero el backend guarda nombre y teléfono
// por separado. Este helper intenta separarlos; si no reconoce el patrón,
// guarda todo como nombre y deja el teléfono vacío (se puede completar luego
// desde la pestaña "Contactos" en el detalle del paciente).

function parseContactoEmergencia(texto: string): { nombreContacto: string; telefono: string } {
  const [nombre, tel] = texto.split("—").map((p) => p.trim());
  if (nombre !== undefined && tel !== undefined) {
    return { nombreContacto: nombre, telefono: tel };
  }
  return { nombreContacto: texto.trim(), telefono: "" };
}

const FORM_INICIAL = {
  nombreCompleto: "",
  cedula: "",
  fechaNacimiento: "",
  sexo: "",
  ocupacion: "",
  direccion: "",
  telefono: "",
  correo: "",
  contactoEmergencia: "",
  alergias: "",
  cronicas: "",
  medicamentos: "",
  familiares: "",
};

function Pacientes() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<string>("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [data, setData] = useState<PacienteDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);

  // Debounce de la barra de búsqueda (400ms) para no pegarle al backend en cada tecla.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function onSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      setSearch(value);
    }, 400);
  }

  async function cargar() {
    setCargando(true);
    try {
      const res = await listarPacientes({ search, estado: estado as "activo" | "inactivo" | "", page, size: pageSize });
      setData(res.content);
      setTotal(res.totalElements);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cargar el listado de pacientes");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, estado, page, pageSize]);

  function limpiarFiltros() {
    setSearchInput("");
    setSearch("");
    setEstado("");
    setPage(0);
  }

  async function handleExportExcel() {
    try {
      const blob = await exportarPacientesExcel({ search, estado: estado as "activo" | "inactivo" | "" });
      descargarBlob(blob, "pacientes.xlsx");
      toast.success("Excel generado");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo generar el Excel");
    }
  }

  async function handleExportPdf() {
    try {
      const blob = await exportarPacientesPdf({ search, estado: estado as "activo" | "inactivo" | "" });
      abrirBlobEnPestana(blob);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo generar el PDF");
    }
  }

  async function handleImprimirFicha(id: number) {
    try {
      const blob = await obtenerFichaPaciente(id);
      abrirBlobEnPestana(blob);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo generar la ficha");
    }
  }

  async function handleEliminar(id: number) {
    await archivarPaciente(id);
    await cargar();
  }

  function actualizarCampo(campo: keyof typeof FORM_INICIAL, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function validarFormulario(): string | null {
    if (!form.nombreCompleto.trim()) return "El nombre completo es obligatorio";
    if (!form.cedula.trim()) return "La cédula es obligatoria";
    if (!form.fechaNacimiento) return "La fecha de nacimiento es obligatoria";
    if (!form.sexo) return "El sexo es obligatorio";
    if (!form.telefono.trim()) return "El teléfono es obligatorio";
    return null;
  }

  async function handleGuardar(agregarOtro: boolean) {
    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      toast.error(errorValidacion);
      return;
    }

  setGuardando(true);
    try {
      const ocupacion = form.ocupacion.trim();
      const direccion = form.direccion.trim();
      const correo = form.correo.trim();

      const nuevo = await crearPaciente({
        nombreCompleto: form.nombreCompleto.trim(),
        cedula: form.cedula.trim(),
        fechaNacimiento: form.fechaNacimiento,
        sexo: form.sexo,
        telefono: form.telefono.trim(),
        ...(ocupacion && { ocupacion }),
        ...(direccion && { direccion }),
        ...(correo && { correo }),
      });


      // Contacto de emergencia rápido (opcional)
      if (form.contactoEmergencia.trim()) {
        const { nombreContacto, telefono } = parseContactoEmergencia(form.contactoEmergencia);
        await crearContacto(nuevo.idPaciente, { nombreContacto, telefono, parentesco: "Emergencia" });
      }

      // Antecedentes rápidos (opcionales) — cada campo no vacío se guarda como un antecedente independiente
      const antecedentesRapidos: Array<[string, string]> = [
        ["Alergias", form.alergias],
        ["Enfermedades crónicas", form.cronicas],
        ["Medicamentos actuales", form.medicamentos],
        ["Antecedentes familiares", form.familiares],
      ];
      for (const [tipo, descripcion] of antecedentesRapidos) {
        if (descripcion.trim()) {
          await crearAntecedente(nuevo.idPaciente, { tipoAntecedente: tipo, descripcion: descripcion.trim() });
        }
      }

      toast.success(agregarOtro ? "Paciente guardado. Puede registrar otro." : "Paciente registrado correctamente");
      setForm(FORM_INICIAL);
      if (!agregarOtro) setOpen(false);
      await cargar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo registrar el paciente");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Pacientes"
        description="Gestión del padrón de pacientes y sus expedientes."
        breadcrumbs={[{ label: "Pacientes" }]}
        actions={
          <>
            <Button variant="outline" onClick={handleExportPdf}>
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button
              onClick={() => {
                setForm(FORM_INICIAL);
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Nuevo paciente
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden border-border p-0 shadow-card">
        <DataToolbar
          placeholder="Buscar por nombre o cédula..."
          searchValue={searchInput}
          onSearchChange={onSearchChange}
          onClearFilters={limpiarFiltros}
          onExportExcel={handleExportExcel}
          onExportPdf={handleExportPdf}
          exportLabel={`${total} registros · Listado de pacientes`}
        >
          <Select
            value={estado || "__todos__"}
            onValueChange={(v) => {
              setEstado(v === "__todos__" ? "" : v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__todos__">Todos los estados</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="inactivo">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </DataToolbar>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox />
                </TableHead>
                <TableHead>Nombre completo</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Nacimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargando && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Cargando pacientes...
                  </TableCell>
                </TableRow>
              )}
              {!cargando && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No se encontraron pacientes con los filtros aplicados.
                  </TableCell>
                </TableRow>
              )}
              {!cargando &&
                data.map((p, i) => (
                  <TableRow key={p.idPaciente} className={i % 2 ? "bg-muted/25" : undefined}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        to="/pacientes/$id"
                        params={{ id: String(p.idPaciente) }}
                        search={{ edit: false }}   // agregar que el edit sea opcional
                        className="hover:text-primary hover:underline"
                      >
                        {p.nombreCompleto}
                      </Link>

                      <span className="block text-xs text-muted-foreground">
                        P-{String(p.idPaciente).padStart(4, "0")}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.cedula}</TableCell>
                    <TableCell className="text-muted-foreground">{p.telefono}</TableCell>
                    <TableCell className="text-muted-foreground">{p.fechaNacimiento}</TableCell>
                    <TableCell>
                      <StatusBadge estado={p.estadoExpediente} />
                    </TableCell>
                    <TableCell>
                      <RowActions
                        label={p.nombreCompleto}
                        viewTo="/pacientes/$id"
                        viewParams={{ id: String(p.idPaciente) }}
                        onEdit={() =>
                          navigate({
                            to: "/pacientes/$id",
                            params: { id: String(p.idPaciente) },
                            search: { edit: true },
                          })
                        }
                        onPrint={() => handleImprimirFicha(p.idPaciente)}
                        onDelete={() => handleEliminar(p.idPaciente)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
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

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Registro de paciente</SheetTitle>
            <SheetDescription>Complete la información. Los campos con * son obligatorios.</SheetDescription>
          </SheetHeader>

          <div className="space-y-8 px-4">
            <section className="space-y-4">
              <h3 className="border-b border-border pb-2 text-sm font-semibold text-primary-dark">Datos personales</h3>
              <Campo label="Nombre completo" required>
                <Input
                  placeholder="Nombres y apellidos"
                  value={form.nombreCompleto}
                  onChange={(e) => actualizarCampo("nombreCompleto", e.target.value)}
                />
              </Campo>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Cédula" required>
                  <Input
                    placeholder="081-000000-0000X"
                    value={form.cedula}
                    onChange={(e) => actualizarCampo("cedula", e.target.value)}
                  />
                </Campo>
                <Campo label="Fecha de nacimiento" required>
                  <Input
                    type="date"
                    value={form.fechaNacimiento}
                    onChange={(e) => actualizarCampo("fechaNacimiento", e.target.value)}
                  />
                </Campo>
                <Campo label="Sexo" required>
                  <Select value={form.sexo} onValueChange={(v) => actualizarCampo("sexo", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                    </SelectContent>
                  </Select>
                </Campo>
                <Campo label="Ocupación">
                  <Input
                    placeholder="Ocupación"
                    value={form.ocupacion}
                    onChange={(e) => actualizarCampo("ocupacion", e.target.value)}
                  />
                </Campo>
              </div>
              <Campo label="Dirección">
                <Textarea
                  rows={2}
                  placeholder="Barrio, ciudad, referencias"
                  value={form.direccion}
                  onChange={(e) => actualizarCampo("direccion", e.target.value)}
                />
              </Campo>
            </section>

            <section className="space-y-4">
              <h3 className="border-b border-border pb-2 text-sm font-semibold text-primary-dark">Datos de contacto</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Teléfono" required>
                  <Input
                    placeholder="8888-0000"
                    value={form.telefono}
                    onChange={(e) => actualizarCampo("telefono", e.target.value)}
                  />
                </Campo>
                <Campo label="Correo electrónico">
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={form.correo}
                    onChange={(e) => actualizarCampo("correo", e.target.value)}
                  />
                </Campo>
              </div>
              <Campo label="Contacto de emergencia">
                <Input
                  placeholder="Nombre — Teléfono"
                  value={form.contactoEmergencia}
                  onChange={(e) => actualizarCampo("contactoEmergencia", e.target.value)}
                />
              </Campo>
            </section>

            <section className="space-y-4">
              <h3 className="border-b border-border pb-2 text-sm font-semibold text-primary-dark">
                Antecedentes relevantes
              </h3>
              <Campo label="Alergias">
                <Textarea
                  rows={2}
                  placeholder="Medicamentos, materiales, etc."
                  value={form.alergias}
                  onChange={(e) => actualizarCampo("alergias", e.target.value)}
                />
              </Campo>
              <Campo label="Enfermedades crónicas">
                <Textarea
                  rows={2}
                  value={form.cronicas}
                  onChange={(e) => actualizarCampo("cronicas", e.target.value)}
                />
              </Campo>
              <Campo label="Medicamentos actuales">
                <Textarea
                  rows={2}
                  value={form.medicamentos}
                  onChange={(e) => actualizarCampo("medicamentos", e.target.value)}
                />
              </Campo>
              <Campo label="Antecedentes familiares">
                <Textarea
                  rows={2}
                  value={form.familiares}
                  onChange={(e) => actualizarCampo("familiares", e.target.value)}
                />
              </Campo>
            </section>
          </div>

          <SheetFooter className="flex-row flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={() => handleGuardar(true)} disabled={guardando}>
              Guardar y agregar otro
            </Button>
            <Button onClick={() => handleGuardar(false)} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
