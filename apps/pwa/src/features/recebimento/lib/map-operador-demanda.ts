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
  if (situacao === 'em_recebimento') {
    return 'em_conferencia';
  }

  if (situacao === 'aprovado' || situacao === 'finalizado') {
    return 'concluido';
  }

  return 'aguardando';
}

function mapSituacaoToStatusLabel(situacao: string): string {
  if (situacao === 'aguardando_aprovacao') {
    return 'Aguardando aprovação';
  }

  if (situacao === 'veiculo_chegou') {
    return 'Veículo no pátio';
  }

  if (situacao === 'em_recebimento') {
    return 'Em conferência';
  }

  return 'Aguardando';
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
    item.situacao === 'agendado' || item.situacao === 'veiculo_chegou'
      ? new Date(item.horarioPrevisto).getTime() < Date.now()
      : false;

  const awaitingApproval = item.situacao === 'aguardando_aprovacao';

  return {
    id: item.preRecebimentoId,
    routeId: item.preRecebimentoId,
    supplier: item.transportadoraId,
    dock: formatDock(item.dock),
    arrival: formatHorario(item.horarioPrevisto),
    status: mapSituacaoToStatus(item.situacao),
    statusLabel: mapSituacaoToStatusLabel(item.situacao),
    companies: resolveCompanyCodesFromUnidadeId(item.unidadeId),
    skuCount: item.skuCount,
    isPriority: isLate,
    pulse: isLate,
    tagLabel: awaitingApproval ? 'Pendente aprovação' : isLate ? 'Atrasado' : undefined,
    tagVariant: awaitingApproval ? 'default' : isLate ? 'error' : undefined,
    recebimentoId: item.recebimentoId ?? undefined,
    unidadeId: item.unidadeId,
    preRecebimentoSituacao: item.situacao,
  };
}
