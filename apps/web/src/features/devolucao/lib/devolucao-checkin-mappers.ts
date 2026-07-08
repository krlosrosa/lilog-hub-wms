import type {
  BuscarDemandaDevolucaoResponse,
  DevolucaoItemCondicao,
  DevolucaoNotaFiscalDetalhe,
} from '@/features/devolucao/types/devolucao-buscar.schema';
import type {
  NfItem,
  NfRow,
  TripInfo,
} from '@/features/devolucao/types/devolucao-checkin.schema';
import type { DemandaDevolucaoStatus } from '@/features/devolucao/types/devolucao-gestao.schema';

function mapCondicaoToItemStatus(
  condicao: DevolucaoItemCondicao,
  qtdDevolucao: number,
  qtdConferida: number,
): NfItem['status'] {
  if (condicao === 'integro' && qtdConferida >= qtdDevolucao && qtdDevolucao > 0) {
    return 'validado';
  }
  if (
    condicao === 'avariado' ||
    condicao === 'vencido' ||
    condicao === 'violado'
  ) {
    return 'divergente';
  }
  if (qtdConferida > 0 && qtdConferida !== qtdDevolucao) {
    return 'divergente';
  }
  return 'pendente';
}

function mapItemStatusToCondicao(
  status: NfItem['status'],
): DevolucaoItemCondicao {
  switch (status) {
    case 'validado':
      return 'integro';
    case 'divergente':
      return 'avariado';
    case 'pendente':
      return 'nao_identificado';
  }
}

function deriveNfStatus(
  itens: NfItem[],
  itensTotal: number,
): NfRow['status'] {
  const itensValidados = itens.filter((i) => i.status === 'validado').length;
  const hasDivergencia = itens.some((i) => i.status === 'divergente');

  if (hasDivergencia) return 'divergente';
  if (itensValidados >= itensTotal) return 'validado';
  if (itensValidados > 0) return 'parcial';
  return 'pendente';
}

function mapItemToNfItem(
  item: DevolucaoNotaFiscalDetalhe['itens'][number],
): NfItem {
  const qtdNf = Math.round(item.quantidade);
  const qtdDevolucao = Math.round(item.quantidadeNormalizadaUnidades);
  const qtdConferida = Math.round(item.qtdConferida ?? 0);

  return {
    id: item.id,
    sku: item.sku,
    produto: item.descricaoProduto ?? item.sku,
    qtdNf,
    qtdDevolucao,
    qtdConferida,
    motivo: item.motivoItem ?? '',
    status: mapCondicaoToItemStatus(item.condicao, qtdDevolucao, qtdConferida),
  };
}

export function mapNotasFiscaisToNfRows(
  nfs: DevolucaoNotaFiscalDetalhe[],
): NfRow[] {
  return nfs.map((nf) => {
    const itens = nf.itens.map(mapItemToNfItem);
    const itensTotal = itens.length;
    const itensValidados = itens.filter((i) => i.status === 'validado').length;
    const qtdDevolvida = itens.reduce((acc, i) => acc + i.qtdDevolucao, 0);
    const hasDivergencia = itens.some((i) => i.status === 'divergente');

    return {
      id: nf.id,
      numero: nf.numeroNf,
      cliente: nf.cliente ?? '—',
      tipoDevolucao: nf.tipo === 'devolucao_total' ? 'total' : 'parcial',
      itensValidados,
      itensTotal: Math.max(itensTotal, 1),
      qtdDevolvida,
      motivo: nf.motivo,
      valorTotal: 0,
      status: deriveNfStatus(itens, Math.max(itensTotal, 1)),
      itens,
      divergenciaCritica: hasDivergencia,
      mensagemDivergencia: hasDivergencia
        ? 'Divergência detectada na conferência'
        : undefined,
    };
  });
}

export function mapDemandaToTripInfo(
  demanda: BuscarDemandaDevolucaoResponse,
): TripInfo {
  return {
    motorista: '—',
    placa: demanda.placa ?? '—',
    transportadora: '—',
    viagemRavexId: demanda.transporteId
      ? `#${demanda.transporteId}`
      : demanda.codigoDemanda,
  };
}

export function mapNfItemsToConferenciaPayload(itens: NfItem[]) {
  return itens.map((item) => ({
    itemId: item.id,
    qtdConferida:
      item.status === 'validado' ? item.qtdDevolucao : item.qtdConferida,
    condicao: mapItemStatusToCondicao(item.status),
    observacao: item.motivo || null,
  }));
}

export const REGISTRO_CHEGADA_STATUS: DemandaDevolucaoStatus[] = [
  'rascunho',
  'aberta',
  'em_analise',
];

export function canAccessRegistroChegada(
  status: DemandaDevolucaoStatus,
): boolean {
  return REGISTRO_CHEGADA_STATUS.includes(status);
}
