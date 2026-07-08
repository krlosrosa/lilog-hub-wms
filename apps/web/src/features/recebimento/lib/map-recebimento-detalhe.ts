import type { ProdutoApi } from '@/features/produto/types/produto.api';
import type {
  ChecklistRecebimentoApi,
  PreRecebimentoApi,
  PreRecebimentoSituacaoApi,
  RecebimentoApi,
} from '@/features/recebimento/types/recebimento.api';
import type {
  ConferenciaItem,
  ConferenciaStatus,
  FotoEvidencia,
  InspecaoTermica,
  LoteDetalheItem,
  RecebimentoDetalhe,
} from '@/features/recebimento/types/recebimento-detalhe.schema';
import type { RecebimentoStatus } from '@/features/recebimento/types/recebimento-lista.schema';

function mapSituacaoToStatus(
  situacao: PreRecebimentoSituacaoApi,
): RecebimentoStatus {
  return situacao;
}

function formatDataInicio(iso: string, unidade: string): string {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));

  return `${formatted} · ${unidade}`;
}

function toBaseUnits(qty: number, uom: string, fator: number): number {
  return uom === 'CX' ? qty * fator : qty;
}

function buildConferenciaStatus(
  quantidadeEsperada: number,
  quantidadeRecebida: number,
  hasRecebimento: boolean,
): ConferenciaStatus {
  if (!hasRecebimento) {
    return 'concluido';
  }

  if (quantidadeRecebida < quantidadeEsperada) {
    return 'faltante';
  }

  if (quantidadeRecebida > quantidadeEsperada) {
    return 'sobra';
  }

  return 'concluido';
}

function formatLoteLabel(lotes: string[]): string {
  if (lotes.length === 1) {
    return lotes[0] ?? '—';
  }

  if (lotes.length > 1) {
    return `${lotes.length} lotes`;
  }

  return '—';
}

const SEM_LOTE_KEY = '__sem_lote__';

function toLoteKey(lote: string | null | undefined): string {
  return lote ?? SEM_LOTE_KEY;
}

function loteKeyToLabel(loteKey: string): string | null {
  return loteKey === SEM_LOTE_KEY ? null : loteKey;
}

type EsperadoLinha = {
  lote: string | null;
  qtdEsperada: number;
};

type EsperadoAgrupado = {
  firstId: string;
  qtdXml: number;
  lotesEsperados: string[];
  linhas: EsperadoLinha[];
};

function groupEsperadosPorProduto(
  itensEsperados: NonNullable<PreRecebimentoApi['itens']>,
): Map<string, EsperadoAgrupado> {
  const esperadoPorProduto = new Map<string, EsperadoAgrupado>();

  for (const esperado of itensEsperados) {
    const qtdXml = toBaseUnits(
      esperado.quantidadeEsperada,
      esperado.unidadeMedida,
      esperado.unidadesPorCaixa ?? 1,
    );
    const linha: EsperadoLinha = {
      lote: esperado.loteEsperado ?? null,
      qtdEsperada: qtdXml,
    };
    const current = esperadoPorProduto.get(esperado.produtoId);

    if (current) {
      current.qtdXml += qtdXml;
      current.linhas.push(linha);
      if (esperado.loteEsperado) {
        current.lotesEsperados.push(esperado.loteEsperado);
      }
      continue;
    }

    esperadoPorProduto.set(esperado.produtoId, {
      firstId: esperado.id,
      qtdXml,
      lotesEsperados: esperado.loteEsperado ? [esperado.loteEsperado] : [],
      linhas: [linha],
    });
  }

  return esperadoPorProduto;
}

function groupRecebidosPorProduto(
  itensRecebidos: NonNullable<RecebimentoApi['itens']>,
): {
  qtdFisicaPorProduto: Map<string, number>;
  lotesRecebidosPorProduto: Map<string, string[]>;
  recebidoPorLote: Map<string, Map<string, number>>;
} {
  const qtdFisicaPorProduto = new Map<string, number>();
  const lotesRecebidosPorProduto = new Map<string, string[]>();
  const recebidoPorLote = new Map<string, Map<string, number>>();

  for (const recebido of itensRecebidos) {
    qtdFisicaPorProduto.set(
      recebido.produtoId,
      (qtdFisicaPorProduto.get(recebido.produtoId) ?? 0) +
        recebido.quantidadeRecebida,
    );

    const loteKey = toLoteKey(recebido.loteRecebido);
    const porLote =
      recebidoPorLote.get(recebido.produtoId) ?? new Map<string, number>();
    porLote.set(
      loteKey,
      (porLote.get(loteKey) ?? 0) + recebido.quantidadeRecebida,
    );
    recebidoPorLote.set(recebido.produtoId, porLote);

    if (!recebido.loteRecebido) {
      continue;
    }

    const lotes = lotesRecebidosPorProduto.get(recebido.produtoId) ?? [];
    lotes.push(recebido.loteRecebido);
    lotesRecebidosPorProduto.set(recebido.produtoId, lotes);
  }

  return { qtdFisicaPorProduto, lotesRecebidosPorProduto, recebidoPorLote };
}

function shouldIncludeLotesDetalhe(input: {
  linhas: EsperadoLinha[];
  recebidoPorLote?: Map<string, number>;
}): boolean {
  if (input.linhas.length > 1) {
    return true;
  }

  if (input.linhas.some((linha) => linha.lote)) {
    return true;
  }

  if (input.recebidoPorLote && input.recebidoPorLote.size > 0) {
    return true;
  }

  return false;
}

function buildLotesDetalheFromEsperado(input: {
  linhas: EsperadoLinha[];
  recebidoPorLote?: Map<string, number>;
}): LoteDetalheItem[] {
  const { linhas, recebidoPorLote } = input;

  if (!shouldIncludeLotesDetalhe({ linhas, recebidoPorLote })) {
    return [];
  }

  const usedLoteKeys = new Set<string>();
  const detalhes: LoteDetalheItem[] = linhas.map((linha) => {
    const loteKey = toLoteKey(linha.lote);
    usedLoteKeys.add(loteKey);

    return {
      lote: linha.lote,
      qtdEsperada: linha.qtdEsperada,
      qtdRecebida: recebidoPorLote?.get(loteKey) ?? 0,
    };
  });

  if (recebidoPorLote) {
    for (const [loteKey, qtdRecebida] of recebidoPorLote) {
      if (usedLoteKeys.has(loteKey)) {
        continue;
      }

      detalhes.push({
        lote: loteKeyToLabel(loteKey),
        qtdEsperada: 0,
        qtdRecebida,
      });
    }
  }

  return detalhes;
}

function buildLotesDetalheFromRecebido(
  recebidos: NonNullable<RecebimentoApi['itens']>,
): LoteDetalheItem[] {
  const porLote = new Map<string, number>();

  for (const recebido of recebidos) {
    const loteKey = toLoteKey(recebido.loteRecebido);
    porLote.set(
      loteKey,
      (porLote.get(loteKey) ?? 0) + recebido.quantidadeRecebida,
    );
  }

  if (porLote.size === 0) {
    return [];
  }

  return [...porLote.entries()].map(([loteKey, qtdRecebida]) => ({
    lote: loteKeyToLabel(loteKey),
    qtdEsperada: 0,
    qtdRecebida,
  }));
}

function buildConferencia(
  preRecebimento: PreRecebimentoApi,
  recebimento: RecebimentoApi | null,
  produtoMap: Map<string, ProdutoApi>,
): ConferenciaItem[] {
  const itensEsperados = preRecebimento.itens ?? [];
  const itensRecebidos = recebimento?.itens ?? [];
  const esperadoProdutoIds = new Set(
    itensEsperados.map((item) => item.produtoId),
  );
  const esperadoPorProduto = groupEsperadosPorProduto(itensEsperados);
  const { qtdFisicaPorProduto, lotesRecebidosPorProduto, recebidoPorLote } =
    groupRecebidosPorProduto(itensRecebidos);

  const expectedRows: ConferenciaItem[] = [
    ...esperadoPorProduto.entries(),
  ].map(([produtoId, grupo]) => {
    const produto = produtoMap.get(produtoId);
    const qtdXml = grupo.qtdXml;
    const qtdFisica = qtdFisicaPorProduto.get(produtoId) ?? 0;
    const lotesEsperados = grupo.lotesEsperados;
    const lotesRecebidos = lotesRecebidosPorProduto.get(produtoId) ?? [];
    const lotesParaExibir =
      lotesEsperados.length > 0 ? lotesEsperados : lotesRecebidos;
    const lotesDetalhe = buildLotesDetalheFromEsperado({
      linhas: grupo.linhas,
      recebidoPorLote: recebidoPorLote.get(produtoId),
    });

    return {
      id: grupo.firstId,
      produtoId,
      sku: produto?.sku ?? produtoId.toUpperCase(),
      produto: produto?.descricao ?? 'Produto não identificado',
      lote: formatLoteLabel(lotesParaExibir),
      ean: produto?.ean ?? '—',
      qtdXml,
      qtdFisica,
      status: buildConferenciaStatus(qtdXml, qtdFisica, Boolean(recebimento)),
      avarias: [],
      lotesDetalhe,
    };
  });

  const orphanPorProduto = new Map<string, typeof itensRecebidos>();
  for (const recebido of itensRecebidos) {
    if (esperadoProdutoIds.has(recebido.produtoId)) {
      continue;
    }

    const current = orphanPorProduto.get(recebido.produtoId) ?? [];
    current.push(recebido);
    orphanPorProduto.set(recebido.produtoId, current);
  }

  const orphanRows: ConferenciaItem[] = [...orphanPorProduto.entries()].map(
    ([produtoId, recebidos]) => {
      const produto = produtoMap.get(produtoId);
      const qtdFisica = recebidos.reduce(
        (acc, row) => acc + row.quantidadeRecebida,
        0,
      );
      const lotes = recebidos
        .map((row) => row.loteRecebido)
        .filter((lote): lote is string => Boolean(lote));
      const lotesDetalhe = buildLotesDetalheFromRecebido(recebidos);

      return {
        id: recebidos[0]!.id,
        produtoId,
        sku: produto?.sku ?? produtoId.toUpperCase(),
        produto: produto?.descricao ?? 'Produto não identificado',
        lote: formatLoteLabel(lotes),
        ean: produto?.ean ?? '—',
        qtdXml: 0,
        qtdFisica,
        status: buildConferenciaStatus(0, qtdFisica, Boolean(recebimento)),
        avarias: [],
        lotesDetalhe,
      };
    },
  );

  return [...expectedRows, ...orphanRows];
}

const CONDITION_LABELS: Record<keyof ChecklistRecebimentoApi['conditions'], string> =
  {
    limpeza: 'Limpeza interna',
    odor: 'Ausência de odor',
    estrutura: 'Integridade estrutural',
    vedacao: 'Vedação das portas',
  };

export function mapChecklistToInspecao(
  checklist: ChecklistRecebimentoApi | null,
  divergenciasCount: number,
): InspecaoTermica {
  if (!checklist) {
    return {
      tempBau: null,
      tempProduto: null,
      checklistPreenchido: false,
      anomalias: divergenciasCount,
      anomaliasDescricao:
        divergenciasCount > 0
          ? `${divergenciasCount} divergência(s) registrada(s)`
          : 'Checklist ainda não preenchido',
    };
  }

  const failedConditions = (
    Object.keys(CONDITION_LABELS) as Array<
      keyof ChecklistRecebimentoApi['conditions']
    >
  ).filter((key) => !checklist.conditions[key]);

  const anomalias = failedConditions.length + divergenciasCount;
  const descricoes = [
    ...failedConditions.map((key) => CONDITION_LABELS[key]),
    ...(divergenciasCount > 0
      ? [`${divergenciasCount} divergência(s) na conferência`]
      : []),
  ];

  return {
    tempBau: checklist.tempBau,
    tempProduto: checklist.tempProduto,
    lacre: checklist.lacre,
    observacoes: checklist.observacoes,
    conditions: checklist.conditions,
    checklistPreenchido: true,
    anomalias,
    anomaliasDescricao:
      descricoes.length > 0
        ? descricoes.join(' · ')
        : 'Checklist aprovado sem pendências',
  };
}

export function mapRecebimentoDetalhe(input: {
  preRecebimento: PreRecebimentoApi;
  recebimento: RecebimentoApi | null;
  produtoMap: Map<string, ProdutoApi>;
  checklist?: ChecklistRecebimentoApi | null;
  fotos?: FotoEvidencia[];
  fotoTotalInformado?: number;
}): RecebimentoDetalhe {
  const {
    preRecebimento,
    recebimento,
    produtoMap,
    checklist = null,
    fotos = [],
    fotoTotalInformado = 0,
  } = input;
  const divergenciasCount = recebimento?.divergencias?.length ?? 0;
  const dataReferencia =
    recebimento?.dataInicio ?? preRecebimento.horarioPrevisto;

  const temPaletesBipados = (recebimento?.itens ?? []).some(
    (item) => Boolean(item.unitizadorId) || Boolean(item.unitizadorCodigo),
  );

  return {
    id: preRecebimento.id,
    numero: `PR-${preRecebimento.id.slice(0, 8).toUpperCase()}`,
    dataInicio: formatDataInicio(
      dataReferencia,
      preRecebimento.unidadeId,
    ),
    unidade: preRecebimento.unidadeId,
    placa: preRecebimento.placa ?? 'Sem placa',
    transportador: preRecebimento.transportadoraNome ?? '—',
    documentacaoOk: Boolean(preRecebimento.dataChegada),
    status: mapSituacaoToStatus(preRecebimento.situacao),
    inspecao: mapChecklistToInspecao(checklist, divergenciasCount),
    fotos,
    fotoTotalInformado: fotoTotalInformado || checklist?.photoCount || fotos.length,
    conferencia: buildConferencia(preRecebimento, recebimento, produtoMap),
    fotosAvaria: [],
    numDivergencias: recebimento?.divergencias?.length ?? 0,
    recebimentoId: recebimento?.id ?? null,
    preRecebimentoSituacao: preRecebimento.situacao,
    recebimentoSituacao: recebimento?.situacao ?? null,
    modoUnitizacao:
      (recebimento?.modoUnitizacao as RecebimentoDetalhe['modoUnitizacao']) ??
      null,
    temPaletesBipados,
  };
}
