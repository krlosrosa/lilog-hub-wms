import type { ProdutoApi } from '@/features/produto/types/produto.api';
import type {
  ChecklistRecebimentoApi,
  ImpedimentoDetalheApi,
  PreRecebimentoApi,
  PreRecebimentoSituacaoApi,
  RecebimentoApi,
  TemperaturaProdutoItemApi,
} from '@/features/recebimento/types/recebimento.api';
import type {
  ConferenciaItem,
  ConferenciaStatus,
  FotoEvidencia,
  ImpedimentoDetalhe,
  InspecaoTermica,
  LoteDetalheItem,
  RecebimentoDetalhe,
} from '@/features/recebimento/types/recebimento-detalhe.schema';
import type { RecebimentoStatus } from '@/features/recebimento/types/recebimento-lista.schema';
import { resolveTipoImpedimentoLabel } from '@/features/recebimento/lib/impedimento-labels';

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

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));
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
  produtoMap: Map<string, ProdutoApi>,
): {
  qtdFisicaPorProduto: Map<string, number>;
  lotesRecebidosPorProduto: Map<string, string[]>;
  recebidoPorLote: Map<string, Map<string, number>>;
} {
  const qtdFisicaPorProduto = new Map<string, number>();
  const lotesRecebidosPorProduto = new Map<string, string[]>();
  const recebidoPorLote = new Map<string, Map<string, number>>();

  for (const recebido of itensRecebidos) {
    const unidadesPorCaixa =
      produtoMap.get(recebido.produtoId)?.unidadesPorCaixa ?? 1;
    const qtdBaseUN = toBaseUnits(
      recebido.quantidadeRecebida,
      recebido.unidadeMedida,
      unidadesPorCaixa,
    );

    qtdFisicaPorProduto.set(
      recebido.produtoId,
      (qtdFisicaPorProduto.get(recebido.produtoId) ?? 0) + qtdBaseUN,
    );

    const loteKey = toLoteKey(recebido.loteRecebido);
    const porLote =
      recebidoPorLote.get(recebido.produtoId) ?? new Map<string, number>();
    porLote.set(loteKey, (porLote.get(loteKey) ?? 0) + qtdBaseUN);
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
  unidadesPorCaixa: number,
): LoteDetalheItem[] {
  const porLote = new Map<string, number>();

  for (const recebido of recebidos) {
    const loteKey = toLoteKey(recebido.loteRecebido);
    const qtdBaseUN = toBaseUnits(
      recebido.quantidadeRecebida,
      recebido.unidadeMedida,
      unidadesPorCaixa,
    );
    porLote.set(loteKey, (porLote.get(loteKey) ?? 0) + qtdBaseUN);
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

function buildPesoPorProduto(input: {
  produtoId: string;
  itensEsperados: NonNullable<PreRecebimentoApi['itens']>;
  itensRecebidos: NonNullable<RecebimentoApi['itens']>;
  produto: ProdutoApi | undefined;
}): Pick<ConferenciaItem, 'pesoVariavel' | 'pesoXml' | 'pesoFisico'> {
  const { produtoId, itensEsperados, itensRecebidos, produto } = input;
  const pesoVariavel = produto?.tipo === 'PVAR';

  let pesoXml = 0;
  let hasPesoXml = false;

  for (const esperado of itensEsperados) {
    if (esperado.produtoId !== produtoId) {
      continue;
    }

    const pesoLinha =
      esperado.pesoEsperado ??
      (pesoVariavel && produto?.pesoBrutoUnidade
        ? toBaseUnits(
            esperado.quantidadeEsperada,
            esperado.unidadeMedida,
            esperado.unidadesPorCaixa ?? 1,
          ) * Number(produto.pesoBrutoUnidade)
        : null);

    if (pesoLinha !== null) {
      pesoXml += pesoLinha;
      hasPesoXml = true;
    }
  }

  let pesoFisico = 0;
  let hasPesoFisico = false;

  for (const recebido of itensRecebidos) {
    if (recebido.produtoId !== produtoId) {
      continue;
    }

    if (recebido.pesoRecebido !== null && recebido.pesoRecebido !== undefined) {
      pesoFisico += recebido.pesoRecebido;
      hasPesoFisico = true;
    }
  }

  return {
    pesoVariavel,
    pesoXml: hasPesoXml ? pesoXml : null,
    pesoFisico: hasPesoFisico ? pesoFisico : null,
  };
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
    groupRecebidosPorProduto(itensRecebidos, produtoMap);

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
    const peso = buildPesoPorProduto({
      produtoId,
      itensEsperados,
      itensRecebidos,
      produto,
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
      ...peso,
      status: buildConferenciaStatus(qtdXml, qtdFisica, Boolean(recebimento)),
      avarias: [],
      lotesDetalhe,
      unidadesPorCaixa: produto?.unidadesPorCaixa ?? null,
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
      const unidadesPorCaixa = produto?.unidadesPorCaixa ?? 1;
      const qtdFisica = recebidos.reduce(
        (acc, row) =>
          acc +
          toBaseUnits(
            row.quantidadeRecebida,
            row.unidadeMedida,
            unidadesPorCaixa,
          ),
        0,
      );
      const lotes = recebidos
        .map((row) => row.loteRecebido)
        .filter((lote): lote is string => Boolean(lote));
      const lotesDetalhe = buildLotesDetalheFromRecebido(
        recebidos,
        unidadesPorCaixa,
      );
      const peso = buildPesoPorProduto({
        produtoId,
        itensEsperados,
        itensRecebidos,
        produto,
      });

      return {
        id: recebidos[0]!.id,
        produtoId,
        sku: produto?.sku ?? produtoId.toUpperCase(),
        produto: produto?.descricao ?? 'Produto não identificado',
        lote: formatLoteLabel(lotes),
        ean: produto?.ean ?? '—',
        qtdXml: 0,
        qtdFisica,
        ...peso,
        status: buildConferenciaStatus(0, qtdFisica, Boolean(recebimento)),
        avarias: [],
        lotesDetalhe,
        unidadesPorCaixa: produto?.unidadesPorCaixa ?? null,
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

function resolveTemperaturasProduto(
  temperaturasProduto: TemperaturaProdutoItemApi[] | undefined,
  checklistTempProduto: number | null,
) {
  const byEtapa = new Map(
    (temperaturasProduto ?? []).map((item) => [item.etapa, item.temperatura]),
  );

  const inicio = byEtapa.get('inicio') ?? null;
  const meio = byEtapa.get('meio') ?? null;
  const fim = byEtapa.get('fim') ?? null;
  const leituras = [inicio, meio, fim].filter(
    (value): value is number => value != null && !Number.isNaN(value),
  );

  const media =
    leituras.length > 0
      ? leituras.reduce((sum, value) => sum + value, 0) / leituras.length
      : checklistTempProduto;

  return {
    tempProdutoInicio: inicio,
    tempProdutoMeio: meio,
    tempProdutoFim: fim,
    tempProduto: media,
  };
}

export function mapChecklistToInspecao(
  checklist: ChecklistRecebimentoApi | null,
  divergenciasCount: number,
  temperaturasProduto?: TemperaturaProdutoItemApi[],
): InspecaoTermica {
  if (!checklist) {
    return {
      tempBau: null,
      tempProduto: null,
      tempProdutoInicio: null,
      tempProdutoMeio: null,
      tempProdutoFim: null,
      checklistPreenchido: false,
      anomalias: divergenciasCount,
      anomaliasDescricao:
        divergenciasCount > 0
          ? `${divergenciasCount} divergência(s) registrada(s)`
          : 'Checklist ainda não preenchido',
    };
  }

  const temperaturas = resolveTemperaturasProduto(
    temperaturasProduto,
    checklist.tempProduto,
  );

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
    tempProduto: temperaturas.tempProduto,
    tempProdutoInicio: temperaturas.tempProdutoInicio,
    tempProdutoMeio: temperaturas.tempProdutoMeio,
    tempProdutoFim: temperaturas.tempProdutoFim,
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

function mapImpedimentoDetalhe(
  impedimento: ImpedimentoDetalheApi | null | undefined,
  fotos: FotoEvidencia[] = [],
): ImpedimentoDetalhe | null {
  if (!impedimento) {
    return null;
  }

  return {
    id: impedimento.id,
    tipo: impedimento.tipo,
    tipoLabel: resolveTipoImpedimentoLabel(impedimento.tipo),
    descricao: impedimento.descricao,
    photoCount: Math.max(impedimento.photoCount, fotos.length),
    registradoPorNome: impedimento.registradoPorNome,
    registradoPorMatricula: impedimento.registradoPorMatricula,
    registradoEm: formatDateTime(impedimento.registradoEm),
    fotos,
  };
}

export function mapRecebimentoDetalhe(input: {
  preRecebimento: PreRecebimentoApi;
  recebimento: RecebimentoApi | null;
  produtoMap: Map<string, ProdutoApi>;
  checklist?: ChecklistRecebimentoApi | null;
  temperaturasProduto?: TemperaturaProdutoItemApi[];
  fotos?: FotoEvidencia[];
  fotoTotalInformado?: number;
  impedimento?: ImpedimentoDetalheApi | null;
  fotosImpedimento?: FotoEvidencia[];
}): RecebimentoDetalhe {
  const {
    preRecebimento,
    recebimento,
    produtoMap,
    checklist = null,
    temperaturasProduto = [],
    fotos = [],
    fotoTotalInformado = 0,
    impedimento = null,
    fotosImpedimento = [],
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
    motoristaNome: preRecebimento.motoristaNome ?? null,
    motoristaTelefone: preRecebimento.motoristaTelefone ?? null,
    documentacaoOk: Boolean(preRecebimento.dataChegada),
    status: mapSituacaoToStatus(preRecebimento.situacao),
    inspecao: mapChecklistToInspecao(
      checklist,
      divergenciasCount,
      temperaturasProduto,
    ),
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
    conferenteId: recebimento?.responsavelId ?? null,
    conferenteNome: recebimento?.conferenteNome ?? null,
    conferenteMatricula: recebimento?.conferenteMatricula ?? null,
    conferenciaIniciadaEm: recebimento?.dataInicio
      ? formatDateTime(recebimento.dataInicio)
      : null,
    conferenciaFinalizadaEm: recebimento?.dataFim
      ? formatDateTime(recebimento.dataFim)
      : null,
    quantidadePaletesEsperada: preRecebimento.quantidadePaletesEsperada ?? null,
    numeroTermoPalete: preRecebimento.numeroTermoPalete ?? null,
    quantidadePaletes: recebimento?.quantidadePaletes ?? null,
    impedimento: mapImpedimentoDetalhe(impedimento, fotosImpedimento),
  };
}
