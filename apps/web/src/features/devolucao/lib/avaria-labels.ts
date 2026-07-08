type AvariaSelectOption = {
  value: string;
  label: string;
};

export const AVARIA_TIPO_OPTIONS: readonly AvariaSelectOption[] = [
  { value: 'fisica', label: 'Avaria Física' },
  { value: 'embalagem', label: 'Embalagem' },
  { value: 'qualidade', label: 'Qualidade' },
  { value: 'documental', label: 'Documental' },
] as const;

export const AVARIA_NATUREZA_OPTIONS: readonly AvariaSelectOption[] = [
  { value: 'parcial', label: 'Avaria Parcial' },
  { value: 'total', label: 'Avaria Total' },
  { value: 'superficial', label: 'Avaria Superficial' },
  { value: 'irreversivel', label: 'Avaria Irreversível' },
] as const;

export const AVARIA_CAUSA_OPTIONS: readonly AvariaSelectOption[] = [
  { value: 'transporte', label: 'Transporte' },
  { value: 'manuseio', label: 'Manuseio' },
  { value: 'armazenamento', label: 'Armazenamento' },
  { value: 'fornecedor', label: 'Fornecedor' },
  { value: 'indeterminada', label: 'Indeterminada' },
] as const;

function resolveOptionLabel(
  options: readonly AvariaSelectOption[],
  value: string | null | undefined,
) {
  if (!value) return null;
  return options.find((option) => option.value === value)?.label ?? value;
}

export function getAvariaDetalheLabels(avaria: {
  tipo: string;
  natureza: string | null;
  causa: string | null;
}) {
  return {
    tipo: resolveOptionLabel(AVARIA_TIPO_OPTIONS, avaria.tipo) ?? avaria.tipo,
    natureza: resolveOptionLabel(AVARIA_NATUREZA_OPTIONS, avaria.natureza),
    causa: resolveOptionLabel(AVARIA_CAUSA_OPTIONS, avaria.causa),
  };
}
