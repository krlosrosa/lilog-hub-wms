import type { PreRecebimentoSituacaoApi } from '@/features/recebimento/types/recebimento.api';
import type { RecebimentoStatus } from '@/features/recebimento/types/recebimento-lista.schema';
import { RECEBIMENTO_STATUS_LABELS } from '@/features/recebimento/types/recebimento-lista.schema';

export type RecebimentoFiltrosAvancados = {
  situacao: RecebimentoStatus | 'todos';
  transportadora: string;
  dataInicio: string;
  dataFim: string;
};

function formatarDataReferencia(date: Date): string {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function getHojeReferencia(): string {
  return formatarDataReferencia(new Date());
}

export function getDefaultRecebimentoFiltrosAvancados(): RecebimentoFiltrosAvancados {
  const hoje = getHojeReferencia();

  return {
    situacao: 'todos',
    transportadora: '',
    dataInicio: hoje,
    dataFim: hoje,
  };
}

export function normalizeRecebimentoFiltrosAvancados(
  filtros: RecebimentoFiltrosAvancados,
): RecebimentoFiltrosAvancados {
  const hoje = getHojeReferencia();
  const dataInicio = filtros.dataInicio.trim() || hoje;
  const dataFim = filtros.dataFim.trim() || hoje;

  if (dataInicio <= dataFim) {
    return { ...filtros, dataInicio, dataFim };
  }

  return { ...filtros, dataInicio: dataFim, dataFim: dataInicio };
}

function isIntervaloPadraoHoje(filtros: RecebimentoFiltrosAvancados): boolean {
  const hoje = getHojeReferencia();
  return filtros.dataInicio === hoje && filtros.dataFim === hoje;
}

export const FILTROS_STATUS_RECEBIMENTO: readonly RecebimentoStatus[] = [
  'agendado',
  'aguardando',
  'liberado_para_conferencia',
  'em_conferencia',
  'impedido',
  'conferido',
  'finalizado',
] as const;

export function countRecebimentoFiltrosAvancadosAtivos(
  filtros: RecebimentoFiltrosAvancados,
): number {
  let count = 0;

  if (filtros.situacao !== 'todos') count += 1;
  if (filtros.transportadora.trim()) count += 1;
  if (!isIntervaloPadraoHoje(filtros)) count += 1;

  return count;
}

export function mapRecebimentoFiltrosAvancadosToApiParams(
  filtros: RecebimentoFiltrosAvancados,
): {
  situacao?: PreRecebimentoSituacaoApi;
  dataInicio?: string;
  dataFim?: string;
} {
  return {
    situacao:
      filtros.situacao === 'todos'
        ? undefined
        : (filtros.situacao as PreRecebimentoSituacaoApi),
    dataInicio: dateInputToIsoStart(filtros.dataInicio),
    dataFim: dateInputToIsoEnd(filtros.dataFim),
  };
}

export function matchesRecebimentoFiltrosAvancados(
  item: {
    transportador: string;
    horarioPrevisto: string;
    status: RecebimentoStatus;
  },
  filtros: RecebimentoFiltrosAvancados,
): boolean {
  if (
    filtros.situacao !== 'todos' &&
    item.status !== filtros.situacao
  ) {
    return false;
  }

  const transportadora = filtros.transportadora.trim().toLowerCase();
  if (
    transportadora &&
    !item.transportador.toLowerCase().includes(transportadora)
  ) {
    return false;
  }

  if (!matchesDateRange(item.horarioPrevisto, filtros)) {
    return false;
  }

  return true;
}

function dateInputToIsoStart(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  return new Date(`${trimmed}T00:00:00`).toISOString();
}

function dateInputToIsoEnd(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  return new Date(`${trimmed}T23:59:59.999`).toISOString();
}

function matchesDateRange(
  horarioPrevisto: string,
  filtros: RecebimentoFiltrosAvancados,
): boolean {
  const timestamp = new Date(horarioPrevisto).getTime();

  if (filtros.dataInicio.trim()) {
    const start = new Date(`${filtros.dataInicio.trim()}T00:00:00`).getTime();
    if (timestamp < start) return false;
  }

  if (filtros.dataFim.trim()) {
    const end = new Date(`${filtros.dataFim.trim()}T23:59:59.999`).getTime();
    if (timestamp > end) return false;
  }

  return true;
}

export function getRecebimentoStatusLabel(status: RecebimentoStatus): string {
  return RECEBIMENTO_STATUS_LABELS[status];
}
