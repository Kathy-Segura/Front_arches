import { createFileRoute, notFound } from "@tanstack/react-router";
import { Printer, Save, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Odontograma } from "@/components/clinical/Odontograma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { diagnosticos, evolucion, pacientes, planTratamiento } from "@/lib/mock-data";

export const Route = createFileRoute("/_shell/expedientes/$id")({
  loader: ({ params }) => {
    const paciente = pacientes.find((p) => p.id === params.id);
    if (!paciente) throw notFound();
    return { paciente };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `Expediente de ${loaderData.paciente.nombre} — ARCHES` : "Expediente — ARCHES" },
      { name: "description", content: "Historia clínica, odontograma interactivo, diagnósticos y evolución." },
      { property: "og:title", content: "Expediente clínico odontológico — ARCHES" },
      { property: "og:description", content: "Historia clínica, odontograma interactivo, diagnósticos y evolución." },
    ],
  }),
  component: Expediente,
});

const habitos = ["Tabaquismo", "Bruxismo", "Consumo de alcohol", "Onicofagia", "Respirador bucal", "Uso de hilo dental"];

function Expediente() {
  const { paciente: p } = Route.useLoaderData();

  return (
    <>
      <PageHeader
        title={`Expediente clínico — ${p.nombre}`}
        description={`${p.id} · ${p.cedula} · ${p.sexo}`}
        breadcrumbs={[{ label: "Expediente Clínico", to: "/expedientes" }, { label: p.nombre }]}
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success("Expediente completo enviado a impresión")}>
              <Printer className="h-4 w-4" /> Imprimir expediente
            </Button>
            <Button onClick={() => toast.success("Cambios guardados correctamente")}>
              <Save className="h-4 w-4" /> Guardar cambios
            </Button>
          </>
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

        <TabsContent value="historia" className="mt-4 space-y-6">
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Antecedentes médicos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Alergias</Label>
                <Textarea rows={2} defaultValue={p.alergias} />
              </div>
              <div className="space-y-2">
                <Label>Enfermedades crónicas</Label>
                <Textarea rows={2} defaultValue={p.cronicas} />
              </div>
              <div className="space-y-2">
                <Label>Medicamentos actuales</Label>
                <Textarea rows={2} defaultValue={p.medicamentos} />
              </div>
              <div className="space-y-2">
                <Label>Antecedentes familiares</Label>
                <Textarea rows={2} defaultValue={p.familiares} />
              </div>
              <div className="space-y-2">
                <Label>Presión arterial</Label>
                <Input defaultValue="120/80 mmHg" />
              </div>
              <div className="space-y-2">
                <Label>¿Embarazo actual?</Label>
                <Input defaultValue="No aplica" />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle className="text-base">Antecedentes odontológicos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Motivo de consulta inicial</Label>
                  <Textarea rows={2} defaultValue="Dolor en molar inferior izquierdo al masticar." />
                </div>
                <div className="space-y-2">
                  <Label>Tratamientos previos</Label>
                  <Textarea rows={3} defaultValue="Extracciones 2019, resinas 2022, profilaxis semestral." />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle className="text-base">Hábitos</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {habitos.map((h, i) => (
                  <label key={h} className="flex items-center gap-2.5 text-sm">
                    <Checkbox defaultChecked={i === 1} /> {h}
                  </label>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="odontograma" className="mt-4">
          <Odontograma />
        </TabsContent>

        <TabsContent value="diagnosticos" className="mt-4">
          <Card className="overflow-hidden border-border p-0 shadow-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-sm font-semibold">Diagnósticos registrados</h3>
              <Button size="sm" onClick={() => toast.info("Nuevo diagnóstico")}>
                <Plus className="h-4 w-4" /> Agregar diagnóstico
              </Button>
            </div>
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Diagnóstico</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Odontólogo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diagnosticos.map((d, i) => (
                  <TableRow key={d.fecha} className={i % 2 ? "bg-muted/25" : undefined}>
                    <TableCell className="whitespace-nowrap">{d.fecha}</TableCell>
                    <TableCell className="font-medium">{d.diagnostico}</TableCell>
                    <TableCell className="text-muted-foreground">{d.descripcion}</TableCell>
                    <TableCell className="text-muted-foreground">{d.odontologo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          <Card className="overflow-hidden border-border p-0 shadow-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-sm font-semibold">Plan de tratamiento propuesto</h3>
              <Button size="sm" onClick={() => toast.info("Nuevo tratamiento propuesto")}>
                <Plus className="h-4 w-4" /> Agregar tratamiento
              </Button>
            </div>
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
                {planTratamiento.map((t, i) => (
                  <TableRow key={t.procedimiento} className={i % 2 ? "bg-muted/25" : undefined}>
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
        </TabsContent>

        <TabsContent value="evolucion" className="mt-4">
          <Card className="border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Bitácora de evolución</CardTitle>
              <Button size="sm" onClick={() => toast.info("Nueva nota clínica")}>
                <Plus className="h-4 w-4" /> Nueva nota
              </Button>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-6 border-l border-border pl-6">
                {evolucion.map((e) => (
                  <li key={e.fecha}>
                    <span className="absolute -left-[7px] mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary" />
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="text-sm font-semibold">{e.fecha}</p>
                      <p className="text-xs text-muted-foreground">{e.odontologo}</p>
                    </div>
                    <p className="mt-1.5 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">{e.nota}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
