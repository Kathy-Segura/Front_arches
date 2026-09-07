import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_shell/configuracion")({
  head: () => ({
    meta: [
      { title: "Configuración y seguridad — ARCHES" },
      { name: "description", content: "Parámetros generales, datos de la clínica y notificaciones del sistema." },
      { property: "og:title", content: "Configuración y seguridad — ARCHES" },
      { property: "og:description", content: "Parámetros generales, datos de la clínica y notificaciones." },
    ],
  }),
  component: Configuracion,
});

function Configuracion() {
  return (
    <>
      <PageHeader
        title="Configuración y seguridad"
        description="Parámetros generales del sistema."
        breadcrumbs={[{ label: "Configuración" }]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Datos de la clínica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la clínica</Label>
              <Input defaultValue="Clínica de Salud Integral Odontológica" />
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <Input type="file" />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Textarea rows={2} defaultValue="Chinandega, Nicaragua" />
            </div>
            <div className="space-y-2">
              <Label>Horario general de atención</Label>
              <Input defaultValue="Lun–Vie 08:00–17:00 · Sáb 08:00–12:00" />
            </div>
            <Button onClick={() => toast.success("Parámetros guardados correctamente")}>
              <Save className="h-4 w-4" /> Guardar
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Notificaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              "Recordatorio de cita al paciente (24h antes)",
              "Alerta de tratamientos con pago pendiente",
              "Aviso de respaldo fallido",
              "Resumen diario de agenda por correo",
            ].map((n, i) => (
              <div key={n} className="flex items-center justify-between gap-4">
                <span className="text-sm">{n}</span>
                <Switch defaultChecked={i < 2} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
