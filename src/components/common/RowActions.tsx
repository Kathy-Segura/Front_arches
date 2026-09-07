import { Eye, Pencil, Printer, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  label: string;
  viewTo?: string;
  viewParams?: Record<string, string>;
  onView?: () => void;
  onEdit?: () => void;
  onPrint?: () => void;
  /** Si se provee, se llama al confirmar el diálogo de eliminar (ej. llamar al backend). */
  onDelete?: () => void | Promise<void>;
  print?: boolean;
};

function IconBtn({ children, title, ...rest }: React.ComponentProps<typeof Button> & { title: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" {...rest}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  );
}

export function RowActions({ label, viewTo, viewParams, onView, onEdit, onPrint, onDelete, print = true }: Props) {

  return (
    <div className="flex items-center justify-end gap-0.5">
      {viewTo ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Link to={viewTo as any} params={viewParams as any}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ver</TooltipContent>
        </Tooltip>
      ) : (
        <IconBtn title="Ver" onClick={() => (onView ? onView() : toast.info(`Vista de detalle: ${label}`))}>
          <Eye className="h-4 w-4" />
        </IconBtn>
      )}
      <IconBtn title="Editar" onClick={() => (onEdit ? onEdit() : toast.info(`Editando ${label}`))}>
        <Pencil className="h-4 w-4" />
      </IconBtn>
      {print && (
        <IconBtn
          title="Imprimir"
          onClick={() => (onPrint ? onPrint() : toast.success("Documento enviado a impresión"))}
        >
          <Printer className="h-4 w-4" />
        </IconBtn>
      )}
      <AlertDialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Eliminar</TooltipContent>
        </Tooltip>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro que desea eliminar este registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{label}</strong>. Esta acción no se puede deshacer y quedará registrada en la
              bitácora de actividad.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (onDelete) {
                  try {
                    await onDelete();
                    toast.success("Registro eliminado correctamente");
                  } catch {
                    toast.error("No se pudo eliminar el registro");
                  }
                } else {
                  toast.success("Registro eliminado correctamente");
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
