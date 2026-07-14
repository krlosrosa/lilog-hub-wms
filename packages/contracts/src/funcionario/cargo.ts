import { z } from 'zod';

export const FuncionarioCargoSchema = z.enum([
  'operador_empilhadeira',
  'ajudante',
  'auxiliar_I',
  'auxiliar_II',
  'separador',
  'conferente',
  'lider',
  'supervisor',
  'administrativo',
]);

export type FuncionarioCargo = z.infer<typeof FuncionarioCargoSchema>;

export const FUNCIONARIO_CARGOS = FuncionarioCargoSchema.options;

export const FUNCIONARIO_CARGO_LABELS: Record<FuncionarioCargo, string> = {
  operador_empilhadeira: 'Operador Empilhadeira',
  ajudante: 'Ajudante',
  auxiliar_I: 'Auxiliar I',
  auxiliar_II: 'Auxiliar II',
  separador: 'Separador',
  conferente: 'Conferente',
  lider: 'Líder',
  supervisor: 'Supervisor',
  administrativo: 'Administrativo',
};

export const FUNCIONARIO_CARGO_OPTIONS = FUNCIONARIO_CARGOS.map((value) => ({
  value,
  label: FUNCIONARIO_CARGO_LABELS[value],
}));

const LEGACY_CARGO_ALIASES: Record<string, FuncionarioCargo> = {
  operador_empilhadeia: 'operador_empilhadeira',
};

function normalizeCargoText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseFuncionarioCargo(raw: string): FuncionarioCargo | null {
  const trimmed = raw.trim();

  if (!trimmed) {
    return null;
  }

  if (FUNCIONARIO_CARGOS.includes(trimmed as FuncionarioCargo)) {
    return trimmed as FuncionarioCargo;
  }

  const legacyCargo = LEGACY_CARGO_ALIASES[trimmed];

  if (legacyCargo) {
    return legacyCargo;
  }

  const normalized = normalizeCargoText(trimmed);

  for (const [value, label] of Object.entries(FUNCIONARIO_CARGO_LABELS)) {
    if (normalizeCargoText(label) === normalized) {
      return value as FuncionarioCargo;
    }
  }

  const snake = normalized.replace(/\s+/g, '_');
  const legacySnakeCargo = LEGACY_CARGO_ALIASES[snake];

  if (legacySnakeCargo) {
    return legacySnakeCargo;
  }

  if (snake === 'auxiliar_i') {
    return 'auxiliar_I';
  }

  if (snake === 'auxiliar_ii') {
    return 'auxiliar_II';
  }

  if (FUNCIONARIO_CARGOS.includes(snake as FuncionarioCargo)) {
    return snake as FuncionarioCargo;
  }

  return null;
}
