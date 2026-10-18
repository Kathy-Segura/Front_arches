import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";

export const Route = createFileRoute("/recuperar")({
  head: () => ({ meta: [{ title: "Recuperar contraseña — ARCHES" }] }),
  component: Recuperar,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Recuperar() {
  const [correo, setCorreo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(correo.trim())) {
      setError("Ingrese un correo válido");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      setMensaje((await authApi.recuperar(correo.trim())).message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo procesar la solicitud");
    } finally {
      setEnviando(false);
    }
  }

  const volver = (
    <Link to="/login" className="font-medium text-primary hover:underline">
      Volver a iniciar sesión
    </Link>
  );

  if (mensaje) {
    return (
      <AuthLayout title="Revise su correo" footer={volver}>
        <div className="space-y-4 text-center">
          <MailCheck className="mx-auto h-12 w-12 text-primary" />
          <p className="text-sm text-muted-foreground">{mensaje}</p>
          <p className="text-xs text-muted-foreground">El enlace vence en 30 minutos y solo puede usarse una vez.</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Ingrese el correo de su cuenta y le enviaremos un enlace para crear una nueva contraseña."
      footer={volver}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="correo">Correo</Label>
          <Input id="correo" type="email" autoComplete="email" value={correo}
            onChange={(e) => setCorreo(e.target.value)} disabled={enviando} />
        </div>
        {error && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={enviando}>
          {enviando && <Loader2 className="h-4 w-4 animate-spin" />} Enviar enlace
        </Button>
      </form>
    </AuthLayout>
  );
}
