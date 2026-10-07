import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FileHeart, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataToolbar } from "@/components/common/DataToolbar";
import { TablePagination } from "@/components/common/TablePagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { descargarBlob, abrirBlobEnPestana, ApiError } from "@/lib/api/http";
import { listarPacientes, exportarPacientesExcel, exportarPacientesPdf } from "@/lib/api/pacientes";
import type { PacienteDTO } from "@/types/paciente";

// Esta ruta es SOLO el listado. No tiene parámetro $id, por eso aquí no hay loader con params.id:
// el detalle vive en _shell.expedientes.$id.tsx  ->  createFileRoute("/_shell/expedientes/$id")
export const Route = createFileRoute("/_shell/expedientes/")({
  head: () => ({
    meta: [
      { title: "Expedientes clínicos — ARCHES" },
      { name: "description", content: "Acceso a los expedientes clínicos odontológicos de los pacientes." },
      { property: "og:title", content: "Expedientes clínicos — ARCHES" },
      { property: "og:description", content: "Acceso a los expedientes clínicos odontológicos de los pacientes." },
    ],
  }),
  component: Expedientes,
});

type FiltroEstado = "activo" | "inactivo" | "";

function Expedientes() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<string>("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [data, setData] = useState<PacienteDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);

  // Debounce de la búsqueda (400 ms), igual que en el listado de pacientes.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function onSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      setSearch(value);
    }, 400);
  }

  useEffect(() => {
    let activo = true;
    setCargando(true);
    listarPacientes({ search, estado: estado as FiltroEstado, page, size: pageSize })
      .then((res) => {
        if (!activo) return;
        setData(res.content);
        setTotal(res.totalElements);
      })
      .catch((err) => {
        if (activo) toast.error(err instanceof ApiError ? err.message : "No se pudo cargar el listado de expedientes");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [search, estado, page, pageSize]);

  function limpiarFiltros() {
    setSearchInput("");
    setSearch("");
    setEstado("");
    setPage(0);
  }

  async function handleExportExcel() {
    try {
      const blob = await exportarPacientesExcel({ search, estado: estado as FiltroEstado });
      descargarBlob(blob, "expedientes.xlsx");
      toast.success("Excel generado");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo generar el Excel");
    }
  }

  async function handleExportPdf() {
    try {
      const blob = await exportarPacientesPdf({ search, estado: estado as FiltroEstado });
      abrirBlobEnPestana(blob);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo generar el PDF");
    }
  }

  return (
    <>
      <PageHeader
        title="Expediente Clínico"
        description="Seleccione un paciente para consultar o actualizar su expediente odontológico."
        breadcrumbs={[{ label: "Expediente Clínico" }]}
      />

      <Card className="overflow-hidden border-border p-0 shadow-card">
        <DataToolbar
          placeholder="Buscar expediente por paciente o cédula..."
          searchValue={searchInput}
          onSearchChange={onSearchChange}
          onClearFilters={limpiarFiltros}
          onExportExcel={handleExportExcel}
          onExportPdf={handleExportPdf}
          exportLabel={`${total} registros · Expedientes clínicos`}
        >
          <Select
            value={estado || "__todos__"}
            onValueChange={(v) => {
              setEstado(v === "__todos__" ? "" : v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__todos__">Todos los estados</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="inactivo">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </DataToolbar>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead>Expediente</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargando && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Cargando expedientes...
                  </TableCell>
                </TableRow>
              )}
              {!cargando && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No se encontraron expedientes con los filtros aplicados.
                  </TableCell>
                </TableRow>
              )}
              {!cargando &&
                data.map((p, i) => (
                  <TableRow key={p.idPaciente} className={i % 2 ? "bg-muted/25" : undefined}>
                    <TableCell className="font-medium">P-{String(p.idPaciente).padStart(4, "0")}</TableCell>
                    <TableCell>{p.nombreCompleto}</TableCell>
                    <TableCell className="text-muted-foreground">{p.cedula}</TableCell>
                    <TableCell className="text-muted-foreground">{p.telefono}</TableCell>
                    <TableCell>
                      <StatusBadge estado={p.estadoExpediente} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/expedientes/$id" params={{ id: String(p.idPaciente) }}>
                          <FileHeart className="h-4 w-4" /> Abrir expediente
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
        />
      </Card>

      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Search className="h-3.5 w-3.5" /> Use el buscador global para localizar un expediente rápidamente.
      </p>
    </>
  );
}
