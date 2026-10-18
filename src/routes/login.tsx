import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authApi } from "@/lib/api/auth";
import { estaAutenticado, guardarSesion, ultimoUsuarioId } from "@/lib/auth";
import type { UsuarioLoginItem } from "@/types/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — ARCHES" },
      { name: "description", content: "Acceso al sistema de gestión clínica ARCHES." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState<UsuarioLoginItem[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [idUsuario, setIdUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [recordarme, setRecordarme] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (estaAutenticado()) {
      void navigate({ to: "/dashboard" });
      return;
    }
    const ac = new AbortController();
    authApi
      .usuariosLogin(ac.signal)
      .then((lista) => {
        setUsuarios(lista);
        const ultimo = ultimoUsuarioId();
        if (ultimo !== null && lista.some((u) => u.idUsuario === ultimo)) {
          setIdUsuario(String(ultimo));
          setRecordarme(true);
        }
      })
      .catch((e: unknown) => {
        if (ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : "No se pudo cargar la lista de usuarios");
      })
      .finally(() => {
        if (!ac.signal.aborted) setCargandoUsuarios(false);
      });
    return () => ac.abort();
  }, [navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!idUsuario) {
      setError("Seleccione su usuario");
      return;
    }
    if (!contrasena) {
      setError("Ingrese su contraseña");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const r = await authApi.login({ idUsuario: Number(idUsuario), contrasena, recordarme });
      guardarSesion(r, recordarme);
      toast.success(`Bienvenido(a), ${r.usuario.nombreCompleto}`);
      await navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
      setContrasena("");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle="Seleccione su usuario e ingrese su contraseña."
      footer={
        <>
          ¿No tiene cuenta?{" "}
          <Link to="/registro" className="font-medium text-primary hover:underline">
            Solicitar acceso
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="usuario">Usuario</Label>
          <Select value={idUsuario} onValueChange={setIdUsuario} disabled={cargandoUsuarios || enviando}>
            <SelectTrigger id="usuario">
              <SelectValue placeholder={cargandoUsuarios ? "Cargando usuarios…" : "Seleccione su nombre"} />
            </SelectTrigger>
            <SelectContent>
              {usuarios.map((u) => (
                <SelectItem key={u.idUsuario} value={String(u.idUsuario)}>
                  {u.nombreCompleto}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contrasena">Contraseña</Label>
          <div className="relative">
            <Input
              id="contrasena"
              type={mostrar ? "text" : "password"}
              autoComplete="current-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              disabled={enviando}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setMostrar((v) => !v)}
              aria-label={mostrar ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
            >
              {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={recordarme} onCheckedChange={(v) => setRecordarme(v === true)} />
            Recordarme
          </label>
          <Link to="/recuperar" className="text-sm font-medium text-primary hover:underline">
            ¿Olvidó su contraseña?
          </Link>
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={enviando || cargandoUsuarios}>
          {enviando && <Loader2 className="h-4 w-4 animate-spin" />} Ingresar
        </Button>
      </form>
    </AuthLayout>
  );
}
