import { createFileRoute, Link } from "@tanstack/react-router";
import { FileHeart, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataToolbar } from "@/components/common/DataToolbar";
import { TablePagination } from "@/components/common/TablePagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pacientes } from "@/lib/mock-data";

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

function Expedientes() {
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
          exportName="Expedientes clínicos"
          exportColumns={["Expediente", "Paciente", "Cédula", "Última atención", "Estado"]}
          exportRows={pacientes.map((p) => [p.id, p.nombre, p.cedula, p.ultimaVisita, p.estado])}
        />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead>Expediente</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Última atención</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pacientes.map((p, i) => (
                <TableRow key={p.id} className={i % 2 ? "bg-muted/25" : undefined}>
                  <TableCell className="font-medium">{p.id}</TableCell>
                  <TableCell>{p.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{p.cedula}</TableCell>
                  <TableCell className="text-muted-foreground">{p.ultimaVisita}</TableCell>
                  <TableCell>
                    <StatusBadge estado={p.estado} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/expedientes/$id" params={{ id: p.id }}>
                        <FileHeart className="h-4 w-4" /> Abrir expediente
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <TablePagination total={pacientes.length} />
      </Card>

      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Search className="h-3.5 w-3.5" /> Use el buscador global para localizar un expediente rápidamente.
      </p>
    </>
  );
}
