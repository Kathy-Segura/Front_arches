import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OPCIONES_ANTECEDENTE } from "@/types/paciente";

interface Props {
  tipo: string;
  otroDetalle: string;
  onTipoChange: (tipo: string) => void;
  onOtroDetalleChange: (detalle: string) => void;
}

export function AntecedenteTipoSelect({ tipo, otroDetalle, onTipoChange, onOtroDetalleChange }: Props) {
  return (
    <div className="space-y-2">
      <Select value={tipo} onValueChange={onTipoChange}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccione el tipo de antecedente" />
        </SelectTrigger>
        <SelectContent>
          {OPCIONES_ANTECEDENTE.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {tipo === "otro" && (
        <Input
          placeholder="Especifique el tipo de antecedente"
          value={otroDetalle}
          onChange={(e) => onOtroDetalleChange(e.target.value)}
        />
      )}
    </div>
  );
}