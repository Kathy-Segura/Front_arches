import { createFileRoute } from "@tanstack/react-router";
import { Save, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { rolesApi } from "@/lib/api/roles";
import type { AccionPermiso, PermisoModuloDTO, RolDTO } from "@/types/rol";

export const Route = createFileRoute("/_shell/roles")({
  head: () => ({
    meta: [
      { title: "Roles y permisos — ARCHES" },
      { name: "description", content: "Matriz de permisos por módulo para cada rol del sistema clínico." },
      { property: "og:title", content: "Roles y permisos — ARCHES" },
      { property: "og:description", content: "Matriz de permisos por módulo para cada rol del sistema clínico." },
    ],
  }),
  component: Roles,
});

const acciones: { label: string; key: AccionPermiso }[] = [
  { label: "Ver", key: "puedeVer" },
  { label: "Crear", key: "puedeCrear" },
  { label: "Editar", key: "puedeEditar" },
  { label: "Eliminar", key: "puedeEliminar" },
];

type MatrizPorRol = Record<number, PermisoModuloDTO[]>;

/** Misma regla que aplica el back: sin "Ver" no hay otras acciones; cualquier otra acción exige "Ver". */
function aplicarCambio(p: PermisoModuloDTO, accion: AccionPermiso, valor: boolean): PermisoModuloDTO {
  const next = { ...p, [accion]: valor };
  if (accion === "puedeVer" && !valor) {
    return { ...next, puedeCrear: false, puedeEditar: false, puedeEliminar: false };
  }
  if (accion !== "puedeVer" && valor) {
    return { ...next, puedeVer: true };
  }
  return next;
}

function Roles() {
  const [roles, setRoles] = useState<RolDTO[]>([]);
  const [guardado, setGuardado] = useState<MatrizPorRol>({});
  const [borrador, setBorrador] = useState<MatrizPorRol>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const primerRol = roles[0];

  const cargar = useCallback(async (signal?: AbortSignal) => {
    setCargando(true);
    setError(null);
    try {
      const lista = await rolesApi.listar(false, signal);
      const entradas = await Promise.all(
        lista.map(async (r) => [r.idRol, await rolesApi.obtenerPermisos(r.idRol, signal)] as const),
      );
      const matriz: MatrizPorRol = Object.fromEntries(entradas);
      setRoles(lista);
      setGuardado(matriz);
      setBorrador(structuredClone(matriz));
    } catch (e) {
      if (signal?.aborted) return;
      setError(e instanceof Error ? e.message : "No se pudieron cargar los roles");
    } finally {
      if (!signal?.aborted) setCargando(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void cargar(controller.signal);
    return () => controller.abort();
  }, [cargar]);

  // Roles con cambios sin guardar, junto con su matriz editada.
  const cambios = useMemo(
    () =>
      roles.flatMap((r) => {
        const editado = borrador[r.idRol];
        const original = guardado[r.idRol];
        return editado && JSON.stringify(editado) !== JSON.stringify(original)
          ? [{ idRol: r.idRol, permisos: editado }]
          : [];
      }),
    [roles, borrador, guardado],
  );
  const idsModificados = useMemo(() => new Set(cambios.map((c) => c.idRol)), [cambios]);

  function cambiar(idRol: number, idModulo: number, accion: AccionPermiso, valor: boolean) {
    setBorrador((prev) => {
      const actual = prev[idRol];
      if (!actual) return prev;
      return {
        ...prev,
        [idRol]: actual.map((p) => (p.idModulo === idModulo ? aplicarCambio(p, accion, valor) : p)),
      };
    });
  }

  async function guardarPermisos() {
    setGuardando(true);
    try {
      const resultados = await Promise.all(
        cambios.map(async (c) => [c.idRol, await rolesApi.guardarPermisos(c.idRol, c.permisos)] as const),
      );
      const actualizados = Object.fromEntries(resultados) as MatrizPorRol;
      setGuardado((prev) => ({ ...prev, ...actualizados }));
      setBorrador((prev) => ({ ...prev, ...structuredClone(actualizados) }));
      toast.success("Permisos actualizados correctamente");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron guardar los permisos");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Roles y permisos"
        description="Defina qué puede hacer cada rol dentro de los módulos del sistema."
        breadcrumbs={[{ label: "Roles y Permisos" }]}
        actions={
          <Button onClick={guardarPermisos} disabled={guardando || cambios.length === 0}>
            <Save className="h-4 w-4" /> {guardando ? "Guardando…" : "Guardar permisos"}
          </Button>
        }
      />

      {cargando && <p className="py-10 text-center text-sm text-muted-foreground">Cargando roles y permisos…</p>}

      {error && (
        <Card className="border-destructive/40 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" className="mt-3" onClick={() => void cargar()}>
            Reintentar
          </Button>
        </Card>
      )}

      {!cargando && !error && !primerRol && (
        <p className="py-10 text-center text-sm text-muted-foreground">No hay roles activos registrados.</p>
      )}

      {!cargando && !error && primerRol && (
        <Tabs defaultValue={String(primerRol.idRol)}>
          <TabsList className="flex-wrap">
            {roles.map((r) => (
              <TabsTrigger key={r.idRol} value={String(r.idRol)}>
                {r.nombreRol}
                {idsModificados.has(r.idRol) && (
                  <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-primary" aria-label="Cambios sin guardar" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {roles.map((rol) => (
            <TabsContent key={rol.idRol} value={String(rol.idRol)} className="mt-4">
              <Card className="overflow-hidden border-border p-0 shadow-card">
                <CardHeader className="border-b border-border bg-gradient-soft py-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Permisos del rol: {rol.nombreRol}
                  </CardTitle>
                  {rol.descripcion && <p className="text-sm text-muted-foreground">{rol.descripcion}</p>}
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/60">
                        <TableRow>
                          <TableHead className="min-w-44">Módulo</TableHead>
                          {acciones.map((a) => (
                            <TableHead key={a.key} className="text-center">
                              {a.label}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(borrador[rol.idRol] ?? []).map((p, i) => (
                          <TableRow key={p.idModulo} className={i % 2 ? "bg-muted/25" : undefined}>
                            <TableCell className="font-medium">{p.nombreModulo}</TableCell>
                            {acciones.map((a) => (
                              <TableCell key={a.key} className="text-center">
                                <Checkbox
                                  checked={p[a.key]}
                                  aria-label={`${a.label} en ${p.nombreModulo}`}
                                  onCheckedChange={(v) => cambiar(rol.idRol, p.idModulo, a.key, v === true)}
                                />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </>
  );
}
