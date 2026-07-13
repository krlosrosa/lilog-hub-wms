import type {
  AjustarSaldoEnderecoBody,
  BloquearSaldoEnderecoBody,
  DesbloquearSaldoEnderecoBody,
  DisponibilidadeEstoqueAgrupadoItemApi,
  DisponibilidadeEstoqueItemApi,
  ExposicaoEstoqueApi,
  HistoricoMovimentacaoItemApi,
  ListDisponibilidadeEstoqueAgrupadoApiResponse,
  ListDisponibilidadeEstoqueAgrupadoParams,
  ListDisponibilidadeEstoqueApiResponse,
  ListDisponibilidadeEstoqueParams,
  ListHistoricoProdutoApiResponse,
  ListHistoricoProdutoParams,
  ListMotivosBloqueioSaldoApiResponse,
  ListSaldosEnderecoApiResponse,
  ListSaldosEnderecoParams,
  SaldoEnderecoDetalheApi,
  SaldoEnderecoItemApi,
  TransferirSaldoEnderecoBody,
} from '@/features/estoque/types/estoque.api';
import type {
  EstoqueLoteAgrupadoItem,
  EstoqueListaItem,
  EstoqueProdutoAgrupadoItem,
  HistoricoMovimentacaoItem,
  SaldoDetalhe,
} from '@/features/estoque/types/estoque-gestao.schema';
import { apiRequest } from '@/lib/api';

export function mapDisponibilidadeAgrupadoToProdutoItem(
  item: DisponibilidadeEstoqueAgrupadoItemApi,
): EstoqueProdutoAgrupadoItem {
  return {
    produtoId: item.produtoId,
    produtoSku: item.produtoSku,
    produtoDescricao: item.produtoDescricao,
    produtoGrupo: item.produtoGrupo,
    unidadeMedida: item.unidadeMedida,
    totalLotes: item.totalLotes ?? 0,
    posicoes: item.posicoes,
    validadeMaisProxima: item.validadeMaisProxima,
    saldoFisico: item.saldoFisico,
    saldoBloqueado: item.saldoBloqueado,
    saldoDebito: item.saldoDebito,
    saldoReservado: item.saldoReservado,
    saldoDisponivel: item.saldoDisponivel,
    pesoLiquidoTotalKg: item.pesoLiquidoTotalKg,
    vencimentoProximo: item.vencimentoProximo,
    updatedAt: item.updatedAt,
  };
}

export function mapDisponibilidadeAgrupadoToLoteItem(
  item: DisponibilidadeEstoqueAgrupadoItemApi,
): EstoqueLoteAgrupadoItem {
  return {
    produtoId: item.produtoId,
    produtoSku: item.produtoSku,
    produtoDescricao: item.produtoDescricao,
    produtoGrupo: item.produtoGrupo,
    lote: item.lote,
    unidadeMedida: item.unidadeMedida,
    posicoes: item.posicoes,
    validadeMaisProxima: item.validadeMaisProxima,
    saldoFisico: item.saldoFisico,
    saldoBloqueado: item.saldoBloqueado,
    saldoDebito: item.saldoDebito,
    saldoReservado: item.saldoReservado,
    saldoDisponivel: item.saldoDisponivel,
    pesoLiquidoTotalKg: item.pesoLiquidoTotalKg,
    vencimentoProximo: item.vencimentoProximo,
    updatedAt: item.updatedAt,
  };
}

export function mapDisponibilidadeToListaItem(
  item: DisponibilidadeEstoqueItemApi,
): EstoqueListaItem {
  return {
    saldoEnderecoId: item.saldoEnderecoId ?? '',
    produtoId: item.produtoId,
    produtoSku: item.produtoSku,
    produtoDescricao: item.produtoDescricao,
    produtoGrupo: item.produtoGrupo,
    depositoId: item.depositoId,
    depositoCodigo: item.depositoCodigo,
    depositoNome: item.depositoNome,
    enderecoId: item.enderecoId,
    enderecoMascarado: item.enderecoMascarado,
    lote: item.lote,
    numeroSerie: item.numeroSerie,
    validade: item.validade,
    unidadeMedida: item.unidadeMedida,
    saldoFisico: item.saldoFisico,
    saldoBloqueado: item.saldoBloqueado,
    saldoDebito: item.saldoDebito,
    saldoReservado: item.saldoReservado,
    saldoDisponivel: item.saldoDisponivel,
    pesoLiquidoTotalKg: item.pesoLiquidoTotalKg,
    vencimentoProximo: item.vencimentoProximo,
    updatedAt: item.updatedAt,
  };
}

export function listDisponibilidadeEstoque(
  params: ListDisponibilidadeEstoqueParams,
) {
  const searchParams = new URLSearchParams({
    unidadeId: params.unidadeId,
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });

  if (params.produtoId) {
    searchParams.set('produtoId', params.produtoId);
  }

  if (params.depositoId) {
    searchParams.set('depositoId', params.depositoId);
  }

  if (params.enderecoId) {
    searchParams.set('enderecoId', params.enderecoId);
  }

  if (params.status) {
    searchParams.set('status', params.status);
  }

  if (params.natureza) {
    searchParams.set('natureza', params.natureza);
  }

  if (params.lote?.trim()) {
    searchParams.set('lote', params.lote.trim());
  }

  if (params.grupos && params.grupos.length > 0) {
    searchParams.set('grupos', params.grupos.join(','));
  }

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  return apiRequest<ListDisponibilidadeEstoqueApiResponse>(
    `/estoque/disponibilidade?${searchParams.toString()}`,
  );
}

const DISPONIBILIDADE_PAGE_SIZE = 100;

export async function collectEnderecoIdsFromDisponibilidadePages(
  fetchPage: (
    page: number,
    limit: number,
  ) => Promise<{ items: { enderecoId: string }[]; total: number }>,
  pageSize = DISPONIBILIDADE_PAGE_SIZE,
): Promise<Set<string>> {
  const enderecoIds = new Set<string>();
  let page = 1;
  let total = 0;

  do {
    const resp = await fetchPage(page, pageSize);
    total = resp.total;
    for (const item of resp.items) {
      enderecoIds.add(item.enderecoId);
    }
    page += 1;
  } while ((page - 1) * pageSize < total);

  return enderecoIds;
}

export async function listEnderecoIdsComSaldoPorSku(params: {
  unidadeId: string;
  search: string;
  natureza?: ListDisponibilidadeEstoqueParams['natureza'];
}): Promise<Set<string>> {
  return collectEnderecoIdsFromDisponibilidadePages(async (page, limit) => {
    const resp = await listDisponibilidadeEstoque({
      unidadeId: params.unidadeId,
      search: params.search.trim(),
      natureza: params.natureza ?? 'fisico',
      limit,
      page,
    });

    return {
      items: resp.items,
      total: resp.total,
    };
  });
}

export function listDisponibilidadeEstoqueAgrupado(
  params: ListDisponibilidadeEstoqueAgrupadoParams,
) {
  const searchParams = new URLSearchParams({
    unidadeId: params.unidadeId,
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });

  if (params.produtoId) {
    searchParams.set('produtoId', params.produtoId);
  }

  if (params.depositoId) {
    searchParams.set('depositoId', params.depositoId);
  }

  if (params.status) {
    searchParams.set('status', params.status);
  }

  if (params.natureza) {
    searchParams.set('natureza', params.natureza);
  }

  if (params.lote?.trim()) {
    searchParams.set('lote', params.lote.trim());
  }

  if (params.grupos && params.grupos.length > 0) {
    searchParams.set('grupos', params.grupos.join(','));
  }

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  if (params.groupBy) {
    searchParams.set('groupBy', params.groupBy);
  }

  return apiRequest<ListDisponibilidadeEstoqueAgrupadoApiResponse>(
    `/estoque/disponibilidade/agrupado?${searchParams.toString()}`,
  );
}

export function listGruposDisponibilidadeEstoque(unidadeId: string) {
  const searchParams = new URLSearchParams({ unidadeId });
  return apiRequest<{ items: string[] }>(
    `/estoque/disponibilidade/grupos?${searchParams.toString()}`,
  );
}

export function obterExposicaoEstoque(unidadeId: string) {
  const searchParams = new URLSearchParams({ unidadeId });
  return apiRequest<ExposicaoEstoqueApi>(
    `/estoque/exposicao?${searchParams.toString()}`,
  );
}

export function mapHistoricoMovimentacaoItem(
  item: HistoricoMovimentacaoItemApi,
): HistoricoMovimentacaoItem {
  return {
    id: item.id,
    tipoMovimento: item.tipoMovimento,
    quantidade: item.quantidade,
    unidadeMedida: item.unidadeMedida,
    lote: item.lote,
    validade: item.validade,
    numeroSerie: item.numeroSerie,
    natureza: item.natureza,
    documentoRef: item.documentoRef,
    motivo: item.motivo,
    operatorId: item.operatorId,
    operatorNome: item.operatorNome,
    occurredAt: item.occurredAt,
    depositoOrigemId: item.depositoOrigemId,
    depositoOrigemCodigo: item.depositoOrigemCodigo,
    depositoOrigemNome: item.depositoOrigemNome,
    depositoDestinoId: item.depositoDestinoId,
    depositoDestinoCodigo: item.depositoDestinoCodigo,
    depositoDestinoNome: item.depositoDestinoNome,
    enderecoOrigemId: item.enderecoOrigemId,
    enderecoOrigemMascarado: item.enderecoOrigemMascarado,
    enderecoDestinoId: item.enderecoDestinoId,
    enderecoDestinoMascarado: item.enderecoDestinoMascarado,
  };
}

export function fetchHistoricoProduto(params: ListHistoricoProdutoParams) {
  const searchParams = new URLSearchParams({
    unidadeId: params.unidadeId,
    produtoId: params.produtoId,
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });

  if (params.lote?.trim()) {
    searchParams.set('lote', params.lote.trim());
  }

  if (params.depositoId) {
    searchParams.set('depositoId', params.depositoId);
  }

  if (params.enderecoId) {
    searchParams.set('enderecoId', params.enderecoId);
  }

  return apiRequest<ListHistoricoProdutoApiResponse>(
    `/estoque/historico?${searchParams.toString()}`,
  );
}

export function listSaldosEndereco(params: ListSaldosEnderecoParams) {
  const searchParams = new URLSearchParams({
    unidadeId: params.unidadeId,
  });

  if (params.depositoId) {
    searchParams.set('depositoId', params.depositoId);
  }

  if (params.enderecoId) {
    searchParams.set('enderecoId', params.enderecoId);
  }

  if (params.enderecoIds?.length) {
    for (const enderecoId of params.enderecoIds) {
      searchParams.append('enderecoIds', enderecoId);
    }
  }

  if (params.produtoId) {
    searchParams.set('produtoId', params.produtoId);
  }

  if (params.lote?.trim()) {
    searchParams.set('lote', params.lote.trim());
  }

  if (params.status) {
    searchParams.set('status', params.status);
  }

  return apiRequest<ListSaldosEnderecoApiResponse>(
    `/estoque/saldos-endereco?${searchParams.toString()}`,
  );
}

export function getSaldoEndereco(saldoEnderecoId: string) {
  return apiRequest<SaldoEnderecoDetalheApi>(
    `/estoque/saldos-endereco/${saldoEnderecoId}`,
  );
}

export function listMotivosBloqueioSaldo(unidadeId: string) {
  const searchParams = new URLSearchParams({
    unidadeId,
    ativo: 'true',
  });

  return apiRequest<ListMotivosBloqueioSaldoApiResponse>(
    `/estoque/motivos-bloqueio?${searchParams.toString()}`,
  );
}

export function bloquearSaldoEndereco(
  saldoEnderecoId: string,
  body: BloquearSaldoEnderecoBody,
) {
  return apiRequest<SaldoEnderecoItemApi>(
    `/estoque/saldos-endereco/${saldoEnderecoId}/bloquear`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export function desbloquearSaldoEndereco(
  saldoEnderecoId: string,
  body: DesbloquearSaldoEnderecoBody = {},
) {
  return apiRequest<SaldoEnderecoItemApi>(
    `/estoque/saldos-endereco/${saldoEnderecoId}/desbloquear`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export function ajustarSaldoEndereco(
  saldoEnderecoId: string,
  body: AjustarSaldoEnderecoBody,
) {
  return apiRequest<SaldoEnderecoItemApi>(
    `/estoque/saldos-endereco/${saldoEnderecoId}/ajustar`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export function transferirSaldoEndereco(
  saldoEnderecoId: string,
  body: TransferirSaldoEnderecoBody,
) {
  return apiRequest<SaldoEnderecoItemApi>(
    `/estoque/saldos-endereco/${saldoEnderecoId}/transferir`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export function mapSaldoEnderecoToListaItem(
  item: SaldoEnderecoItemApi & {
    produtoSku: string;
    produtoNome: string;
    produtoGrupo?: string | null;
    depositoCodigo: string;
    depositoNome: string;
  },
): EstoqueListaItem {
  const saldoFisico =
    item.status === 'liberado' && item.natureza === 'fisico' ? item.quantidade : 0;
  const saldoBloqueado = item.status === 'bloqueado' ? item.quantidade : 0;
  const saldoDebito = item.natureza === 'debito' ? item.quantidade : 0;

  return {
    saldoEnderecoId: item.id,
    produtoId: item.produtoId,
    produtoSku: item.produtoSku,
    produtoDescricao: item.produtoNome,
    produtoGrupo: item.produtoGrupo ?? null,
    depositoId: item.depositoId,
    depositoCodigo: item.depositoCodigo,
    depositoNome: item.depositoNome,
    enderecoId: item.enderecoId,
    enderecoMascarado: item.enderecoMascarado ?? '—',
    lote: item.lote,
    numeroSerie: item.numeroSerie,
    validade: item.validade,
    unidadeMedida: item.unidadeMedida,
    saldoFisico,
    saldoBloqueado,
    saldoDebito,
    saldoReservado: 0,
    saldoDisponivel: saldoFisico,
    pesoLiquidoTotalKg: null,
    vencimentoProximo: false,
    updatedAt: item.updatedAt,
  };
}

export function mapSaldoEnderecoDetalheApi(
  item: SaldoEnderecoDetalheApi,
): SaldoDetalhe {
  return {
    id: item.id,
    unidadeId: item.unidadeId,
    produtoId: item.produtoId,
    produtoSku: item.produtoSku,
    produtoDescricao: item.produtoDescricao,
    produtoGrupo: item.produtoGrupo,
    depositoId: item.depositoId,
    depositoCodigo: item.depositoCodigo,
    depositoNome: item.depositoNome,
    enderecoId: item.enderecoId,
    enderecoMascarado: item.enderecoMascarado ?? '—',
    lote: item.lote,
    validade: item.validade,
    numeroSerie: item.numeroSerie,
    natureza: item.natureza,
    status: item.status,
    motivoBloqueio: item.motivoBloqueio,
    observacaoBloqueio: item.observacaoBloqueio,
    bloqueadoEm: item.bloqueadoEm,
    bloqueadoPor: item.bloqueadoPor,
    quantidade: item.quantidade,
    unidadeMedida: item.unidadeMedida,
    saldoReservado: item.saldoReservado,
    updatedAt: item.updatedAt,
  };
}
