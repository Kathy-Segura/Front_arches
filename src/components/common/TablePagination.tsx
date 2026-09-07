import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  total: number;
  /** Página actual, 0-based. Si se omite, el componente queda "tonto" como antes (sin controles activos). */
  page?: number;
  /** Tamaño de página actual. Default 10. */
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
};

export function TablePagination({ total, page, pageSize = 10, onPageChange, onPageSizeChange }: Props) {
  const controlado = page !== undefined && onPageChange !== undefined;
  const totalPages = controlado ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const paginaActual = controlado ? page! : 0;

  const desde = total === 0 ? 0 : paginaActual * pageSize + 1;
  const hasta = controlado ? Math.min(total, (paginaActual + 1) * pageSize) : total;

  return (
    <div className="flex flex-col gap-3 border-t border-border p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span>Filas por página</span>
        <Select
          defaultValue={String(pageSize)}
          value={controlado ? String(pageSize) : undefined}
          onValueChange={(v) => onPageSizeChange?.(Number(v))}
        >
          <SelectTrigger className="h-8 w-[74px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["10", "25", "50", "100"].map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <span>
          {desde}–{hasta} de {total} registros
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!controlado || paginaActual <= 0}
            onClick={() => onPageChange?.(paginaActual - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-primary-soft font-medium">
            {paginaActual + 1}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!controlado || paginaActual >= totalPages - 1}
            onClick={() => onPageChange?.(paginaActual + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
