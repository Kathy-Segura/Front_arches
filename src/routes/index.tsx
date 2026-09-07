import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Mail, Stethoscope } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ARCHES — Acceso al sistema clínico odontológico" },
      {
        name: "description",
        content:
          "Inicie sesión en ARCHES, el sistema de gestión clínica de la Clínica de Salud Integral Odontológica en Chinandega.",
      },
      { property: "og:title", content: "ARCHES — Sistema de gestión clínica odontológica" },
      {
        property: "og:description",
        content: "Gestión de pacientes, citas, expedientes clínicos y reportes para clínicas dentales.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  return (
    <div className="bg-gradient-primary flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-card shadow-panel md:grid md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-soft p-10 md:flex">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary grid h-10 w-10 place-items-center rounded-xl font-bold text-primary-foreground">
              A
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">ARCHES</p>
              <p className="text-xs text-muted-foreground">Salud Integral Odontológica</p>
            </div>
          </div>
          <div>
            <Stethoscope className="mb-4 h-10 w-10 text-primary" strokeWidth={1.5} />
            <h2 className="text-2xl font-semibold">Gestión clínica ordenada y confiable</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Pacientes, agenda, expedientes odontológicos, tratamientos y reportes en un solo sistema.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">Chinandega, Nicaragua · Versión 1.0</p>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-8 md:hidden">
            <div className="bg-gradient-primary mb-3 grid h-10 w-10 place-items-center rounded-xl font-bold text-primary-foreground">
              A
            </div>
            <p className="text-lg font-semibold">ARCHES</p>
          </div>

          <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ingrese sus credenciales para acceder al sistema.</p>

          <form className="mt-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="correo">
                Correo o usuario <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="correo" placeholder="usuario@arches.ni" className="pl-9" defaultValue="mrivas@arches.ni" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clave">
                Contraseña <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="clave" type="password" placeholder="••••••••" className="pl-9" defaultValue="123456" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox id="recordar" /> Recordarme
              </label>
              <button type="button" className="text-sm font-medium text-primary hover:underline">
                ¿Olvidé mi contraseña?
              </button>
            </div>
            <Button asChild className="w-full" size="lg">
              <Link to="/dashboard">Ingresar</Link>
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Acceso restringido a personal autorizado de la clínica.
          </p>
        </div>
      </div>
    </div>
  );
}
