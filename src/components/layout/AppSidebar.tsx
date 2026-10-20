import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  UserCog,
  CalendarDays,
  FileHeart,
  Stethoscope,
  IdCard,
  BarChart3,
  Settings,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { puede } from "@/lib/permisos";

/** modulo = nombre en modulos_sistema; null = visible para cualquier usuario con sesión. */
const grupos = [
  {
    label: "Operación diaria",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, modulo: null },
      { title: "Pacientes", url: "/pacientes", icon: Users, modulo: "Pacientes" },
      { title: "Agenda y Citas", url: "/citas", icon: CalendarDays, modulo: "Agenda y Citas" },
      { title: "Expediente Clínico", url: "/expedientes", icon: FileHeart, modulo: "Expediente Clínico" },
    ],
  },
  {
    label: "Clínica",
    items: [
      { title: "Procedimientos", url: "/procedimientos", icon: Stethoscope, modulo: "Procedimientos" },
      { title: "Tratamientos", url: "/tratamientos", icon: ClipboardList, modulo: "Procedimientos" },
      { title: "Personal", url: "/personal", icon: IdCard, modulo: "Configuración" },
    ],
  },
  {
    label: "Administración",
    items: [
      { title: "Reportes", url: "/reportes", icon: BarChart3, modulo: "Reportes" },
      { title: "Usuarios", url: "/usuarios", icon: UserCog, modulo: "Usuarios" },
      { title: "Roles y Permisos", url: "/roles", icon: ShieldCheck, modulo: "Roles y Permisos" },
      { title: "Configuración", url: "/configuracion", icon: Settings, modulo: "Configuración" },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  // Solo los módulos que el rol del usuario puede ver; los grupos que quedan vacíos no se muestran.
  const visibles = grupos
    .map((g) => ({ ...g, items: g.items.filter((i) => i.modulo === null || puede(i.modulo)) }))
    .filter((g) => g.items.length > 0);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-primary grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold text-primary-foreground shadow-card">
            A
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">ARCHES</p>
              <p className="truncate text-[11px] text-muted-foreground">Salud Integral Odontológica</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        {visibles.map((grupo) => (
          <SidebarGroup key={grupo.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[11px] tracking-wide uppercase">{grupo.label}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {grupo.items.map((item) => {
                  const active = pathname === item.url || pathname.startsWith(item.url + "/");
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <Link to={item.url as any} className="gap-3">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {!collapsed && (
        <SidebarFooter className="border-t border-sidebar-border p-4">
          <div className="rounded-xl bg-primary-soft p-3">
            <p className="text-xs font-medium text-primary-dark">Clínica Chinandega</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Versión 1.0 · Prototipo de tesis</p>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
