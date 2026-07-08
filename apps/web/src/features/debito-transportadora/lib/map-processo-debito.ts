import type {
  BuscarProcessoDebitoResponse,
  CobrancaEventoApi,
  DocumentoCobrancaListItemApi,
  ProcessoDebitoItemApi,
  ProcessoDebitoListItemApi,
  ProcessoDebitoNotaFiscalApi,
  ProcessoDebitoRegistroCorteApi,
  ProcessoDebitoStatus,
} from '@/features/debito-transportadora/lib/cobranca-transportadora-api';
import type {
  DebitoConferenciaItem,
  DebitoDetalhe,
  DebitoEvidencia,
  DebitoItemStatus,
  DebitoKpi,
  DebitoNotaFiscal,
  DebitoOcorrencia,
  DebitoRegistroCorte,
  DebitoRegistroCorteStatus,
  DebitoTimelineEvento,
  DebitoTipo,
  DebitoStatus,
} from '@/features/debito-transportadora/types/debito.schema';
import { DEBITO_STATUS_LABELS } from '@/features/debito-transportadora/types/debito.schema';

const STATUS_EM_ANDAMENTO: ProcessoDebitoStatus[] = [
  'aberto',
  'em_analise',
  'aprovado',
];

const META_RECUPERACAO = 85;

const CORTE_STATUS_MAP: Record<string, DebitoRegistroCorteStatus> = {
  concluido: 'concluido',
  em_andamento: 'em_andamento',
  cancelado: 'cancelado',
  solicitado: 'solicitado',
};

function calcularAgingDias(createdAt: string): number {
  const criado = new Date(createdAt);
  const agora = new Date();
  const diffMs = agora.getTime() - criado.getTime();

  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function formatarProtocolo(codigoDemanda: string): string {
  return codigoDemanda.startsWith('#') ? codigoDemanda : `#${codigoDemanda}`;
}

function formatarData(dataIso: string): string {
  return new Date(dataIso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatarLocalizacao(
  regiao: string | null | undefined,
  cidade: string | null | undefined,
  bairro: string | null | undefined,
): string {
  const partes = [regiao, cidade, bairro].filter(Boolean);

  return partes.length > 0 ? partes.join(' · ') : '—';
}

function resolverTipoFrota(
  perfilEsperado: string | null | undefined,
  perfilPagamentoNome: string | null | undefined,
): string {
  return perfilPagamentoNome ?? perfilEsperado ?? '—';
}

export function resolverTipoProcesso(processo: {
  quantidadeItensFalta: number;
  quantidadeItensAvaria: number;
  quantidadeItensSobra?: number;
}): DebitoTipo {
  const temFalta = processo.quantidadeItensFalta > 0;
  const temAvaria = processo.quantidadeItensAvaria > 0;
  const temSobra = (processo.quantidadeItensSobra ?? 0) > 0;

  const tiposAtivos = [temFalta, temAvaria, temSobra].filter(Boolean).length;

  if (tiposAtivos > 1) {
    return 'misto';
  }

  if (temFalta) {
    return 'falta';
  }

  if (temSobra) {
    return 'avaria';
  }

  return 'avaria';
}

function normalizarStatusItem(
  status: string,
  tipo: ProcessoDebitoItemApi['tipo'],
): DebitoItemStatus {
  if (tipo === 'sobra') {
    return 'sobra';
  }

  if (status === 'cobrar' || status === 'nao_cobrar' || status === 'sobra') {
    return status;
  }

  if (status === 'rejeitado') {
    return 'nao_cobrar';
  }

  return 'cobrar';
}

function resolverNfNumero(
  notaFiscalId: string | null,
  notasFiscais: ProcessoDebitoNotaFiscalApi[],
): string {
  if (!notaFiscalId) {
    return '—';
  }

  const nf = notasFiscais.find((nota) => nota.id === notaFiscalId);

  return nf?.numeroNf ?? '—';
}

function tituloEventoStatus(status: string): string {
  const labels: Record<string, string> = {
    aberto: 'Processo aberto',
    em_analise: 'Em análise',
    aprovado: 'Aprovado',
    incluido_em_documento: 'Incluído em documento',
    cancelado: 'Cancelado',
    rascunho: 'Documento em rascunho',
    emitido: 'Documento emitido',
    enviado: 'Documento enviado',
    pago: 'Documento pago',
    item_quantidade_alterada: 'Quantidade alterada',
    item_status_alterado: 'Status de cobrança alterado',
    item_observacao_alterada: 'Observação alterada',
    item_valorizado: 'Item valorizado',
    item_valor_alterado: 'Valor do débito alterado',
    item_atualizado: 'Item atualizado',
    item_removido: 'Item removido',
    itens_status_alterado_em_massa: 'Status alterado em massa',
    itens_valorizados_em_massa: 'Valorização em massa',
    itens_atualizados_em_massa: 'Itens atualizados em massa',
  };

  return labels[status] ?? status;
}

const EVENTOS_ITEM_INDIVIDUAIS = new Set([
  'item_quantidade_alterada',
  'item_status_alterado',
  'item_observacao_alterada',
  'item_valorizado',
  'item_valor_alterado',
  'item_atualizado',
]);

const JANELA_AGRUPAMENTO_LOTE_MS = 60_000;

function mapearEventoIndividualParaLote(statusNovo: string): string {
  if (statusNovo === 'item_status_alterado') {
    return 'itens_status_alterado_em_massa';
  }

  if (statusNovo === 'item_valorizado' || statusNovo === 'item_valor_alterado') {
    return 'itens_valorizados_em_massa';
  }

  return 'itens_atualizados_em_massa';
}

function agruparEventosItemEmLote(
  eventos: CobrancaEventoApi[],
): CobrancaEventoApi[] {
  if (eventos.length < 2) {
    return eventos;
  }

  const usados = new Set<string>();
  const resultado: CobrancaEventoApi[] = [];

  for (const evento of eventos) {
    if (usados.has(evento.id)) {
      continue;
    }

    if (!EVENTOS_ITEM_INDIVIDUAIS.has(evento.statusNovo)) {
      resultado.push(evento);
      continue;
    }

    const grupo = eventos.filter((outro) => {
      if (usados.has(outro.id)) {
        return false;
      }

      if (outro.statusNovo !== evento.statusNovo) {
        return false;
      }

      if (outro.criadoPorUserId !== evento.criadoPorUserId) {
        return false;
      }

      const diffMs = Math.abs(
        new Date(outro.createdAt).getTime() -
          new Date(evento.createdAt).getTime(),
      );

      return diffMs <= JANELA_AGRUPAMENTO_LOTE_MS;
    });

    if (grupo.length >= 2) {
      for (const item of grupo) {
        usados.add(item.id);
      }

      const maisRecente = grupo.reduce((atual, candidato) =>
        new Date(candidato.createdAt).getTime() >
        new Date(atual.createdAt).getTime()
          ? candidato
          : atual,
      );

      resultado.push({
        ...maisRecente,
        id: `lote-${maisRecente.id}`,
        statusNovo: mapearEventoIndividualParaLote(evento.statusNovo),
        descricao: `${grupo.length} item(ns) alterado(s) em lote`,
      });
      continue;
    }

    usados.add(evento.id);
    resultado.push(evento);
  }

  return resultado.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function buildTimelineFromEventos(
  eventos: CobrancaEventoApi[],
  statusAtual: ProcessoDebitoStatus,
): DebitoTimelineEvento[] {
  const eventosAgrupados = agruparEventosItemEmLote(eventos);
  const ordenados = [...eventosAgrupados].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const emAndamento = STATUS_EM_ANDAMENTO.includes(statusAtual);

  return ordenados.map((evento, index) => {
    let tipo: DebitoTimelineEvento['tipo'] = 'concluido';

    if (index === 0 && emAndamento) {
      tipo = 'ativo';
    } else if (index > 0 && emAndamento) {
      tipo = 'concluido';
    } else if (!emAndamento && index === 0) {
      tipo = 'concluido';
    }

    const subtituloParts = [formatarData(evento.createdAt)];

    if (evento.criadoPorNome) {
      subtituloParts.push(evento.criadoPorNome);
    }

    return {
      id: evento.id,
      titulo: evento.descricao?.startsWith('Interação da transportadora')
        ? 'Interação enviada pela transportadora'
        : evento.descricao?.startsWith('Solicitação de prova')
          ? 'Solicitação de prova enviada pelo CD'
          : evento.descricao?.startsWith('Parecer do CD')
            ? 'Parecer enviado pelo CD'
            : evento.descricao?.startsWith('Observação do CD')
              ? 'Observação enviada pelo CD'
              : tituloEventoStatus(evento.statusNovo),
      subtitulo: subtituloParts.join(' · '),
      descricao: evento.descricao ?? undefined,
      tipo,
    };
  });
}

function mapItemParaConferencia(
  item: ProcessoDebitoItemApi,
  notasFiscais: ProcessoDebitoNotaFiscalApi[],
): DebitoConferenciaItem {
  const quantidade = item.quantidade ?? item.qtdAnomalia;

  return {
    id: item.id,
    nfId: item.notaFiscalId ?? '',
    nfNumero: resolverNfNumero(item.notaFiscalId, notasFiscais),
    sku: item.sku ?? '—',
    produto: item.descricaoProduto ?? item.motivo ?? 'Item sem descrição',
    lote: item.lote,
    quantidade,
    qtdAnomalia: item.qtdAnomalia,
    pesoTotalKg: item.pesoTotalKg,
    valorUnitario: item.valorUnitario,
    valorDebito: item.valorDebito,
    anomalia: item.tipo,
    status: normalizarStatusItem(item.status, item.tipo),
    observacao: item.observacao,
  };
}

function mapNotasFiscais(
  notasFiscais: BuscarProcessoDebitoResponse['notasFiscais'],
): DebitoNotaFiscal[] {
  return notasFiscais.map((nf) => ({
    id: nf.id,
    numero: nf.numeroNf,
    operacao: nf.tipo,
    pedido: nf.cliente ?? undefined,
  }));
}

function mapEvidencias(
  evidencias: BuscarProcessoDebitoResponse['evidencias'],
): DebitoEvidencia[] {
  return evidencias.flatMap((evidencia) => {
    const nomeBase =
      evidencia.natureza ?? evidencia.tipo ?? 'Evidência de avaria';
    const dataUpload = formatarData(evidencia.createdAt);

    if (evidencia.photoUrls.length === 0) {
      return [];
    }

    return evidencia.photoUrls.map((url, index) => ({
      id: `${evidencia.id}-${index}`,
      tipo: 'imagem' as const,
      nome:
        evidencia.photoUrls.length > 1
          ? `${nomeBase} (${index + 1})`
          : nomeBase,
      url,
      dataUpload,
    }));
  });
}

function mapRegistroCorte(corte: ProcessoDebitoRegistroCorteApi): DebitoRegistroCorte {
  return {
    id: corte.id,
    codigo: corte.codigo,
    dataHora: formatarData(corte.solicitadoEm),
    rota: corte.rota,
    doca: corte.doca ?? '—',
    totalVolumes: corte.totalVolumes ?? 0,
    pesoKg: corte.pesoTotalKg ?? 0,
    separador: corte.separadorNome ?? '—',
    status: CORTE_STATUS_MAP[corte.status] ?? 'solicitado',
  };
}

export function mapProcessoParaOcorrencia(
  processo: ProcessoDebitoListItemApi,
): DebitoOcorrencia {
  return {
    id: processo.id,
    protocolo: formatarProtocolo(processo.codigoDemanda),
    transportadora: processo.transportadoraNome ?? 'Transportadora não informada',
    transportadoraId: processo.transportadoraId,
    nfOrigem: processo.transporteId ?? '—',
    tipo: resolverTipoProcesso(processo),
    valor: processo.valorTotal,
    status: processo.status,
    agingDias: calcularAgingDias(processo.createdAt),
  };
}

export function mapProcessoParaDetalhe(
  processo: BuscarProcessoDebitoResponse,
): DebitoDetalhe {
  const quantidadeItensFalta = processo.itens.filter(
    (item) => item.tipo === 'falta',
  ).length;
  const quantidadeItensAvaria = processo.itens.filter(
    (item) => item.tipo === 'avaria',
  ).length;
  const quantidadeItensSobra = processo.itens.filter(
    (item) => item.tipo === 'sobra',
  ).length;

  const ocorrenciaBase = mapProcessoParaOcorrencia({
    ...processo,
    quantidadeItensFalta,
    quantidadeItensAvaria,
  });

  const ocorrenciaComTipo = {
    ...ocorrenciaBase,
    tipo: resolverTipoProcesso({
      quantidadeItensFalta,
      quantidadeItensAvaria,
      quantidadeItensSobra,
    }),
  };

  const itensConferidos = processo.itens.map((item) =>
    mapItemParaConferencia(item, processo.notasFiscais),
  );
  const pesoAfetadoKg = itensConferidos.reduce(
    (acc, item) => acc + (item.pesoTotalKg ?? 0),
    0,
  );

  const transporte = processo.transporte;
  const placaVeiculo =
    transporte?.placa ?? processo.demanda.placa ?? '—';
  const motorista = transporte?.motorista ?? '—';
  const tipoFrota = resolverTipoFrota(
    transporte?.perfilEsperado,
    transporte?.perfilPagamentoNome,
  );
  const origem =
    transporte?.itinerario ??
    formatarLocalizacao(
      transporte?.regiao,
      transporte?.cidade,
      transporte?.bairro,
    );
  const destino =
    processo.notasFiscais
      .map((nf) => nf.cliente)
      .filter(Boolean)
      .join(' · ') || '—';

  const notasFiscais = mapNotasFiscais(processo.notasFiscais);
  const nfOrigem =
    notasFiscais[0]?.numero ?? processo.transporteId ?? '—';

  return {
    ...ocorrenciaComTipo,
    demandaId: processo.demandaId,
    nfOrigem,
    dataIncidente: formatarData(processo.createdAt),
    pedido: processo.transporteId ?? '—',
    pesoAfetadoKg,
    valorReclamado: processo.valorTotal,
    origem,
    destino,
    motorista,
    placaVeiculo,
    tipoFrota,
    evidencias: mapEvidencias(processo.evidencias),
    timeline: buildTimelineFromEventos(processo.eventos, processo.status),
    notasFiscais,
    itensConferidos,
    totalAnomalias: itensConferidos.length,
    registrosCorte: processo.registrosCorte.map(mapRegistroCorte),
    mapaSeparacao: processo.mapaSeparacao
      ? {
          codigo: processo.mapaSeparacao.codigo,
          geradoEm: processo.mapaSeparacao.geradoEm
            ? formatarData(processo.mapaSeparacao.geradoEm)
            : '—',
          totalItens: processo.mapaSeparacao.totalItens,
          totalVolumes: processo.mapaSeparacao.totalVolumes,
        }
      : null,
    notasAnalista: processo.observacao ?? '',
    criadaHaDias: calcularAgingDias(processo.createdAt),
    interacoes: (processo.interacoes ?? []).map((interacao) => ({
      id: interacao.id,
      autor: interacao.autor,
      tipo: interacao.tipo,
      descricao: interacao.descricao,
      anexoChaves: interacao.anexoChaves,
      anexoUrls: interacao.anexoUrls,
      transportadoraId: interacao.transportadoraId,
      criadoPorUserId: interacao.criadoPorUserId,
      createdAt: interacao.createdAt,
    })),
  };
}

export function computeDebitoKpi(
  processos: ProcessoDebitoListItemApi[],
  documentos: DocumentoCobrancaListItemApi[],
): DebitoKpi {
  const processosAbertos = processos.filter((processo) =>
    STATUS_EM_ANDAMENTO.includes(processo.status),
  );

  const prejuizoTotalAberto = processosAbertos.reduce(
    (acc, processo) => acc + processo.valorTotal,
    0,
  );

  const cobrancasEmDisputa = processos
    .filter((processo) => processo.status === 'em_analise')
    .reduce((acc, processo) => acc + processo.valorTotal, 0);

  const valorTotalProcessos = processos.reduce(
    (acc, processo) => acc + processo.valorTotal,
    0,
  );

  const valorRecuperado = documentos
    .filter((documento) => documento.status === 'pago')
    .reduce((acc, documento) => acc + documento.valorTotal, 0);

  const taxaRecuperacao =
    valorTotalProcessos > 0
      ? Math.min(100, (valorRecuperado / valorTotalProcessos) * 100)
      : 0;

  const porTransportadora = new Map<string, number>();

  for (const processo of processos) {
    const nome = processo.transportadoraNome ?? 'Não informada';
    porTransportadora.set(nome, (porTransportadora.get(nome) ?? 0) + processo.valorTotal);
  }

  const topOfensores = [...porTransportadora.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([nome, valor]) => ({
      nome,
      valor,
      percentualBarra:
        prejuizoTotalAberto > 0
          ? Math.min(100, (valor / prejuizoTotalAberto) * 100)
          : 0,
    }));

  return {
    prejuizoTotalAberto,
    prejuizoVariacaoPercentual: 0,
    cobrancasEmDisputa,
    casosAtivosDisputa: processosAbertos.length,
    taxaRecuperacao: Number(taxaRecuperacao.toFixed(1)),
    metaRecuperacao: META_RECUPERACAO,
    topOfensores,
  };
}

export function isStatusEmInvestigacao(status: DebitoStatus): boolean {
  return status === 'aberto' || status === 'em_analise';
}

export function labelStatusInvestigacao(status: DebitoStatus): string {
  if (isStatusEmInvestigacao(status)) {
    return 'Em Investigação';
  }

  return DEBITO_STATUS_LABELS[status];
}
