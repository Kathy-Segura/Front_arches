import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OdontologoDTO } from "@/types/expediente";

/** Selector del odontólogo que firma un diagnóstico, una nota o un hallazgo. `value` es el idPersonal como texto. */
export function AutorSelect({
  odontologos,
  value,
  onChange,
}: {
  odontologos: OdontologoDTO[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccione el odontólogo" />
      </SelectTrigger>
      <SelectContent>
        {odontologos.map((o) => (
          <SelectItem key={o.idPersonal} value={String(o.idPersonal)}>
            {o.nombreCompleto}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Si solo hay un odontólogo activo lo preselecciona; si hay varios, deja el campo vacío. */
export function autorPorDefecto(odontologos: OdontologoDTO[]): string {
  const unico = odontologos.length === 1 ? odontologos[0] : undefined;
  return unico ? String(unico.idPersonal) : "";
}
