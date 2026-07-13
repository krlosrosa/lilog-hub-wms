import type { OperadorDemandaApi } from '../types/recebimento.api';
import type { CompanyCode, Demand, DemandStatus } from '../types/recebimento.schema';

const COMPANY_CODES: CompanyCode[] = ['ITB', 'DPA', 'LDB'];

export function resolveCompanyCodesFromUnidadeId(unidadeId: string): CompanyCode[] {
  const upper = unidadeId.toUpperCase();

  const exact = COMPANY_CODES.find((code) => code === upper);
  if (exact) return [exact];

  const matched = COMPANY_CODES.filter((code) => upper.includes(code));
  if (matched.length > 0) return matched.slice(0, 3);

  return ['ITB'];
}

function mapSituacaoToStatus(situacao: string): DemandStatus {
  if (
    situacao === 'liberado_para_conferencia' ||
    situacao === 'agendado' ||
    situacao === 'aguardando'
  ) {
    if (situacao === 'liberado_para_conferencia') {
      return 'liberado_para_conferencia';
    }

    return situacao === 'aguardando' ? 'aguardando' : 'agendado';
  }

  if (situacao === 'em_conferencia') {
    return 'em_conferencia';
  }

  if (situacao === 'impedido') {
    return 'impedido';
  }

  if (situacao === 'conferido') {
    return 'conferido';
  }

  if (situacao === 'finalizado') {
    return 'finalizado';
  }

  return 'agendado';
}

function mapSituacaoToStatusLabel(situacao: string): string {
  if (situacao === 'liberado_para_conferencia') {
    return 'Liberado p/ conferência';
  }

  if (situacao === 'aguardando') {
    return 'Aguardando';
  }

  if (situacao === 'em_conferencia') {
    return 'Em conferência';
  }

  if (situacao === 'impedido') {
    return 'Impedido';
  }

  if (situacao === 'conferido') {
    return 'Conferido';
  }

  if (situacao === 'finalizado') {
    return 'Finalizado';
  }

  return 'Aguardando liberação';
}

function formatHorario(iso: string): string {
  const date = new Date(iso);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDock(dock: string | null): string {
  if (!dock) return '—';
  if (/^\d+$/.test(dock)) {
    return `Doca ${dock}`;
  }
  return dock.startsWith('Doca') ? dock : `Doca ${dock}`;
}

export function mapOperadorDemandaToDemand(item: OperadorDemandaApi): Demand {
  const isLate =
    item.situacao === 'liberado_para_conferencia'
      ? new Date(item.horarioPrevisto).getTime() < Date.now()
      : false;

  return {
    id: item.preRecebimentoId,
    routeId: item.preRecebimentoId,
    supplier: item.transportadoraNome ?? '—',
    dock: formatDock(item.dock),
    arrival: formatHorario(item.horarioPrevisto),
    status: mapSituacaoToStatus(item.situacao),
    statusLabel: mapSituacaoToStatusLabel(item.situacao),
    companies: resolveCompanyCodesFromUnidadeId(item.unidadeId),
    skuCount: item.skuCount,
    isPriority: isLate,
    pulse: isLate,
    tagLabel: isLate ? 'Atrasado' : undefined,
    tagVariant: isLate ? 'error' : undefined,
    recebimentoId: item.recebimentoId ?? undefined,
    unidadeId: item.unidadeId,
    preRecebimentoSituacao: item.situacao,
    placa: item.placa,
    conferenteId: item.conferenteId ?? undefined,
    conferente: item.conferente ?? undefined,
    conferenteMatricula: item.conferenteMatricula ?? undefined,
  };
}
