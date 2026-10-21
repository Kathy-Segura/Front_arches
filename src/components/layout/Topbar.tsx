import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Search, User, ChevronDown } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cerrarSesion } from "@/lib/auth";
import { perfilApi } from "@/lib/api/perfil"; // ajusta la ruta si perfil.ts vive en otro lado
import type { Perfil } from "@/types/perfil";

/** Iniciales para el avatar: primera letra de las dos primeras palabras. */
function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "U";
  const a = partes[0]?.[0] ?? "";
  const b = partes.length > 1 ? (partes[1]?.[0] ?? "") : "";
  return (a + b).toUpperCase();
}

/** Tolera que el rol venga como texto o como objeto { nombreRol }. */
function leerRol(perfil: Perfil | null): string {
  if (!perfil) return "";
  const rol = (perfil as unknown as { rol?: unknown }).rol;
  if (typeof rol === "string") return rol;
  if (rol && typeof rol === "object") {
    const r = rol as { nombreRol?: string; nombre?: string };
    return r.nombreRol ?? r.nombre ?? "";
  }
  return "";
}

export function Topbar() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  useEffect(() => {
    let activo = true;

    const cargar = () => {
      perfilApi
        .obtener()
        .then((p) => {
          if (activo) setPerfil(p);
        })
        .catch(() => {
          /* se queda el respaldo "Usuario" */
        });
    };

    cargar();
    // La pantalla de perfil puede disparar este evento tras guardar, para refrescar el nombre.
    window.addEventListener("perfil:actualizado", cargar);
    return () => {
      activo = false;
      window.removeEventListener("perfil:actualizado", cargar);
    };
  }, []);

  const nombre =
    (perfil as unknown as { nombreCompleto?: string } | null)?.nombreCompleto?.trim() || "Usuario";
  const rol = leerRol(perfil);

  const handleCerrarSesion = () => {
    cerrarSesion();
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
      <SidebarTrigger className="shrink-0" />

      <div className="relative min-w-0 flex-1 md:max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar paciente, cita o expediente..." className="pl-9" />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {[
              "3 citas por confirmar para mañana",
              "Tratamiento T-501 con pago pendiente",
              "Respaldo automático completado",
            ].map((n) => (
              <DropdownMenuItem key={n} className="text-sm whitespace-normal">
                {n}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <span className="bg-gradient-primary grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold text-primary-foreground">
                {iniciales(nombre)}
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-medium">{nombre}</span>
                {rol && <span className="block text-[11px] text-muted-foreground">{rol}</span>}
              </span>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/perfil">
                <User className="h-4 w-4" /> Mi perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleCerrarSesion}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}