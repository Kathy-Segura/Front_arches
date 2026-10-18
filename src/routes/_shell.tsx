import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { estaAutenticado } from "@/lib/auth";

export const Route = createFileRoute("/_shell")({
  component: ShellLayout,
});

function ShellLayout() {
  const navigate = useNavigate();
  const [listo, setListo] = useState(false);

  // La sesión vive en el navegador (localStorage/sessionStorage), por eso se revisa aquí
  // y no en beforeLoad, que también se ejecuta en el servidor (SSR) donde no existe.
  useEffect(() => {
    if (estaAutenticado()) {
      setListo(true);
    } else {
      void navigate({ to: "/login" });
    }
  }, [navigate]);

  if (!listo) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        <AppSidebar />
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
