import { createFileRoute } from "@tanstack/react-router";
import { Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { modulosPermisos, roles } from "@/lib/mock-data";

export const Route = createFileRoute("/_shell/roles")({
  head: () => ({
    meta: [
      { title: "Roles y permisos — ARCHES" },
      { name: "description", content: "Matriz de permisos por módulo para cada rol del sistema clínico." },
      { property: "og:title", content: "Roles y permisos — ARCHES" },
      { property: "og:description", content: "Matriz de permisos por módulo para cada rol del sistema clínico." },
    ],
  }),
  component: Roles,
});

const acciones = ["Ver", "Crear", "Editar", "Eliminar"] as const;

function permisoDefecto(rol: string, modulo: string, accion: string) {
  if (rol === "Administrador") return true;
  if (rol === "Odontólogo")
    return ["Pacientes", "Agenda y Citas", "Expediente Clínico", "Procedimientos", "Reportes"].includes(modulo) && accion !== "Eliminar";
  if (rol === "Recepcionista")
    return ["Pacientes", "Agenda y Citas"].includes(modulo) && accion !== "Eliminar";
  return accion === "Ver" && ["Pacientes", "Agenda y Citas"].includes(modulo);
}

function Roles() {
  return (
    <>
      <PageHeader
        title="Roles y permisos"
        description="Defina qué puede hacer cada rol dentro de los módulos del sistema."
        breadcrumbs={[{ label: "Roles y Permisos" }]}
        actions={
          <Button onClick={() => toast.success("Permisos actualizados correctamente")}>
            <Save className="h-4 w-4" /> Guardar permisos
          </Button>
        }
      />

      <Tabs defaultValue="Administrador">
        <TabsList className="flex-wrap">
          {roles.map((r) => (
            <TabsTrigger key={r} value={r}>
              {r}
            </TabsTrigger>
          ))}
        </TabsList>

        {roles.map((rol) => (
          <TabsContent key={rol} value={rol} className="mt-4">
            <Card className="overflow-hidden border-border p-0 shadow-card">
              <CardHeader className="border-b border-border bg-gradient-soft py-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Permisos del rol: {rol}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/60">
                      <TableRow>
                        <TableHead className="min-w-44">Módulo</TableHead>
                        {acciones.map((a) => (
                          <TableHead key={a} className="text-center">
                            {a}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modulosPermisos.map((m, i) => (
                        <TableRow key={m} className={i % 2 ? "bg-muted/25" : undefined}>
                          <TableCell className="font-medium">{m}</TableCell>
                          {acciones.map((a) => (
                            <TableCell key={a} className="text-center">
                              <Checkbox defaultChecked={permisoDefecto(rol, m, a)} />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
