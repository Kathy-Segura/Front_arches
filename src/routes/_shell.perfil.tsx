import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Save, Mail, Phone, IdCard, ShieldCheck, CalendarDays, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { perfilApi } from "@/lib/api/perfil";
import type { ActividadPerfil, Perfil } from "@/types/perfil";

export const Route = createFileRoute("/_shell/perfil")({
  head: () => ({
    meta: [
      { title: "Mi perfil — ARCHES" },
      { name: "description", content: "Datos personales, credenciales de acceso y preferencias del usuario en ARCHES." },
      { property: "og:title", content: "Mi perfil — ARCHES" },
      { property: "og:description", content: "Datos personales, credenciales y preferencias del usuario." },
    ],
  }),
  component: PerfilPage,
});

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function mensajeError(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  const a = partes[0]?.[0] ?? "";
  const b = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (a + b).toUpperCase();
}

function activoDesde(p: Perfil): string | null {
  const iso = p.fechaIngreso ?? p.fechaCreacion?.slice(0, 10) ?? null;
  if (!iso) return null;
  const [y, m] = iso.split("-");
  const mes = MESES[Number(m) - 1];
  return mes && y ? `Activo desde ${mes} ${y}` : null;
}

function formatoFechaHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Reduce la imagen a 256px (lado mayor) y la devuelve como data URL JPEG. */
function reducirImagen(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("No se pudo procesar la imagen"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("El archivo no es una imagen válida"));
    };
    img.src = url;
  });
}

function PerfilPage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [actividad, setActividad] = useState<ActividadPerfil[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [cambiandoPass, setCambiandoPass] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const aplicarPerfil = (p: Perfil) => {
    setPerfil(p);
    setNombre(p.nombreCompleto);
    setCorreo(p.correo);
    setTelefono(p.telefono ?? "");
  };

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const [p, a] = await Promise.all([perfilApi.obtener(), perfilApi.actividad(10)]);
        if (!activo) return;
        aplicarPerfil(p);
        setActividad(a);
      } catch (e) {
        if (activo) setErrorCarga(mensajeError(e, "No se pudo cargar tu perfil"));
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  const hayCambios = useMemo(() => {
    if (!perfil) return false;
    return nombre !== perfil.nombreCompleto || correo !== perfil.correo || telefono !== (perfil.telefono ?? "");
  }, [perfil, nombre, correo, telefono]);

  const guardarDatos = async () => {
    if (!nombre.trim()) return toast.error("El nombre es obligatorio");
    if (!/^\S+@\S+\.\S+$/.test(correo.trim())) return toast.error("Ingresa un correo válido");
    setGuardando(true);
    try {
      const p = await perfilApi.actualizar({
        nombreCompleto: nombre.trim(),
        correo: correo.trim(),
        telefono: telefono.trim() === "" ? null : telefono.trim(),
      });
      aplicarPerfil(p);
      toast.success("Perfil actualizado correctamente");
    } catch (e) {
      toast.error(mensajeError(e, "No se pudo actualizar el perfil"));
    } finally {
      setGuardando(false);
    }
  };

  const cambiarContrasena = async () => {
    if (!actual || !nueva || !confirmar) return toast.error("Completa los tres campos de contraseña");
    if (nueva.length < 8) return toast.error("La nueva contraseña debe tener al menos 8 caracteres");
    if (nueva !== confirmar) return toast.error("La confirmación no coincide con la nueva contraseña");
    setCambiandoPass(true);
    try {
      await perfilApi.cambiarContrasena({
        contrasenaActual: actual,
        contrasenaNueva: nueva,
        confirmarContrasena: confirmar,
      });
      setActual("");
      setNueva("");
      setConfirmar("");
      toast.success("Contraseña actualizada");
    } catch (e) {
      toast.error(mensajeError(e, "No se pudo actualizar la contraseña"));
    } finally {
      setCambiandoPass(false);
    }
  };

  const toggleNotificaciones = async (valor: boolean) => {
    if (!perfil) return;
    const previo = perfil;
    setPerfil({ ...perfil, notificacionesCorreo: valor });
    try {
      const p = await perfilApi.actualizarPreferencias({ notificacionesCorreo: valor });
      setPerfil(p);
    } catch (e) {
      setPerfil(previo);
      toast.error(mensajeError(e, "No se pudo guardar la preferencia"));
    }
  };

  const onElegirFoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await reducirImagen(file);
      const p = await perfilApi.actualizarFoto({ foto: dataUrl });
      setPerfil(p);
      toast.success("Foto actualizada");
    } catch (e) {
      toast.error(mensajeError(e, "No se pudo actualizar la foto"));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const quitarFoto = async () => {
    try {
      const p = await perfilApi.actualizarFoto({ foto: null });
      setPerfil(p);
      toast.success("Foto eliminada");
    } catch (e) {
      toast.error(mensajeError(e, "No se pudo eliminar la foto"));
    }
  };

  if (cargando) {
    return (
      <>
        <PageHeader title="Mi perfil" description="Administra tus datos personales, seguridad y preferencias." breadcrumbs={[{ label: "Mi perfil" }]} />
        <p className="text-sm text-muted-foreground">Cargando tu perfil…</p>
      </>
    );
  }

  if (errorCarga || !perfil) {
    return (
      <>
        <PageHeader title="Mi perfil" description="Administra tus datos personales, seguridad y preferencias." breadcrumbs={[{ label: "Mi perfil" }]} />
        <p className="text-sm text-destructive">{errorCarga ?? "No se pudo cargar tu perfil"}</p>
      </>
    );
  }

  const desde = activoDesde(perfil);
  const subtitulo = perfil.especialidad ?? perfil.cargo;

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
            {perfil.foto ? (
              <img
                src={perfil.foto}
                alt={`Foto de ${perfil.nombreCompleto}`}
                className="h-24 w-24 rounded-full object-cover shadow-card"
              />
            ) : (
              <div className="bg-gradient-primary grid h-24 w-24 place-items-center rounded-full text-2xl font-semibold text-primary-foreground shadow-card">
                {iniciales(perfil.nombreCompleto)}
              </div>
            )}
            <p className="mt-4 text-lg font-semibold">{perfil.nombreCompleto}</p>
            {subtitulo && <p className="text-sm text-muted-foreground">{subtitulo}</p>}
            <Badge className="mt-3" variant="secondary">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" /> {perfil.rol}
            </Badge>

            <Separator className="my-5" />

            <div className="w-full space-y-3 text-left text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" /> {perfil.correo}
              </p>
              {perfil.telefono && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" /> {perfil.telefono}
                </p>
              )}
              {perfil.numeroLicencia && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <IdCard className="h-4 w-4" /> Cód. MINSA {perfil.numeroLicencia}
                </p>
              )}
              {perfil.cargo && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Stethoscope className="h-4 w-4" /> {perfil.cargo}
                </p>
              )}
              {desde && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" /> {desde}
                </p>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onElegirFoto(e.target.files?.[0])}
            />
            <Button variant="outline" className="mt-5 w-full" onClick={() => fileRef.current?.click()}>
              Cambiar foto
            </Button>
            {perfil.foto && (
              <Button variant="ghost" className="mt-2 w-full" onClick={() => void quitarFoto()}>
                Quitar foto
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:col-span-2">
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Datos personales</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="perfil-nombre">Nombre completo</Label>
                <Input id="perfil-nombre" value={nombre} maxLength={150} onChange={(e) => setNombre(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perfil-correo">Correo electrónico</Label>
                <Input id="perfil-correo" type="email" value={correo} maxLength={120} onChange={(e) => setCorreo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perfil-telefono">Teléfono</Label>
                <Input id="perfil-telefono" value={telefono} maxLength={20} onChange={(e) => setTelefono(e.target.value)} />
              </div>
              {perfil.cargo && (
                <>
                  <div className="space-y-2">
                    <Label>Especialidad</Label>
                    <Input value={perfil.especialidad ?? "Sin especialidad"} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Código MINSA</Label>
                    <Input value={perfil.numeroLicencia ?? "Sin registrar"} disabled />
                  </div>
                </>
              )}
              <div className="sm:col-span-2">
                <Button onClick={() => void guardarDatos()} disabled={guardando || !hayCambios}>
                  <Save className="h-4 w-4" /> {guardando ? "Guardando…" : "Guardar cambios"}
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
                <Label htmlFor="pass-actual">Contraseña actual</Label>
                <Input id="pass-actual" type="password" placeholder="••••••••" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pass-nueva">Nueva contraseña</Label>
                <Input id="pass-nueva" type="password" placeholder="••••••••" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pass-confirmar">Confirmar contraseña</Label>
                <Input id="pass-confirmar" type="password" placeholder="••••••••" autoComplete="new-password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={() => void cambiarContrasena()} disabled={cambiandoPass}>
                  {cambiandoPass ? "Actualizando…" : "Actualizar contraseña"}
                </Button>
              </div>
              <Separator className="sm:col-span-2" />
              <div className="flex items-center justify-between gap-4 sm:col-span-2">
                <div>
                  <p className="text-sm font-medium">Verificación en dos pasos</p>
                  <p className="text-xs text-muted-foreground">Próximamente: solicitar código al iniciar sesión.</p>
                </div>
                <Switch disabled aria-label="Verificación en dos pasos (próximamente)" />
              </div>
              <div className="flex items-center justify-between gap-4 sm:col-span-2">
                <div>
                  <p className="text-sm font-medium">Notificaciones por correo</p>
                  <p className="text-xs text-muted-foreground">Resumen diario de agenda y alertas.</p>
                </div>
                <Switch
                  checked={perfil.notificacionesCorreo}
                  onCheckedChange={(v) => void toggleNotificaciones(v)}
                  aria-label="Notificaciones por correo"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Actividad reciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {actividad.length === 0 && (
                <p className="text-sm text-muted-foreground">Aún no hay actividad registrada.</p>
              )}
              {actividad.map((a) => (
                <div key={a.idBitacora} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{a.accion}</p>
                    <p className="text-xs text-muted-foreground">{formatoFechaHora(a.fechaHora)}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.modulo}
                    {a.direccionIp ? ` · ${a.direccionIp}` : ""}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
