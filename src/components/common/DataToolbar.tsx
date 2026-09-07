import { type ReactNode } from "react";
import { Search, Filter, Download, X, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { exportCsv, exportExcel, type Cell } from "@/lib/export";
import { printTable } from "@/lib/print";

export function DataToolbar({
  placeholder = "Buscar...",
  children,
  onExport,
  exportName,
  exportColumns,
  exportRows,
  // --- nuevo: búsqueda controlada (opcional, retrocompatible) ---
  searchValue,
  onSearchChange,
  onClearFilters,
  // --- nuevo: exportación server-side, ej. Excel/PDF generados por el backend ---
  onExportExcel,
  onExportPdf,
  exportLabel = "registros",
}: {
  placeholder?: string;
  children?: ReactNode;
  onExport?: () => void;
  exportName?: string;
  exportColumns?: string[];
  exportRows?: Cell[][];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onClearFilters?: () => void;
  onExportExcel?: () => void | Promise<void>;
  onExportPdf?: () => void | Promise<void>;
  exportLabel?: string;
}) {
  const hasClientData = !!exportName && !!exportColumns && !!exportRows;
  const hasServerExport = !!onExportExcel || !!onExportPdf;

  return (
    <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          {onSearchChange ? (
            <Input
              placeholder={placeholder}
              className="pl-9"
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          ) : (
            <Input placeholder={placeholder} className="pl-9" />
          )}
        </div>
        {children}
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onClearFilters}>
          <X className="h-4 w-4" /> Limpiar filtros
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4" /> Más filtros
        </Button>

        {hasServerExport ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs">{exportLabel}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {onExportExcel && (
                <DropdownMenuItem onClick={() => onExportExcel()}>
                  <FileSpreadsheet className="h-4 w-4" /> Excel (.xlsx)
                </DropdownMenuItem>
              )}
              {onExportPdf && (
                <DropdownMenuItem onClick={() => onExportPdf()}>
                  <FileText className="h-4 w-4" /> PDF
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : hasClientData ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs">
                {exportRows!.length} registros · {exportName}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  exportExcel(exportName!, exportColumns!, exportRows!);
                  toast.success("Archivo Excel descargado");
                }}
              >
                <FileSpreadsheet className="h-4 w-4" /> Excel (.xls)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  exportCsv(exportName!, exportColumns!, exportRows!);
                  toast.success("Archivo CSV descargado");
                }}
              >
                <FileText className="h-4 w-4" /> CSV (.csv)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  const ok = printTable(
                    exportName!,
                    exportColumns!,
                    exportRows!,
                    `${exportRows!.length} registros`,
                  );
                  if (!ok) toast.error("Permita las ventanas emergentes para imprimir");
                }}
              >
                <Printer className="h-4 w-4" /> Imprimir / PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => (onExport ? onExport() : toast.success("Exportación generada correctamente"))}
          >
            <Download className="h-4 w-4" /> Exportar
          </Button>
        )}
      </div>
    </div>
  );
}
