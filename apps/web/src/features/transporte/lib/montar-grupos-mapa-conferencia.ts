import { calcularBreakdownConferencia } from '@/features/transporte/lib/calcular-breakdown-conferencia';
import { consolidarItensPorSkuLote } from '@/features/transporte/lib/consolidar-itens-mapa';
import type { MapaEtapaPayload } from '@/features/transporte/lib/gerar-mapas-api';
import { montarBlocosMapa } from '@/features/transporte/lib/montar-blocos-mapa';
import {
  montarCabecalhoGrupo,
  type TransporteMetaMapa,
} from '@/features/transporte/lib/montar-cabecalho-grupo-mapa';
import { ordenarItensConferencia } from '@/features/transporte/lib/ordenar-itens-conferencia';
import type { ItemMapaSegregavel } from '@/features/transporte/lib/segregar-itens-mapa';
import type {
  BlocoMapaImpressao,
  ConfigMapaImpressao,
  OpcoesConferenciaMapa,
  TransporteGrupo,
} from '@/features/transporte/types/transporte.schema';

function configApenasTransporte(config: ConfigMapaImpressao): ConfigMapaImpressao {
  return {
    ...config,
    tipoDadosBasicos: 'transporte',
    agrupamento: {
      tiposAtivos: [],
      clientesSegregados: [],
      grupos: [],
    },
  };
}

function labelAgrupamentoConferencia(opcoes: OpcoesConferenciaMapa): string {
  return opcoes.agrupamento === 'replicar_separacao'
    ? 'Replicar separação'
    : 'Apenas transporte';
}

function transporteGrupoParaMeta(transporte: TransporteGrupo): TransporteMetaMapa {
  return {
    id: transporte.id,
    rota: transporte.rota,
    placa: transporte.veiculoAlocado?.placa ?? null,
    transportadora:
      transporte.veiculoAlocado?.transportadora ??
      transporte.transportadoraAtribuida ??
      null,
  };
}

function coletarTransportesMeta(
  transportes: TransporteGrupo[],
): Map<string, TransporteMetaMapa> {
  return new Map(transportes.map((t) => [t.id, transporteGrupoParaMeta(t)]));
}

type GrupoMapa = MapaEtapaPayload['grupos'][number];

const SUFIXOS_EXCLUIDOS_CONFERENCIA = [
  'Paletes Completos',
  'Unidades',
  ' — Parte ',
] as const;

function tituloTemSplitSeparacao(titulo: string): boolean {
  return SUFIXOS_EXCLUIDOS_CONFERENCIA.some((sufixo) => titulo.includes(sufixo));
}

function linhasParaItensSegregaveis(bloco: BlocoMapaImpressao): ItemMapaSegregavel[] {
  return bloco.linhas.map((linha) => ({
    sku: linha.item.sku,
    descricao: linha.item.descricao,
    remessa: linha.item.numeroRemessa,
    cliente: linha.item.cliente,
    codCliente: linha.item.codCliente,
    empresa: linha.item.empresa,
    categoria: linha.item.categoria,
    lote: linha.item.lote,
    dataFabricacao: linha.item.dataFabricacao ?? null,
    faixa: linha.item.faixa ?? null,
    quantidade: linha.item.quantidade,
    unidadeMedida: linha.item.unidadeMedida,
    quantidadeNormalizadaUnidades: linha.item.quantidadeNormalizadaUnidades,
    unidadesPorCaixa: linha.item.unidadesPorCaixa,
    caixasPorPalete: linha.item.caixasPorPalete,
    pesoBrutoUnidade: linha.item.pesoBrutoUnidade,
    pesoBrutoCaixa: linha.item.pesoBrutoCaixa,
    pesoBrutoPalete: linha.item.pesoBrutoPalete,
    pesoLiquidoUnidade: linha.item.pesoLiquidoUnidade,
    pesoLiquidoCaixa: linha.item.pesoLiquidoCaixa,
    pesoLiquidoPalete: linha.item.pesoLiquidoPalete,
    peso: linha.item.peso,
    endereco: linha.item.endereco,
    enderecoId: linha.item.enderecoId,
    zona: linha.item.zona,
    rua: linha.item.rua,
    posicao: linha.item.posicao,
    nivel: linha.item.nivel,
    prioridadePicking: linha.item.prioridadePicking,
    slottingOrdem: linha.item.slottingOrdem,
    slottingPapel: linha.item.slottingPapel,
  }));
}

function projetarItensConferencia(itens: ItemMapaSegregavel[]) {
  return itens.map((item) => ({
    sku: item.sku,
    descricao: item.descricao,
    remessa: item.remessa,
    cliente: item.cliente,
    codCliente: item.codCliente,
    empresa: item.empresa,
    categoria: item.categoria,
    lote: item.lote,
    dataFabricacao: item.dataFabricacao,
    faixa: item.faixa,
    quantidade: item.quantidade,
    unidadeMedida: item.unidadeMedida,
    quantidadeNormalizadaUnidades: item.quantidadeNormalizadaUnidades,
    peso: item.peso,
    endereco: item.endereco ?? null,
    breakdown: calcularBreakdownConferencia(
      item.quantidadeNormalizadaUnidades,
      item.unidadesPorCaixa,
      item.pesoBrutoUnidade,
      item.pesoBrutoCaixa,
      item.pesoLiquidoUnidade,
      item.pesoLiquidoCaixa,
    ),
  }));
}

function montarGrupoConferencia(
  bloco: BlocoMapaImpressao,
  parteItens: ItemMapaSegregavel[],
  opcoes: OpcoesConferenciaMapa,
  transportesPorId: Map<string, TransporteMetaMapa>,
): GrupoMapa | null {
  const itensOrdenados = ordenarItensConferencia(parteItens, opcoes);
  const itens = projetarItensConferencia(itensOrdenados);

  if (itens.length === 0) {
    return null;
  }

  const titulo = bloco.titulo;
  const cabecalho = montarCabecalhoGrupo(
    {
      titulo: bloco.titulo,
      empresa: bloco.empresa,
      categoria: bloco.categoria,
      linhas: bloco.linhas.map((linha) => ({
        transporteId: linha.transporteId,
        transporteRota: linha.transporteRota,
        codCliente: linha.item.codCliente,
        cliente: linha.item.cliente,
      })),
    },
    itens,
    titulo,
    transportesPorId,
    itensOrdenados.map((item) => ({ caixasPorPalete: item.caixasPorPalete })),
  );

  return {
    id: cabecalho.microUuid,
    titulo,
    subtitulo: bloco.subtitulo,
    totalItens: itens.length,
    pesoTotal: itens.reduce((total, item) => total + (item.peso ?? 0), 0),
    cabecalho,
    itens,
  };
}

function projetarBlocoConferencia(
  bloco: BlocoMapaImpressao,
  opcoes: OpcoesConferenciaMapa,
  transportesPorId: Map<string, TransporteMetaMapa>,
): GrupoMapa[] {
  const itensConsolidados = consolidarItensPorSkuLote(
    linhasParaItensSegregaveis(bloco),
  );
  const grupo = montarGrupoConferencia(
    bloco,
    itensConsolidados,
    opcoes,
    transportesPorId,
  );

  return grupo ? [grupo] : [];
}

function encontrarGrupoSeparacaoBase(
  bloco: BlocoMapaImpressao,
  separacao: MapaEtapaPayload,
): GrupoMapa | undefined {
  const porTituloExato = separacao.grupos.find(
    (grupo) => grupo.titulo === bloco.titulo,
  );
  if (porTituloExato) {
    return porTituloExato;
  }

  return separacao.grupos.find(
    (grupo) =>
      grupo.titulo.startsWith(bloco.titulo) &&
      !tituloTemSplitSeparacao(grupo.titulo),
  );
}

function aplicarCabecalhoSeparacaoPorBloco(
  grupoConferencia: GrupoMapa,
  bloco: BlocoMapaImpressao,
  separacao: MapaEtapaPayload,
): GrupoMapa {
  const grupoSeparacao = encontrarGrupoSeparacaoBase(bloco, separacao);
  if (!grupoSeparacao) {
    return grupoConferencia;
  }

  return {
    ...grupoConferencia,
    id: grupoSeparacao.id,
    titulo: bloco.titulo,
    subtitulo: grupoSeparacao.subtitulo ?? bloco.subtitulo,
    cabecalho: {
      ...grupoSeparacao.cabecalho,
      pesoTotal: grupoConferencia.cabecalho.pesoTotal,
      totalCaixas: grupoConferencia.cabecalho.totalCaixas,
      totalUnidades: grupoConferencia.cabecalho.totalUnidades,
      totalPaletes: 0,
      quantidadeLinhas: grupoConferencia.itens.length,
      nomeGrupo: bloco.titulo,
    },
  };
}

export function montarGruposMapaConferencia(
  transportes: TransporteGrupo[],
  config: ConfigMapaImpressao,
  blocosSeparacao?: BlocoMapaImpressao[],
  separacao?: MapaEtapaPayload,
): MapaEtapaPayload {
  const opcoes = config.opcoesConferencia;
  const transportesPorId = coletarTransportesMeta(transportes);

  const blocos =
    opcoes.agrupamento === 'replicar_separacao'
      ? (blocosSeparacao ?? montarBlocosMapa(transportes, config))
      : montarBlocosMapa(transportes, configApenasTransporte(config));

  const grupos = blocos
    .filter((bloco) => bloco.linhas.length > 0)
    .flatMap((bloco) => {
      const gruposBloco = projetarBlocoConferencia(
        bloco,
        opcoes,
        transportesPorId,
      );

      if (
        opcoes.agrupamento !== 'replicar_separacao' ||
        !separacao ||
        gruposBloco.length === 0
      ) {
        return gruposBloco;
      }

      return gruposBloco.map((grupo) =>
        aplicarCabecalhoSeparacaoPorBloco(grupo, bloco, separacao),
      );
    });

  return {
    agrupamento: labelAgrupamentoConferencia(opcoes),
    tipoDadosBasicos:
      opcoes.agrupamento === 'replicar_separacao'
        ? config.tipoDadosBasicos
        : 'transporte',
    totalGrupos: grupos.length,
    grupos,
  };
}
