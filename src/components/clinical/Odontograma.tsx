import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Hallazgo = { id: string; label: string; color: string };

const hallazgos: Hallazgo[] = [
  { id: "sano", label: "Sano", color: "bg-background border-border" },
  { id: "cariado", label: "Cariado", color: "bg-destructive/85 border-destructive text-primary-foreground" },
  { id: "obturado", label: "Obturado", color: "bg-primary border-primary text-primary-foreground" },
  { id: "ausente", label: "Ausente", color: "bg-muted-foreground/70 border-muted-foreground text-background" },
  { id: "corona", label: "Corona", color: "bg-warning border-warning text-warning-foreground" },
  { id: "endodoncia", label: "Endodoncia", color: "bg-success border-success text-primary-foreground" },
];

const superior = [
  [18, 17, 16, 15, 14, 13, 12, 11],
  [21, 22, 23, 24, 25, 26, 27, 28],
];
const inferior = [
  [48, 47, 46, 45, 44, 43, 42, 41],
  [31, 32, 33, 34, 35, 36, 37, 38],
];

const inicial: Record<number, string> = {
  36: "endodoncia",
  46: "obturado",
  16: "cariado",
  38: "ausente",
  26: "obturado",
  11: "corona",
};

export function Odontograma() {
  const [estado, setEstado] = useState<Record<number, string>>(inicial);
  const [activo, setActivo] = useState<string>("cariado");

  const aplicar = (pieza: number) => {
    setEstado((prev) => ({ ...prev, [pieza]: activo }));
    toast.success(`Pieza ${pieza} marcada como ${hallazgos.find((h) => h.id === activo)?.label.toLowerCase()}`);
  };

  const Diente = ({ n }: { n: number }) => {
    const h = hallazgos.find((x) => x.id === (estado[n] ?? "sano"))!;
    return (
      <button
        onClick={() => aplicar(n)}
        className={cn(
          "flex h-11 w-9 shrink-0 flex-col items-center justify-center rounded-md border text-[10px] font-semibold transition-all hover:scale-105 hover:shadow-card",
          h.color,
        )}
        title={`Pieza ${n} — ${h.label}`}
      >
        <span className="text-[13px]">{n}</span>
      </button>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <div className="space-y-8 overflow-x-auto rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Arcada superior</p>
          <div className="flex justify-center gap-4">
            {superior.map((cuad, i) => (
              <div key={i} className="flex gap-1.5">
                {cuad.map((n) => (
                  <Diente key={n} n={n} />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Arcada inferior</p>
          <div className="flex justify-center gap-4">
            {inferior.map((cuad, i) => (
              <div key={i} className="flex gap-1.5">
                {cuad.map((n) => (
                  <Diente key={n} n={n} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-card">
        <div>
          <h3 className="text-sm font-semibold">Panel de hallazgos</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Seleccione un hallazgo y haga clic sobre la pieza dental.
          </p>
        </div>
        <div className="space-y-1.5">
          {hallazgos.map((h) => (
            <button
              key={h.id}
              onClick={() => setActivo(h.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                activo === h.id ? "border-primary bg-primary-soft font-medium" : "border-border hover:bg-muted",
              )}
            >
              <span className={cn("h-4 w-4 rounded border", h.color)} />
              {h.label}
            </button>
          ))}
        </div>
        <Button className="w-full" onClick={() => toast.success("Odontograma guardado correctamente")}>
          Guardar odontograma
        </Button>
      </aside>
    </div>
  );
}
