import type {
  DemandaArmazenagemDetalheApi,
  DemandaArmazenagemListItemApi,
} from '@/features/estoque/armazenagem/lib/armazenagem-api';

import type { Prioridade, Tarefa } from '../types/movimentacao.schema';

function mapStatusToPrioridade(
  status: DemandaArmazenagemListItemApi['status'],
): Prioridade {
  if (status === 'aguardando_inicio') return 'alta';
  if (status === 'em_andamento') return 'media';
  return 'baixa';
}

function buildTarefaBase(
  demanda: DemandaArmazenagemListItemApi,
  overrides: Partial<Tarefa> = {},
): Tarefa {
  const prioridade = mapStatusToPrioridade(demanda.status);
  const footerLabel =
    demanda.status === 'aguardando_inicio'
      ? 'Aguardando início'
      : demanda.status === 'em_andamento'
        ? 'Em andamento'
        : undefined;

  return {
    id: demanda.id,
    taskId: `#${demanda.id.slice(0, 8).toUpperCase()}`,
    prioridade,
    origem: `Recebimento ${demanda.recebimentoId.slice(0, 8)}`,
    item: demanda.modoUnitizacao.replaceAll('_', ' '),
    qty: 1,
    footerLabel,
    destino: '',
    destinoQrExpected: '',
    sscc: '',
    produto: '',
    qtyLabel: '',
    pesoTotal: '',
    sku: '',
    lote: '',
    skuNome: '',
    skuDescricao: '',
    skuQty: 1,
    ...overrides,
  };
}

export function mapDemandaListToTarefa(
  demanda: DemandaArmazenagemListItemApi,
): Tarefa {
  return buildTarefaBase(demanda);
}

export function mapDemandaDetailToTarefa(
  demanda: DemandaArmazenagemDetalheApi,
): Tarefa {
  const item =
    demanda.itens.find(
      (i) => i.status === 'pendente' || i.status === 'em_andamento',
    ) ?? demanda.itens[0];

  const pendentes = demanda.itens.filter((i) => i.status !== 'armazenado').length;
  const destino = item?.enderecoSugeridoLabel ?? '';
  const destinoQr = destino.replace(/[\s,.-]/g, '').toUpperCase();

  return buildTarefaBase(demanda, {
    qty: pendentes > 0 ? pendentes : 1,
    item: item?.produtoNome ?? item?.produtoSku ?? 'Armazenagem',
    destino,
    destinoQrExpected: destinoQr,
    sscc: item?.unitizadorId ?? '',
    produto: item?.produtoNome ?? '',
    qtyLabel: item ? `${item.quantidade} ${item.unidadeMedida}` : '',
    pesoTotal: '',
    sku: item?.produtoSku ?? item?.produtoId ?? '',
    lote: item?.lote ?? '',
    skuNome: item?.produtoNome ?? '',
    skuDescricao: item?.produtoSku ?? '',
    skuQty: item?.quantidade ?? 1,
    tags: item?.enderecoSugeridoLabel
      ? [`Destino: ${item.enderecoSugeridoLabel}`]
      : undefined,
  });
}
