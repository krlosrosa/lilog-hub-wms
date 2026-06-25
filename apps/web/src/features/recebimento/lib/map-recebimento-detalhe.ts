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
  ProcessoInternoRecebimento,
  RecebimentoDetalhe,
} from '@/features/recebimento/types/recebimento-detalhe.schema';
import type { RecebimentoStatus } from '@/features/recebimento/types/recebimento-lista.schema';

function mapSituacaoToStatus(
  situacao: PreRecebimentoSituacaoApi,
  recebimento?: RecebimentoApi | null,
): RecebimentoStatus {
  if (recebimento?.situacao === 'finalizado' || situacao === 'finalizado') {
    return 'concluido';
  }

  if (
    recebimento?.situacao === 'em_recebimento' ||
    recebimento?.situacao === 'aguardando_aprovacao' ||
    recebimento?.situacao === 'aprovado' ||
    situacao === 'em_recebimento' ||
    situacao === 'aguardando_aprovacao'
  ) {
    return 'descarregando';
  }

  if (situacao === 'veiculo_chegou') {
    return 'em-transito';
  }

  return 'agendado';
}

function mapProcessoAtual(
  situacao: PreRecebimentoSituacaoApi,
  recebimento?: RecebimentoApi | null,
): ProcessoInternoRecebimento {
  if (
    recebimento?.situacao === 'finalizado' ||
    situacao === 'finalizado' ||
    situacao === 'aprovado'
  ) {
    return 'finalizado';
  }

  if (
    recebimento ||
    situacao === 'em_recebimento' ||
    situacao === 'aguardando_aprovacao'
  ) {
    return 'conferindo';
  }

  return 'nao-iniciado';
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

function buildConferencia(
  preRecebimento: PreRecebimentoApi,
  recebimento: RecebimentoApi | null,
  produtoMap: Map<string, ProdutoApi>,
): ConferenciaItem[] {
  const itensEsperados = preRecebimento.itens ?? [];
  const itensRecebidos = recebimento?.itens ?? [];
  const recebidoPorProduto = new Map(
    itensRecebidos.map((item) => [item.produtoId, item]),
  );

  return itensEsperados.map((esperado) => {
    const produto = produtoMap.get(esperado.produtoId);
    const recebido = recebidoPorProduto.get(esperado.produtoId);
    const qtdXml = toBaseUnits(
      esperado.quantidadeEsperada,
      esperado.unidadeMedida,
      esperado.unidadesPorCaixa ?? 1,
    );
    const qtdFisica = recebido?.quantidadeRecebida ?? 0;

    return {
      id: esperado.id,
      produtoId: esperado.produtoId,
      sku: produto?.sku ?? esperado.produtoId.slice(0, 8).toUpperCase(),
      produto: produto?.descricao ?? 'Produto não identificado',
      lote: esperado.loteEsperado ?? recebido?.loteRecebido ?? '—',
      ean: produto?.ean ?? '—',
      qtdXml,
      qtdFisica,
      status: buildConferenciaStatus(qtdXml, qtdFisica, Boolean(recebimento)),
      avarias: [],
    };
  });
}

const CONDITION_LABELS: Record<keyof ChecklistRecebimentoApi['conditions'], string> =
  {
    limpeza: 'Limpeza interna',
    odor: 'Ausência de odor',
    estrutura: 'Integridade estrutural',
    vedacao: 'Vedação das portas',
  };

function mapChecklistToInspecao(
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

  return {
    id: preRecebimento.id,
    numero: `PR-${preRecebimento.id.slice(0, 8).toUpperCase()}`,
    dataInicio: formatDataInicio(
      dataReferencia,
      preRecebimento.unidadeId,
    ),
    unidade: preRecebimento.unidadeId,
    placa: preRecebimento.placa,
    transportador: preRecebimento.transportadoraId,
    documentacaoOk: Boolean(preRecebimento.dataChegada),
    status: mapSituacaoToStatus(preRecebimento.situacao, recebimento),
    processoAtual: mapProcessoAtual(preRecebimento.situacao, recebimento),
    inspecao: mapChecklistToInspecao(checklist, divergenciasCount),
    fotos,
    fotoTotalInformado: fotoTotalInformado || checklist?.photoCount || fotos.length,
    conferencia: buildConferencia(preRecebimento, recebimento, produtoMap),
    fotosAvaria: [],
    numDivergencias: recebimento?.divergencias?.length ?? 0,
    recebimentoId: recebimento?.id ?? null,
    preRecebimentoSituacao: preRecebimento.situacao,
    recebimentoSituacao: recebimento?.situacao ?? null,
  };
}
