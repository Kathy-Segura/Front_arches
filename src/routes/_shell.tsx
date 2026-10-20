import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { authApi } from "@/lib/api/auth";
import { actualizarSesion, debeCambiarContrasena, estaAutenticado } from "@/lib/auth";
import { puedeAccederARuta } from "@/lib/permisos";

export const Route = createFileRoute("/_shell")({
  component: ShellLayout,
});

function ShellLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [listo, setListo] = useState(false);
  const [version, setVersion] = useState(0); // fuerza a repintar el menú cuando llegan permisos nuevos

  // La sesión vive en el navegador (localStorage/sessionStorage), por eso se revisa aquí
  // y no en beforeLoad, que también se ejecuta en el servidor (SSR) donde no existe.
  useEffect(() => {
    if (!estaAutenticado()) {
      void navigate({ to: "/login" });
      return;
    }
    if (debeCambiarContrasena()) {
      void navigate({ to: "/cambiar-contrasena" });
      return;
    }
    setListo(true);

    // Permisos frescos: lo que un administrador cambie en Roles y Permisos se aplica sin volver a iniciar sesión.
    authApi
      .me()
      .then((s) => {
        actualizarSesion(s);
        if (s.debeCambiarContrasena) void navigate({ to: "/cambiar-contrasena" });
        else setVersion((v) => v + 1);
      })
      .catch(() => {
        /* sin conexión: se usan los permisos guardados; en un 401 la clase http cierra la sesión */
      });
  }, [navigate]);

  const permitido = listo && puedeAccederARuta(pathname);

  useEffect(() => {
    if (listo && !puedeAccederARuta(pathname)) {
      toast.error("No tiene acceso a ese módulo");
      void navigate({ to: "/dashboard" });
    }
  }, [listo, pathname, version, navigate]);

  if (!permitido) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        <AppSidebar key={version} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
