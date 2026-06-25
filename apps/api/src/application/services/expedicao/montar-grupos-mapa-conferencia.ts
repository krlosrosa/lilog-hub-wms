import type {
  GerarMapasConfigInput,
  MapaEtapaPayload,
  OpcoesConferenciaInput,
} from '../../dtos/expedicao/gerar-mapas.dto.js';
import { calcularBreakdownConferencia } from './calcular-breakdown-conferencia.js';
import { montarCabecalhoGrupo } from './montar-cabecalho-grupo-mapa.js';
import type { TransporteMetaMapa } from './montar-cabecalho-grupo-mapa.js';
import {
  consolidarItensPorSkuLote,
  mapearLinhaParaItemSegregavel,
  resolverBlocosBase,
  type BlocoMapaInterno,
  type TransporteParaMapa,
} from './montar-grupos-mapa.js';
import { ordenarItensConferencia } from './ordenar-itens-conferencia.js';
import type { ItemMapaSegregavel } from './segregar-itens-mapa.js';

function configApenasTransporte(
  configSeparacao: GerarMapasConfigInput,
): GerarMapasConfigInput {
  return {
    ...configSeparacao,
    tipoDadosBasicos: 'transporte',
    agrupamento: {
      tiposAtivos: [],
      clientesSegregados: [],
      grupos: [],
    },
  };
}

function labelAgrupamentoConferencia(opcoes: OpcoesConferenciaInput): string {
  return opcoes.agrupamento === 'replicar_separacao'
    ? 'Replicar separação'
    : 'Apenas transporte';
}

type GrupoMapa = MapaEtapaPayload['grupos'][number];
type ItemConferenciaProjetado = GrupoMapa['itens'][number];

const SUFIXOS_EXCLUIDOS_CONFERENCIA = [
  'Paletes Completos',
  'Unidades',
  ' — Parte ',
] as const;

function tituloTemSplitSeparacao(titulo: string): boolean {
  return SUFIXOS_EXCLUIDOS_CONFERENCIA.some((sufixo) => titulo.includes(sufixo));
}

function linhasParaItensSegregaveis(
  bloco: BlocoMapaInterno,
): ItemMapaSegregavel[] {
  return bloco.linhas.map((linha) => mapearLinhaParaItemSegregavel(linha));
}

function projetarItensConferencia(
  itens: ItemMapaSegregavel[],
): ItemConferenciaProjetado[] {
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
  bloco: BlocoMapaInterno,
  parteItens: ItemMapaSegregavel[],
  opcoes: OpcoesConferenciaInput,
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
    tempoEsperado: 0,
    cabecalho,
    itens,
  };
}

function projetarBlocoConferencia(
  bloco: BlocoMapaInterno,
  opcoes: OpcoesConferenciaInput,
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
  bloco: BlocoMapaInterno,
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
  bloco: BlocoMapaInterno,
  separacao: MapaEtapaPayload,
  microUuidsSeparacaoUsados: Set<string>,
): GrupoMapa {
  const grupoSeparacao = encontrarGrupoSeparacaoBase(bloco, separacao);
  if (!grupoSeparacao) {
    return grupoConferencia;
  }

  const microUuidSeparacao = grupoSeparacao.cabecalho.microUuid;
  if (microUuidsSeparacaoUsados.has(microUuidSeparacao)) {
    return grupoConferencia;
  }

  microUuidsSeparacaoUsados.add(microUuidSeparacao);

  return {
    ...grupoConferencia,
    id: grupoSeparacao.id,
    titulo: bloco.titulo,
    subtitulo: grupoSeparacao.subtitulo ?? bloco.subtitulo,
    infoAdicionaisI: grupoSeparacao.infoAdicionaisI,
    infoAdicionaisII: grupoSeparacao.infoAdicionaisII,
    tempoEsperado: grupoSeparacao.tempoEsperado,
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
  transportes: TransporteParaMapa[],
  configSeparacao: GerarMapasConfigInput,
  opcoes: OpcoesConferenciaInput,
  blocosSeparacao?: BlocoMapaInterno[],
  separacao?: MapaEtapaPayload,
): MapaEtapaPayload {
  const transportesPorId = new Map<string, TransporteMetaMapa>(
    transportes.map((t) => [
      t.id,
      {
        id: t.id,
        rota: t.rota,
        placa: t.placa,
        transportadora: t.transportadora,
      },
    ]),
  );

  const blocos =
    opcoes.agrupamento === 'replicar_separacao'
      ? (blocosSeparacao ?? resolverBlocosBase(transportes, configSeparacao))
      : resolverBlocosBase(
          transportes,
          configApenasTransporte(configSeparacao),
        );

  const microUuidsSeparacaoUsados = new Set<string>();

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
        aplicarCabecalhoSeparacaoPorBloco(
          grupo,
          bloco,
          separacao,
          microUuidsSeparacaoUsados,
        ),
      );
    });

  return {
    agrupamento: labelAgrupamentoConferencia(opcoes),
    tipoDadosBasicos:
      opcoes.agrupamento === 'replicar_separacao'
        ? configSeparacao.tipoDadosBasicos
        : 'transporte',
    totalGrupos: grupos.length,
    grupos,
  };
}
