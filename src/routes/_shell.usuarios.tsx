import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataToolbar } from "@/components/common/DataToolbar";
import { TablePagination } from "@/components/common/TablePagination";
import { RowActions } from "@/components/common/RowActions";
import { DetailDialog } from "@/components/common/DetailDialog";
import { printRecord } from "@/lib/print";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { roles, usuarios } from "@/lib/mock-data";

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

function Usuarios() {
  const [open, setOpen] = useState(false);
  const [detalle, setDetalle] = useState<(typeof usuarios)[number] | null>(null);

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Cuentas de acceso al sistema y roles asignados."
        breadcrumbs={[{ label: "Usuarios" }]}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Nuevo usuario
          </Button>
        }
      />

      <Card className="overflow-hidden border-border p-0 shadow-card">
        <DataToolbar
          placeholder="Buscar por nombre o correo..."
          exportName="Usuarios del sistema"
          exportColumns={["Nombre", "Correo", "Rol", "Estado", "Último acceso"]}
          exportRows={usuarios.map((u) => [u.nombre, u.correo, u.rol, u.estado, u.ultimoAcceso])}
        >

          <Select>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="inactivo">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </DataToolbar>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox />
                </TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u, i) => (
                <TableRow key={u.id} className={i % 2 ? "bg-muted/25" : undefined}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-medium">{u.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{u.correo}</TableCell>
                  <TableCell>{u.rol}</TableCell>
                  <TableCell>
                    <StatusBadge estado={u.estado} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.ultimoAcceso}</TableCell>
                  <TableCell>
                    <RowActions
                      label={u.nombre}
                      onView={() => setDetalle(u)}
                      onEdit={() => setOpen(true)}
                      onPrint={() =>
                        printRecord(u.nombre, [
                          { label: "Usuario", value: u.id },
                          { label: "Correo", value: u.correo },
                          { label: "Rol", value: u.rol },
                          { label: "Estado", value: u.estado },
                          { label: "Último acceso", value: u.ultimoAcceso },
                        ])
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <TablePagination total={usuarios.length} />
      </Card>

      <DetailDialog
        open={!!detalle}
        onOpenChange={(v) => !v && setDetalle(null)}
        title={detalle?.nombre ?? ""}
        subtitle={detalle ? `${detalle.rol} · ${detalle.id}` : undefined}
        badge={detalle ? <StatusBadge estado={detalle.estado} /> : undefined}
        fields={
          detalle
            ? [
                { label: "Código de usuario", value: detalle.id },
                { label: "Rol asignado", value: detalle.rol },
                { label: "Correo institucional", value: detalle.correo },
                { label: "Estado", value: detalle.estado },
                { label: "Último acceso", value: detalle.ultimoAcceso },
                { label: "Autenticación", value: "Usuario y contraseña" },
              ]
            : []
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registro de usuario</DialogTitle>
            <DialogDescription>Los campos con * son obligatorios.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-4">
              <h3 className="border-b border-border pb-2 text-sm font-semibold text-primary-dark">Datos personales</h3>
              <div className="space-y-2">
                <Label>
                  Nombre completo <span className="text-destructive">*</span>
                </Label>
                <Input placeholder="Nombres y apellidos" />
              </div>
              <div className="space-y-2">
                <Label>
                  Correo electrónico <span className="text-destructive">*</span>
                </Label>
                <Input type="email" placeholder="usuario@arches.ni" className="border-destructive" />
                <p className="text-xs text-destructive">Ya existe un usuario con este correo</p>
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input placeholder="8888-0000" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="border-b border-border pb-2 text-sm font-semibold text-primary-dark">Acceso</h3>
              <div className="space-y-2">
                <Label>
                  Contraseña temporal <span className="text-destructive">*</span>
                </Label>
                <Input type="password" defaultValue="temporal2026" />
              </div>
              <div className="space-y-2">
                <Label>
                  Rol asignado <span className="text-destructive">*</span>
                </Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2.5 text-sm">
                <Checkbox defaultChecked /> Usuario activo
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                toast.success("Usuario creado correctamente");
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
