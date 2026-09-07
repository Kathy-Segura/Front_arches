import { Link } from "@tanstack/react-router";
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

export function Topbar() {
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
                MR
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-medium">Dra. M. F. Rivas</span>
                <span className="block text-[11px] text-muted-foreground">Administrador</span>
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
            <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
              <Link to="/">
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
