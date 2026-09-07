import { createFileRoute } from "@tanstack/react-router";
import { Save, Mail, Phone, IdCard, ShieldCheck, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_shell/perfil")({
  head: () => ({
    meta: [
      { title: "Mi perfil — ARCHES" },
      { name: "description", content: "Datos personales, credenciales de acceso y preferencias del usuario en ARCHES." },
      { property: "og:title", content: "Mi perfil — ARCHES" },
      { property: "og:description", content: "Datos personales, credenciales y preferencias del usuario." },
    ],
  }),
  component: Perfil,
});

const actividad = [
  { accion: "Inicio de sesión", fecha: "13/08/2026 13:40", detalle: "Navegador Chrome · 190.120.4.22" },
  { accion: "Registro de cita C-1042", fecha: "13/08/2026 11:12", detalle: "Módulo Agenda y Citas" },
  { accion: "Actualización de expediente EXP-0231", fecha: "12/08/2026 16:55", detalle: "Módulo Expediente Clínico" },
  { accion: "Generación de reporte mensual", fecha: "12/08/2026 09:20", detalle: "Módulo Reportes" },
];

function Perfil() {
  return (
    <>
      <PageHeader
        title="Mi perfil"
        description="Administra tus datos personales, seguridad y preferencias."
        breadcrumbs={[{ label: "Mi perfil" }]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border shadow-card">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="bg-gradient-primary grid h-24 w-24 place-items-center rounded-full text-2xl font-semibold text-primary-foreground shadow-card">
              MR
            </div>
            <p className="mt-4 text-lg font-semibold">Dra. María F. Rivas</p>
            <p className="text-sm text-muted-foreground">Odontóloga general</p>
            <Badge className="mt-3" variant="secondary">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Administrador
            </Badge>

            <Separator className="my-5" />

            <div className="w-full space-y-3 text-left text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" /> mf.rivas@arches.ni
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" /> +505 8842 1190
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <IdCard className="h-4 w-4" /> Cód. MINSA 20841
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4" /> Activo desde enero 2024
              </p>
            </div>

            <Button variant="outline" className="mt-5 w-full" onClick={() => toast.info("Selecciona una nueva foto")}>
              Cambiar foto
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:col-span-2">
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Datos personales</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombres</Label>
                <Input defaultValue="María Fernanda" />
              </div>
              <div className="space-y-2">
                <Label>Apellidos</Label>
                <Input defaultValue="Rivas González" />
              </div>
              <div className="space-y-2">
                <Label>Correo electrónico</Label>
                <Input type="email" defaultValue="mf.rivas@arches.ni" />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input defaultValue="+505 8842 1190" />
              </div>
              <div className="space-y-2">
                <Label>Especialidad</Label>
                <Input defaultValue="Odontología general" />
              </div>
              <div className="space-y-2">
                <Label>Cédula</Label>
                <Input defaultValue="081-120389-0004R" />
              </div>
              <div className="sm:col-span-2">
                <Button onClick={() => toast.success("Perfil actualizado correctamente")}>
                  <Save className="h-4 w-4" /> Guardar cambios
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Seguridad</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Contraseña actual</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Nueva contraseña</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Confirmar contraseña</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={() => toast.success("Contraseña actualizada")}>
                  Actualizar contraseña
                </Button>
              </div>
              <Separator className="sm:col-span-2" />
              <div className="flex items-center justify-between gap-4 sm:col-span-2">
                <div>
                  <p className="text-sm font-medium">Verificación en dos pasos</p>
                  <p className="text-xs text-muted-foreground">Solicitar código al iniciar sesión.</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between gap-4 sm:col-span-2">
                <div>
                  <p className="text-sm font-medium">Notificaciones por correo</p>
                  <p className="text-xs text-muted-foreground">Resumen diario de agenda y alertas.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Actividad reciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {actividad.map((a) => (
                <div key={a.accion} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{a.accion}</p>
                    <p className="text-xs text-muted-foreground">{a.fecha}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.detalle}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
