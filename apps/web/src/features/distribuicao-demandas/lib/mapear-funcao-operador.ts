import type { FuncaoOperador } from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

export type FuncaoOperadorInterna = FuncaoOperador | 'carregador';

const PRESENCA_ELEGIVEL = new Set(['presente', 'atraso']);

export function mapearFuncaoOperador(cargo: string): FuncaoOperadorInterna {
  const lower = cargo.toLowerCase();
  if (lower.includes('confer')) return 'conferente';
  if (lower.includes('carreg')) return 'carregador';
  return 'separador';
}

export function mapearEmpresaOperador(cargo: string): string {
  const trimmed = cargo.trim();
  if (!trimmed) return '—';
  const parts = trimmed.split(/\s[-–/|]\s/);
  return parts[parts.length - 1]?.trim() || trimmed;
}

export function operadorElegivelPresenca(statusPresenca: string): boolean {
  return PRESENCA_ELEGIVEL.has(statusPresenca);
}
