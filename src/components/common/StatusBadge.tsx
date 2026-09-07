import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  activo: "bg-success-soft text-success border-success/25",
  completado: "bg-success-soft text-success border-success/25",
  atendida: "bg-success-soft text-success border-success/25",
  confirmada: "bg-success-soft text-success border-success/25",
  finalizado: "bg-success-soft text-success border-success/25",
  pagado: "bg-success-soft text-success border-success/25",
  pendiente: "bg-warning-soft text-warning-foreground border-warning/35",
  propuesto: "bg-warning-soft text-warning-foreground border-warning/35",
  "en proceso": "bg-info-soft text-primary-dark border-primary/25",
  "en curso": "bg-info-soft text-primary-dark border-primary/25",
  programada: "bg-info-soft text-primary-dark border-primary/25",
  inactivo: "bg-muted text-muted-foreground border-border",
  archivado: "bg-muted text-muted-foreground border-border",
  cancelado: "bg-danger-soft text-destructive border-destructive/25",
  cancelada: "bg-danger-soft text-destructive border-destructive/25",
  urgente: "bg-danger-soft text-destructive border-destructive/25",
};

export function StatusBadge({ estado, className }: { estado: string; className?: string }) {
  const key = estado.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize whitespace-nowrap",
        map[key] ?? "bg-muted text-muted-foreground border-border",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {estado}
    </span>
  );
}
