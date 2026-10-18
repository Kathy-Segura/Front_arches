import type { ReactNode } from "react";
import { Stethoscope } from "lucide-react";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Marco común de login, registro y recuperación: panel de marca a la izquierda y tarjeta con el formulario. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="bg-gradient-primary hidden flex-col justify-between p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15">
            <Stethoscope className="h-6 w-6" />
          </div>
          <span className="text-xl font-semibold tracking-wide">ARCHES</span>
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold leading-tight">Sistema de gestión clínica odontológica</h2>
          <p className="max-w-md text-primary-foreground/80">
            Pacientes, citas, expedientes y tratamientos en un solo lugar.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/70">© {new Date().getFullYear()} ARCHES</p>
      </aside>

      <main className="bg-gradient-soft flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-panel">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="bg-gradient-primary grid h-10 w-10 place-items-center rounded-xl text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">ARCHES</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
