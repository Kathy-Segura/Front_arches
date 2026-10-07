import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AutorSelect, autorPorDefecto } from "@/components/clinical/AutorSelect"; 
import { mensajeError, useCarga } from "@/lib/useCarga";
import {
  listarTiposHallazgo,
  obtenerHistorialPieza,
  obtenerOdontograma,
  registrarHallazgo,
} from "@/lib/api/expedientes";
import {
  PIEZAS_INFERIORES,
  PIEZAS_SUPERIORES,
  formatearFechaHora,
  type HallazgoHistorialDTO,
  type OdontogramaPiezaDTO,
  type OdontologoDTO,
} from "@/types/expediente";

const FORM_INICIAL = { idHallazgoTipo: "", idPersonal: "", observaciones: "" };

/** Odontograma real (numeración FDI, dentición permanente) conectado al expediente del paciente. */
export function OdontogramaPaciente({ idPaciente, odontologos }: { idPaciente: number; odontologos: OdontologoDTO[] }) {
  const { datos, setDatos, cargando, error } = useCarga(
    async () => {
      const [piezas, tipos] = await Promise.all([obtenerOdontograma(idPaciente), listarTiposHallazgo()]);
      return { piezas, tipos };
    },
    [idPaciente],
    "No se pudo cargar el odontograma",
  );

  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [historial, setHistorial] = useState<HallazgoHistorialDTO[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const piezas = new Map<number, OdontogramaPiezaDTO>((datos?.piezas ?? []).map((p) => [p.numeroPieza, p]));
  const tipos = datos?.tipos ?? [];
  const piezaActual = seleccion !== null ? piezas.get(seleccion) : undefined;

  async function cargarHistorial(numero: number) {
    setCargandoHistorial(true);
    try {
      setHistorial(await obtenerHistorialPieza(idPaciente, numero));
    } catch (err) {
      setHistorial([]);
      toast.error(mensajeError(err, "No se pudo cargar el historial de la pieza"));
    } finally {
      setCargandoHistorial(false);
    }
  }

  function abrirPieza(numero: number) {
    setSeleccion(numero);
    setForm({ ...FORM_INICIAL, idPersonal: autorPorDefecto(odontologos) });
    setHistorial([]);
    void cargarHistorial(numero);
  }

  async function guardar() {
    if (seleccion === null) return;
    if (!form.idHallazgoTipo) {
      toast.error("Seleccione el hallazgo");
      return;
    }
    if (!form.idPersonal) {
      toast.error("Seleccione el odontólogo");
      return;
    }
    setGuardando(true);
    try {
      const observaciones = form.observaciones.trim();
      const nueva = await registrarHallazgo(idPaciente, seleccion, {
        idHallazgoTipo: Number(form.idHallazgoTipo),
        idPersonal: Number(form.idPersonal),
        ...(observaciones ? { observaciones } : {}),
      });
      setDatos((prev) =>
        prev
          ? { ...prev, piezas: [...prev.piezas.filter((p) => p.numeroPieza !== nueva.numeroPieza), nueva] }
          : prev,
      );
      toast.success(`Hallazgo registrado en la pieza ${seleccion}`);
      setSeleccion(null);
    } catch (err) {
      toast.error(mensajeError(err, "No se pudo registrar el hallazgo"));
    } finally {
      setGuardando(false);
    }
  }

  function renderArcada(titulo: string, numeros: number[]) {
    const mitad = numeros.length / 2;
    return (
      <div className="space-y-2">
        <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">{titulo}</p>
        <div className="flex flex-wrap justify-center gap-4">
          {[numeros.slice(0, mitad), numeros.slice(mitad)].map((grupo, i) => (
            <div key={i} className="flex gap-1.5">
              {grupo.map((n) => {
                const p = piezas.get(n);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => abrirPieza(n)}
                    title={p ? `${n} — ${p.nombreHallazgo ?? p.codigoHallazgo ?? "con hallazgo"}` : `${n} — sin hallazgos`}
                    className="flex h-16 w-10 flex-col items-center justify-between rounded-md border border-border bg-card p-1 text-xs transition hover:border-primary hover:shadow-sm"
                  >
                    <span className="font-semibold">{n}</span>
                    <span
                      className="flex h-7 w-full items-center justify-center overflow-hidden rounded-sm border border-border/60 text-[10px] font-medium"
                      style={{ backgroundColor: p?.colorRepresentativo ?? undefined }}
                    >
                      {p?.codigoHallazgo ?? ""}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Odontograma · numeración FDI</CardTitle>
          <p className="text-sm text-muted-foreground">Seleccione una pieza para registrar un hallazgo o ver su historial.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {cargando && <p className="py-6 text-center text-sm text-muted-foreground">Cargando odontograma…</p>}
          {error && <p className="py-6 text-center text-sm text-destructive">{error}</p>}
          {!cargando && !error && (
            <>
              {renderArcada("Arcada superior", PIEZAS_SUPERIORES)}
              {renderArcada("Arcada inferior", PIEZAS_INFERIORES)}
              {tipos.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                  {tipos.map((t) => (
                    <span key={t.idHallazgoTipo} className="flex items-center gap-1.5">
                      <span
                        className="h-3 w-3 rounded-sm border border-border"
                        style={{ backgroundColor: t.colorRepresentativo ?? undefined }}
                      />
                      {t.codigoHallazgo} · {t.nombreHallazgo}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Sheet open={seleccion !== null} onOpenChange={(abierto) => !abierto && setSeleccion(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Pieza {seleccion}</SheetTitle>
            <SheetDescription>
              {piezaActual
                ? `Hallazgo actual: ${piezaActual.nombreHallazgo ?? piezaActual.codigoHallazgo ?? "—"}`
                : "Sin hallazgos registrados."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nuevo hallazgo</Label>
              <Select value={form.idHallazgoTipo} onValueChange={(v) => setForm((f) => ({ ...f, idHallazgoTipo: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el hallazgo" />
                </SelectTrigger>
                <SelectContent>
                  {tipos.map((t) => (
                    <SelectItem key={t.idHallazgoTipo} value={String(t.idHallazgoTipo)}>
                      {t.codigoHallazgo} · {t.nombreHallazgo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Odontólogo</Label>
              <AutorSelect odontologos={odontologos} value={form.idPersonal} onChange={(v) => setForm((f) => ({ ...f, idPersonal: v }))} />
            </div>
            <div className="space-y-2">
              <Label>Observaciones (opcional)</Label>
              <Textarea
                rows={3}
                maxLength={300}
                value={form.observaciones}
                onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
              />
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-sm font-semibold">Historial de la pieza</p>
              {cargandoHistorial && <p className="text-sm text-muted-foreground">Cargando…</p>}
              {!cargandoHistorial && historial.length === 0 && (
                <p className="text-sm text-muted-foreground">Aún no hay registros para esta pieza.</p>
              )}
              <ul className="space-y-2">
                {historial.map((h) => (
                  <li key={h.idRegistro} className="rounded-lg bg-muted/60 p-3 text-sm">
                    <p className="font-medium">
                      {h.codigoHallazgo} · {h.nombreHallazgo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatearFechaHora(h.fechaRegistro)} · {h.nombrePersonal ?? "—"}
                    </p>
                    {h.observaciones && <p className="mt-1 text-muted-foreground">{h.observaciones}</p>}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setSeleccion(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={guardando}>
              {guardando ? "Guardando…" : "Registrar hallazgo"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
