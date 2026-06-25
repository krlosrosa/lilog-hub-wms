import type { AvariaSelectOption } from '../components/avaria-select-field';
import type { AvariaRegistro } from '../types/recebimento.schema';

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

function resolveOptionLabel(options: readonly AvariaSelectOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function getAvariaRegistroLabels(registro: AvariaRegistro) {
  return {
    tipo: resolveOptionLabel(AVARIA_TIPO_OPTIONS, registro.tipo),
    natureza: resolveOptionLabel(AVARIA_NATUREZA_OPTIONS, registro.natureza),
    causa: resolveOptionLabel(AVARIA_CAUSA_OPTIONS, registro.causa),
  };
}
