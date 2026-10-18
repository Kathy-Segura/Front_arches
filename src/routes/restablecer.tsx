import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";
import { validarContrasenaNueva } from "@/lib/auth";

export const Route = createFileRoute("/restablecer")({
  validateSearch: (search: Record<string, unknown>): { token: string } => {
    const token = search["token"]; // noPropertyAccessFromIndexSignature: acceso con corchetes
    return { token: typeof token === "string" ? token : "" };
  },
  head: () => ({ meta: [{ title: "Nueva contraseña — ARCHES" }] }),
  component: Restablecer,
});

function Restablecer() {
  const { token } = Route.useSearch();
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const problema = validarContrasenaNueva(nueva) ?? (nueva !== confirmar ? "Las contraseñas no coinciden" : null);
    if (problema) {
      setError(problema);
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      setListo((await authApi.restablecer(token, nueva)).message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la contraseña");
    } finally {
      setEnviando(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout title="Enlace no válido">
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">Este enlace está incompleto. Solicite uno nuevo.</p>
          <Button asChild className="w-full">
            <Link to="/recuperar">Solicitar nuevo enlace</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (listo) {
    return (
      <AuthLayout title="Contraseña actualizada">
        <div className="space-y-5 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          <p className="text-sm text-muted-foreground">{listo}</p>
          <Button asChild className="w-full">
            <Link to="/login">Iniciar sesión</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Nueva contraseña" subtitle="Mínimo 8 caracteres, combinando letras y números.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="nueva">Nueva contraseña</Label>
          <Input id="nueva" type="password" autoComplete="new-password" value={nueva}
            onChange={(e) => setNueva(e.target.value)} disabled={enviando} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmar">Confirmar contraseña</Label>
          <Input id="confirmar" type="password" autoComplete="new-password" value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)} disabled={enviando} />
        </div>
        {error && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}{" "}
            {error.includes("enlace") && (
              <Link to="/recuperar" className="font-medium underline">
                Solicitar otro
              </Link>
            )}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={enviando}>
          {enviando && <Loader2 className="h-4 w-4 animate-spin" />} Guardar contraseña
        </Button>
      </form>
    </AuthLayout>
  );
}