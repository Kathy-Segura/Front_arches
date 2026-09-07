import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export function PageHeader({
  title,
  description,
  breadcrumbs = [],
  actions,
}: {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; to?: string }[];
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 space-y-3">
      <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link to="/dashboard" className="hover:text-primary">
          Inicio
        </Link>
        {breadcrumbs.map((b) => (
          <span key={b.label} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {b.to ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <Link to={b.to as any} className="hover:text-primary">
                {b.label}
              </Link>
            ) : (
              <span className="text-foreground">{b.label}</span>
            )}
          </span>
        ))}
      </nav>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-foreground">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
