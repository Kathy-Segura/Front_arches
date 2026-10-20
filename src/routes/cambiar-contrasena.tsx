import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";
import {
  cerrarSesion,
  debeCambiarContrasena,
  estaAutenticado,
  marcarContrasenaCambiada,
  validarContrasenaNueva,
} from "@/lib/auth";

export const Route = createFileRoute("/cambiar-contrasena")({
  head: () => ({ meta: [{ title: "Cambiar contraseña — ARCHES" }] }),
  component: CambiarContrasena,
});

function CambiarContrasena() {
  const navigate = useNavigate();
  const [forzado, setForzado] = useState(false);
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!estaAutenticado()) {
      void navigate({ to: "/login" });
      return;
    }
    setForzado(debeCambiarContrasena());
  }, [navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!actual) {
      setError("Ingrese su contraseña actual");
      return;
    }
    const problema = validarContrasenaNueva(nueva) ?? (nueva !== confirmar ? "Las contraseñas no coinciden" : null);
    if (problema) {
      setError(problema);
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await authApi.cambiarContrasena({ contrasenaActual: actual, contrasenaNueva: nueva });
      marcarContrasenaCambiada();
      toast.success("Contraseña actualizada correctamente");
      await navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña");
    } finally {
      setEnviando(false);
    }
  }

  function salir() {
    cerrarSesion();
    void navigate({ to: "/login" });
  }

  return (
    <AuthLayout
      title="Cambiar contraseña"
      subtitle={
        forzado
          ? "Su contraseña es temporal. Cree una nueva para continuar."
          : "Mínimo 8 caracteres, combinando letras y números."
      }
      footer={
        <button type="button" onClick={salir} className="font-medium text-primary hover:underline">
          Cerrar sesión
        </button>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="actual">{forzado ? "Contraseña temporal" : "Contraseña actual"}</Label>
          <div className="relative">
            <Input
              id="actual"
              type={mostrar ? "text" : "password"}
              autoComplete="current-password"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              disabled={enviando}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setMostrar((v) => !v)}
              aria-label={mostrar ? "Ocultar contraseñas" : "Mostrar contraseñas"}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
            >
              {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nueva">Nueva contraseña</Label>
          <Input
            id="nueva"
            type={mostrar ? "text" : "password"}
            autoComplete="new-password"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            disabled={enviando}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmar">Confirmar nueva contraseña</Label>
          <Input
            id="confirmar"
            type={mostrar ? "text" : "password"}
            autoComplete="new-password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            disabled={enviando}
          />
        </div>
        {error && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={enviando}>
          {enviando && <Loader2 className="h-4 w-4 animate-spin" />} Guardar contraseña
        </Button>
      </form>
    </AuthLayout>
  );
}
