import { Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { printRecord } from "@/lib/print";

export type DetailField = { label: string; value: string; full?: boolean | undefined };

export function DetailDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  badge,
  fields,
  printable = true,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  subtitle?: string | undefined;
  badge?: React.ReactNode | undefined;
  fields: DetailField[];
  printable?: boolean | undefined;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="truncate">{title}</DialogTitle>
              {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
            </div>
            {badge ?? null}
          </div>
        </DialogHeader>

        <div className="grid gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label} className={f.full ? "sm:col-span-2" : undefined}>
              <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{f.label}</p>
              <p className="mt-0.5 text-sm font-medium break-words">{f.value || "—"}</p>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-row justify-end gap-2">
          {printable && (
            <Button
              variant="outline"
              onClick={() => {
                const ok = printRecord(title, fields.map((f) => ({ label: f.label, value: f.value || "—" })));
                if (!ok) toast.error("Permita las ventanas emergentes para imprimir");
              }}
            >
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
