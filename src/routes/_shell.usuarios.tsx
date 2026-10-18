import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, KeyRound, Plus, RefreshCw, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataToolbar } from "@/components/common/DataToolbar";
import { TablePagination } from "@/components/common/TablePagination";
import { RowActions } from "@/components/common/RowActions";
import { DetailDialog } from "@/components/common/DetailDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { printRecord } from "@/lib/print";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { authApi } from "@/lib/api/auth";
import { usuariosApi } from "@/lib/api/usuarios";
import { generarContrasenaTemporal, validarContrasena } from "@/lib/api/password";
import type { RolDTO } from "@/types/rol";
import type { UsuarioDTO } from "@/types/usuario";

export const Route = createFileRoute("/_shell/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuarios del sistema — ARCHES" },
      { name: "description", content: "Gestión de usuarios, roles asignados y estado de las cuentas del sistema." },
      { property: "og:title", content: "Usuarios del sistema — ARCHES" },
      { property: "og:description", content: "Gestión de usuarios, roles asignados y estado de las cuentas." },
    ],
  }),
  component: Usuarios,
});

interface FormUsuario {
  nombreCompleto: string;
  correo: string;
  telefono: string;
  idRol: string; // el Select trabaja con strings
  contrasenaTemporal: string;
  activo: boolean;
}

const formVacio: FormUsuario = {
  nombreCompleto: "",
  correo: "",
  telefono: "",
  idRol: "",
  contrasenaTemporal: "",
  activo: true,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ESTADOS = ["activo", "inactivo", "pendiente"] as const;

const mensaje = (e: unknown, porDefecto: string) => (e instanceof Error && e.message ? e.message : porDefecto);

function fmtFechaHora(iso: string | null): string {
  if (!iso) return "Nunca";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("es-NI", { dateStyle: "short", timeStyle: "short" });
}

function copiar(texto: string) {
  void navigator.clipboard
    ?.writeText(texto)
    .then(() => toast.success("Contraseña copiada"))
    .catch(() => toast.error("No se pudo copiar"));
}

function Usuarios() {
  const [filas, setFilas] = useState<UsuarioDTO[]>([]);
  const [roles, setRoles] = useState<RolDTO[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // El listado completo viene del back; búsqueda, filtros y paginación se resuelven aquí (son pocos usuarios).
  const [query, setQuery] = useState("");
  const [rolFiltro, setRolFiltro] = useState<string | undefined>(undefined);
  const [estadoFiltro, setEstadoFiltro] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0); // 0-indexed, igual que TablePagination en personal
  const [pageSize, setPageSize] = useState(10);

  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<UsuarioDTO | null>(null);
  const [form, setForm] = useState<FormUsuario>(formVacio);
  const [guardando, setGuardando] = useState(false);

  const [detalle, setDetalle] = useState<UsuarioDTO | null>(null);

  const [resetUsuario, setResetUsuario] = useState<UsuarioDTO | null>(null);
  const [resetPass, setResetPass] = useState("");
  const [reseteando, setReseteando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setFilas(await usuariosApi.listar());
      setError(null);
    } catch (e) {
      const m = mensaje(e, "No se pudieron cargar los usuarios");
      setError(m);
      toast.error(m);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
    authApi
      .roles()
      .then(setRoles)
      .catch(() => toast.error("No se pudo cargar la lista de roles"));
  }, [cargar]);

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return filas.filter(
      (u) =>
        (!q || u.nombreCompleto.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q)) &&
        (!rolFiltro || String(u.idRol) === rolFiltro) &&
        (!estadoFiltro || u.estado === estadoFiltro),
    );
  }, [filas, query, rolFiltro, estadoFiltro]);

  const ultimaPagina = Math.max(0, Math.ceil(filtradas.length / pageSize) - 1);
  const paginaActual = Math.min(page, ultimaPagina);
  const visibles = filtradas.slice(paginaActual * pageSize, (paginaActual + 1) * pageSize);

  /* ---------------- crear / editar ---------------- */

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ ...formVacio, contrasenaTemporal: generarContrasenaTemporal() });
    setOpen(true);
  };

  const abrirEdicion = (u: UsuarioDTO) => {
    setEditando(u);
    setForm({
      nombreCompleto: u.nombreCompleto,
      correo: u.correo,
      telefono: u.telefono ?? "",
      idRol: String(u.idRol),
      contrasenaTemporal: "",
      activo: u.estado === "activo",
    });
    setOpen(true);
  };

  const guardar = async () => {
    const nombre = form.nombreCompleto.trim();
    const correo = form.correo.trim();
    if (!nombre || !correo || !form.idRol) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    if (!EMAIL_RE.test(correo)) {
      toast.error("Ingresa un correo válido");
      return;
    }
    if (!editando) {
      const problema = validarContrasena(form.contrasenaTemporal);
      if (problema) {
        toast.error(problema);
        return;
      }
    }
    setGuardando(true);
    try {
      const telefono = form.telefono.trim() || null;
      if (editando) {
        await usuariosApi.actualizar(editando.idUsuario, {
          nombreCompleto: nombre,
          correo,
          telefono,
          idRol: Number(form.idRol),
          activo: form.activo,
        });
        toast.success("Usuario actualizado correctamente");
      } else {
        await usuariosApi.crear({
          nombreCompleto: nombre,
          correo,
          telefono,
          idRol: Number(form.idRol),
          contrasenaTemporal: form.contrasenaTemporal,
          activo: form.activo,
        });
        toast.success("Usuario creado correctamente");
      }
      setOpen(false);
      await cargar();
    } catch (e) {
      toast.error(mensaje(e, "No se pudo guardar el usuario"));
    } finally {
      setGuardando(false);
    }
  };

  /* ---------------- activar / desactivar ---------------- */

  const cambiarEstado = async (u: UsuarioDTO, activo: boolean) => {
    try {
      if (activo && u.estado === "pendiente") {
        await usuariosApi.aprobar(u.idUsuario);
        toast.success(`Cuenta de ${u.nombreCompleto} aprobada`);
      } else {
        await usuariosApi.actualizar(u.idUsuario, {
          nombreCompleto: u.nombreCompleto,
          correo: u.correo,
          telefono: u.telefono,
          idRol: u.idRol,
          activo,
        });
        toast.success(activo ? `${u.nombreCompleto} fue reactivado` : `${u.nombreCompleto} fue dado de baja`);
      }
      await cargar();
    } catch (e) {
      toast.error(mensaje(e, "No se pudo cambiar el estado del usuario"));
    }
  };

  /* ---------------- restablecer contraseña ---------------- */

  const abrirReset = (u: UsuarioDTO) => {
    setResetUsuario(u);
    setResetPass(generarContrasenaTemporal());
  };

  const guardarReset = async () => {
    if (!resetUsuario) return;
    const problema = validarContrasena(resetPass);
    if (problema) {
      toast.error(problema);
      return;
    }
    setReseteando(true);
    try {
      await usuariosApi.restablecerContrasena(resetUsuario.idUsuario, { contrasenaTemporal: resetPass });
      toast.success("Contraseña restablecida. Entréguesela al usuario");
      setResetUsuario(null);
    } catch (e) {
      toast.error(mensaje(e, "No se pudo restablecer la contraseña"));
    } finally {
      setReseteando(false);
    }
  };

  const campoContrasena = (valor: string, onChange: (v: string) => void) => (
    <div className="flex gap-2">
      <Input value={valor} onChange={(e) => onChange(e.target.value)} className="font-mono" autoComplete="off" />
      <Button type="button" variant="outline" size="icon" title="Generar otra" onClick={() => onChange(generarContrasenaTemporal())}>
        <RefreshCw className="h-4 w-4" />
      </Button>
      <Button type="button" variant="outline" size="icon" title="Copiar" onClick={() => copiar(valor)}>
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Cuentas de acceso al sistema y roles asignados."
        breadcrumbs={[{ label: "Usuarios" }]}
        actions={
          <Button onClick={abrirNuevo}>
            <Plus className="h-4 w-4" /> Nuevo usuario
          </Button>
        }
      />

      <Card className="overflow-hidden border-border p-0 shadow-card">
        <DataToolbar
          exportName="Usuarios del sistema"
          exportColumns={["Nombre", "Correo", "Rol", "Estado", "Último acceso"]}
          exportRows={filtradas.map((u) => [u.nombreCompleto, u.correo, u.nombreRol ?? "", u.estado, fmtFechaHora(u.ultimoAcceso)])}
          onClearFilters={() => {
            setQuery("");
            setRolFiltro(undefined);
            setEstadoFiltro(undefined);
            setPage(0);
          }}
        >
          <Input
            placeholder="Buscar por nombre o correo..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            className="w-64"
          />
          <Select
            value={rolFiltro ?? "todos"}
            onValueChange={(v) => {
              setRolFiltro(v === "todos" ? undefined : v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los roles</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.idRol} value={String(r.idRol)}>
                  {r.nombreRol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={estadoFiltro ?? "todos"}
            onValueChange={(v) => {
              setEstadoFiltro(v === "todos" ? undefined : v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {ESTADOS.map((e) => (
                <SelectItem key={e} value={e} className="capitalize">
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DataToolbar>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargando && filas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Cargando usuarios…
                  </TableCell>
                </TableRow>
              )}
              {!cargando && visibles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    {error ?? "No hay usuarios con esos filtros."}
                  </TableCell>
                </TableRow>
              )}
              {visibles.map((u, i) => (
                <TableRow key={u.idUsuario} className={i % 2 ? "bg-muted/25" : undefined}>
                  <TableCell className="font-medium">{u.nombreCompleto}</TableCell>
                  <TableCell className="text-muted-foreground">{u.correo}</TableCell>
                  <TableCell>{u.nombreRol}</TableCell>
                  <TableCell>
                    <StatusBadge estado={u.estado} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{fmtFechaHora(u.ultimoAcceso)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {u.estado !== "activo" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title={u.estado === "pendiente" ? "Aprobar cuenta" : "Reactivar usuario"}
                          aria-label={u.estado === "pendiente" ? "Aprobar cuenta" : "Reactivar usuario"}
                          onClick={() => void cambiarEstado(u, true)}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Restablecer contraseña"
                        aria-label="Restablecer contraseña"
                        onClick={() => abrirReset(u)}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <RowActions
                        label={u.nombreCompleto}
                        onView={() => setDetalle(u)}
                        onEdit={() => abrirEdicion(u)}
                        {...(u.estado === "activo" ? { onDelete: () => void cambiarEstado(u, false) } : {})}
                        onPrint={() =>
                          printRecord(u.nombreCompleto, [
                            { label: "Código", value: String(u.idUsuario) },
                            { label: "Correo", value: u.correo },
                            { label: "Teléfono", value: u.telefono ?? "" },
                            { label: "Rol", value: u.nombreRol ?? "" },
                            { label: "Estado", value: u.estado },
                            { label: "Último acceso", value: fmtFechaHora(u.ultimoAcceso) },
                          ])
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          total={filtradas.length}
          page={paginaActual}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size: number) => {
            setPageSize(size);
            setPage(0);
          }}
        />
      </Card>

      <DetailDialog
        open={!!detalle}
        onOpenChange={(v) => !v && setDetalle(null)}
        title={detalle?.nombreCompleto ?? ""}
        subtitle={detalle ? `${detalle.nombreRol ?? "Sin rol"} · ${detalle.idUsuario}` : undefined}
        badge={detalle ? <StatusBadge estado={detalle.estado} /> : undefined}
        fields={
          detalle
            ? [
                { label: "Código de usuario", value: String(detalle.idUsuario) },
                { label: "Rol asignado", value: detalle.nombreRol ?? "" },
                { label: "Correo", value: detalle.correo },
                { label: "Teléfono", value: detalle.telefono ?? "" },
                { label: "Estado", value: detalle.estado },
                { label: "Último acceso", value: fmtFechaHora(detalle.ultimoAcceso) },
                { label: "Creado", value: fmtFechaHora(detalle.fechaCreacion) },
                { label: "Autenticación", value: "Usuario y contraseña" },
              ]
            : []
        }
      />

      {/* Crear / editar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar usuario" : "Registro de usuario"}</DialogTitle>
            <DialogDescription>Los campos con * son obligatorios.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-4">
              <h3 className="border-b border-border pb-2 text-sm font-semibold text-primary-dark">Datos personales</h3>
              <div className="space-y-2">
                <Label>
                  Nombre completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Nombres y apellidos"
                  value={form.nombreCompleto}
                  onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Correo electrónico <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="usuario@arches.ni"
                  value={form.correo}
                  onChange={(e) => setForm({ ...form, correo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input placeholder="8888-0000" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="border-b border-border pb-2 text-sm font-semibold text-primary-dark">Acceso</h3>
              {!editando && (
                <div className="space-y-2">
                  <Label>
                    Contraseña temporal <span className="text-destructive">*</span>
                  </Label>
                  {campoContrasena(form.contrasenaTemporal, (v) => setForm({ ...form, contrasenaTemporal: v }))}
                  <p className="text-xs text-muted-foreground">
                    Cópiela y entréguela al usuario: después de guardar no se puede volver a ver.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label>
                  Rol asignado <span className="text-destructive">*</span>
                </Label>
                <Select value={form.idRol} onValueChange={(v) => setForm({ ...form, idRol: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.idRol} value={String(r.idRol)}>
                        {r.nombreRol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2.5 text-sm">
                <Checkbox checked={form.activo} onCheckedChange={(v) => setForm({ ...form, activo: v === true })} /> Usuario activo
              </label>
              {editando?.estado === "pendiente" && (
                <p className="text-xs text-muted-foreground">
                  Esta cuenta está pendiente de aprobación. Márquela como activa para aprobarla.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={() => void guardar()} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restablecer contraseña */}
      <Dialog open={!!resetUsuario} onOpenChange={(v) => !v && setResetUsuario(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restablecer contraseña</DialogTitle>
            <DialogDescription>{resetUsuario?.nombreCompleto}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nueva contraseña temporal</Label>
            {campoContrasena(resetPass, setResetPass)}
            <p className="text-xs text-muted-foreground">
              Cópiela y entréguela al usuario: después de guardar no se puede volver a ver. También se levanta un posible
              bloqueo por intentos fallidos.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUsuario(null)} disabled={reseteando}>
              Cancelar
            </Button>
            <Button onClick={() => void guardarReset()} disabled={reseteando}>
              {reseteando ? "Guardando..." : "Restablecer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
