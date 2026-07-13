import type { CncItemTipo, CncSituacao } from '@/features/cnc/types/cnc.schema';

export type CncItensFiltros = {
  dataInicio: string;
  dataFim: string;
  situacao: CncSituacao | 'todos';
  tipo: CncItemTipo | 'todos';
};

function formatarDataReferencia(date: Date): string {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function getSemanaAtualRange(): { dataInicio: string; dataFim: string } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    dataInicio: formatarDataReferencia(monday),
    dataFim: formatarDataReferencia(sunday),
  };
}

export function getDefaultCncItensFiltros(): CncItensFiltros {
  const { dataInicio, dataFim } = getSemanaAtualRange();

  return {
    dataInicio,
    dataFim,
    situacao: 'todos',
    tipo: 'todos',
  };
}

export function normalizeCncItensFiltros(
  filtros: CncItensFiltros,
): CncItensFiltros {
  const defaults = getDefaultCncItensFiltros();
  const dataInicio = filtros.dataInicio.trim() || defaults.dataInicio;
  const dataFim = filtros.dataFim.trim() || defaults.dataFim;

  if (dataInicio <= dataFim) {
    return { ...filtros, dataInicio, dataFim };
  }

  return { ...filtros, dataInicio: dataFim, dataFim: dataInicio };
}

function isIntervaloPadraoSemanaAtual(filtros: CncItensFiltros): boolean {
  const { dataInicio, dataFim } = getSemanaAtualRange();
  return filtros.dataInicio === dataInicio && filtros.dataFim === dataFim;
}

export function countCncItensFiltrosAtivos(filtros: CncItensFiltros): number {
  let count = 0;

  if (filtros.situacao !== 'todos') count += 1;
  if (filtros.tipo !== 'todos') count += 1;
  if (!isIntervaloPadraoSemanaAtual(filtros)) count += 1;

  return count;
}

export function mapCncItensFiltrosToApiParams(filtros: CncItensFiltros): {
  dataInicio: string;
  dataFim: string;
  situacao?: CncSituacao;
  tipo?: CncItemTipo;
} {
  const normalized = normalizeCncItensFiltros(filtros);

  return {
    dataInicio: normalized.dataInicio,
    dataFim: normalized.dataFim,
    situacao:
      normalized.situacao === 'todos' ? undefined : normalized.situacao,
    tipo: normalized.tipo === 'todos' ? undefined : normalized.tipo,
  };
}

export const FILTROS_SITUACAO_CNC: readonly CncSituacao[] = [
  'pendente',
  'em_analise',
  'encerrada',
  'cancelada',
] as const;

export const FILTROS_TIPO_CNC_ITEM: readonly CncItemTipo[] = [
  'divergencia',
  'avaria',
] as const;
