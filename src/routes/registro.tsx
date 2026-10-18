import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authApi } from "@/lib/api/auth";
import { validarContrasenaNueva } from "@/lib/auth";
import type { RolDTO } from "@/types/rol";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Solicitar acceso — ARCHES" },
      { name: "description", content: "Registro de nuevos usuarios del sistema ARCHES." },
    ],
  }),
  component: Registro,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Registro() {
  const [roles, setRoles] = useState<RolDTO[]>([]);
  const [cargandoRoles, setCargandoRoles] = useState(true);

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [idRol, setIdRol] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrar, setMostrar] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    authApi
      .roles(ac.signal)
      .then(setRoles)
      .catch((e: unknown) => {
        if (!ac.signal.aborted) setError(e instanceof Error ? e.message : "No se pudo cargar la lista de roles");
      })
      .finally(() => {
        if (!ac.signal.aborted) setCargandoRoles(false);
      });
    return () => ac.abort();
  }, []);

  function validar(): string | null {
    if (!nombreCompleto.trim()) return "Ingrese su nombre completo";
    if (!EMAIL_RE.test(correo.trim())) return "Ingrese un correo válido";
    if (telefono.trim().length > 20) return "El teléfono no puede superar 20 caracteres";
    if (!idRol) return "Seleccione un rol";
    const pass = validarContrasenaNueva(contrasena);
    if (pass) return pass;
    if (contrasena !== confirmar) return "Las contraseñas no coinciden";
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const problema = validar();
    if (problema) {
      setError(problema);
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const r = await authApi.registro({
        nombreCompleto: nombreCompleto.trim(),
        correo: correo.trim(),
        telefono: telefono.trim() || null,
        idRol: Number(idRol),
        contrasena,
      });
      setExito(r.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar el registro");
    } finally {
      setEnviando(false);
    }
  }

  if (exito) {
    return (
      <AuthLayout title="Solicitud enviada">
        <div className="space-y-5 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          <p className="text-sm text-muted-foreground">{exito}</p>
          <Button asChild className="w-full">
            <Link to="/login">Ir a iniciar sesión</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Solicitar acceso"
      subtitle="Complete sus datos. Un administrador aprobará su cuenta."
      footer={
        <>
          ¿Ya tiene cuenta?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre completo</Label>
          <Input id="nombre" value={nombreCompleto} maxLength={150} autoComplete="name"
            onChange={(e) => setNombreCompleto(e.target.value)} disabled={enviando} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="correo">Correo</Label>
            <Input id="correo" type="email" value={correo} maxLength={120} autoComplete="email"
              onChange={(e) => setCorreo(e.target.value)} disabled={enviando} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono (opcional)</Label>
            <Input id="telefono" type="tel" value={telefono} maxLength={20} autoComplete="tel"
              onChange={(e) => setTelefono(e.target.value)} disabled={enviando} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rol">Rol solicitado</Label>
          <Select value={idRol} onValueChange={setIdRol} disabled={cargandoRoles || enviando}>
            <SelectTrigger id="rol">
              <SelectValue placeholder={cargandoRoles ? "Cargando roles…" : "Seleccione un rol"} />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.idRol} value={String(r.idRol)}>
                  {r.nombreRol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pass">Contraseña</Label>
            <div className="relative">
              <Input id="pass" type={mostrar ? "text" : "password"} value={contrasena} autoComplete="new-password"
                onChange={(e) => setContrasena(e.target.value)} disabled={enviando} className="pr-10" />
              <button type="button" onClick={() => setMostrar((v) => !v)}
                aria-label={mostrar ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground">
                {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmar">Confirmar contraseña</Label>
            <Input id="confirmar" type={mostrar ? "text" : "password"} value={confirmar} autoComplete="new-password"
              onChange={(e) => setConfirmar(e.target.value)} disabled={enviando} />
          </div>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">Mínimo 8 caracteres, combinando letras y números.</p>

        {error && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={enviando || cargandoRoles}>
          {enviando && <Loader2 className="h-4 w-4 animate-spin" />} Enviar solicitud
        </Button>
      </form>
    </AuthLayout>
  );
}
