import type {
  DevolucaoAlocacaoEtapa,
  DemandaDevolucaoStatus,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';

export function mapDemandaStatusToEtapa(
  status: DemandaDevolucaoStatus,
): DevolucaoAlocacaoEtapa {
  switch (status) {
    case 'rascunho':
    case 'aberta':
      return 'aguardando';
    case 'em_analise':
      return 'checklist';
    case 'em_execucao':
      return 'conferencia';
    case 'conferida':
      return 'finalizacao';
    case 'concluida':
      return 'concluida';
    case 'cancelada':
      return 'aguardando';
    default:
      return 'aguardando';
  }
}

export function estimateTempoEsperadoDevolucaoMinutos(
  totalItens: number,
  totalNfs: number,
): number {
  const base = totalItens * 3 + totalNfs * 10;
  return Math.max(30, Math.min(180, base));
}
