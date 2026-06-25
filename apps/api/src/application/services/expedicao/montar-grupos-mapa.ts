import type { GerarMapasConfigInput, MapaEtapaPayload } from '../../dtos/expedicao/gerar-mapas.dto.js';
import type { ParametrosSeparacao } from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import type { ClienteEspecialRecord } from '../../../domain/repositories/expedicao/cliente-especial.repository.js';
import { clienteEstaNaListaSegregacao } from './aplicar-clientes-especiais-mapa.js';
import { aplicarQuebraPaleteItens } from './aplicar-quebra-palete-grupos.js';
import { calcularBreakdownQuantidade } from './calcular-breakdown-quantidade.js';
import { calcularTempoEsperadoSeparacaoSeg } from './calcular-tempo-esperado-separacao.js';
import type { EnderecoItemMapaCampos } from './endereco-item-mapa.js';
import { montarCabecalhoGrupo } from './montar-cabecalho-grupo-mapa.js';
import type { TransporteMetaMapa } from './montar-cabecalho-grupo-mapa.js';
import { montarContextoClienteEspecialDoBloco } from './aplicar-clientes-especiais-mapa.js';
import { ordenarItensPickway } from './ordenar-itens-pickway.js';
import {
  segregarItensConsolidados,
  type ItemMapaSegregavel,
} from './segregar-itens-mapa.js';

export type RemessaLinhaItemMapa = {
  id: string;
  remessaId: string;
  numeroRemessa: string;
  codCliente: string;
  cliente: string;
  cidade: string;
  sku: string;
  descricao: string | null;
  produtoId: string | null;
  empresa: string;
  categoria: string;
  lote: string | null;
  dataFabricacao: string | null;
  faixa: string | null;
  peso: number | null;
  quantidade: number;
  unidadeMedida: string;
  quantidadeNormalizadaUnidades: number;
  unidadesPorCaixa: number | null;
  caixasPorPalete: number | null;
  pesoBrutoUnidade: string | null;
  pesoBrutoCaixa: string | null;
  pesoBrutoPalete: string | null;
  pesoLiquidoUnidade: string | null;
  pesoLiquidoCaixa: string | null;
  pesoLiquidoPalete: string | null;
} & EnderecoItemMapaCampos;

export type TransporteParaMapa = {
  id: string;
  rota: string;
  cidade: string;
  bairro: string | null;
  placa: string | null;
  transportadora: string | null;
  remessas: Array<{
    id: string;
    remessa: string;
    codCliente: string;
    cliente: string;
    cidade: string;
    peso: number;
    volume: number;
    itens: RemessaLinhaItemMapa[];
  }>;
};

type GrupoMapaCustomizado = GerarMapasConfigInput['agrupamento']['grupos'][number];

type ItemComContexto = {
  item: RemessaLinhaItemMapa;
  transporte: TransporteParaMapa;
};

export type LinhaMapaInterna = {
  item: RemessaLinhaItemMapa;
  transporteId: string;
  transporteRota: string;
};

export type BlocoMapaInterno = {
  id: string;
  titulo: string;
  subtitulo?: string;
  cliente?: string;
  empresa?: string;
  categoria?: string;
  linhas: LinhaMapaInterna[];
};

function coletarItens(transportes: TransporteParaMapa[]): ItemComContexto[] {
  const resultado: ItemComContexto[] = [];

  transportes.forEach((transporte) => {
    transporte.remessas.forEach((remessa) => {
      remessa.itens.forEach((item) => {
        resultado.push({ item, transporte });
      });
    });
  });

  return resultado;
}

function criarLinha({ item, transporte }: ItemComContexto): LinhaMapaInterna {
  return {
    item,
    transporteId: transporte.id,
    transporteRota: transporte.rota,
  };
}

function montarLinhasTransporte(transporte: TransporteParaMapa): LinhaMapaInterna[] {
  return coletarItens([transporte]).map((contexto) => criarLinha(contexto));
}

function montarBlocosPorCliente(
  transportes: TransporteParaMapa[],
): BlocoMapaInterno[] {
  const porCliente = new Map<
    string,
    { cliente: string; linhas: LinhaMapaInterna[] }
  >();

  coletarItens(transportes).forEach((contexto) => {
    const codCliente = contexto.item.codCliente;
    const atual = porCliente.get(codCliente) ?? {
      cliente: contexto.item.cliente,
      linhas: [],
    };

    atual.linhas.push(criarLinha(contexto));
    porCliente.set(codCliente, atual);
  });

  return Array.from(porCliente.entries()).map(([codCliente, { cliente, linhas }]) => ({
    id: `cliente-${codCliente}`,
    titulo: cliente,
    subtitulo: `Cód. ${codCliente}`,
    cliente,
    linhas,
  }));
}

function montarBlocosPorTransporte(
  transportes: TransporteParaMapa[],
  config: GerarMapasConfigInput,
): BlocoMapaInterno[] {
  return transportes.map((transporte) => ({
    id: transporte.id,
    titulo: transporte.rota,
    subtitulo: `${transporte.cidade} · ${transporte.bairro ?? ''}`,
    cliente: config.exibirClienteCabecalho ? undefined : transporte.cidade,
    linhas: montarLinhasTransporte(transporte),
  }));
}

function deveAplicarSegregacaoClientes(config: GerarMapasConfigInput): boolean {
  return (
    config.agrupamento.tiposAtivos.includes('segregar_clientes') &&
    config.agrupamento.clientesSegregados.length > 0
  );
}

function aplicarSegregacaoEmBlocos(
  blocos: BlocoMapaInterno[],
  config: GerarMapasConfigInput,
): BlocoMapaInterno[] {
  if (!deveAplicarSegregacaoClientes(config)) {
    return blocos;
  }

  const clientesAlvo = config.agrupamento.clientesSegregados;
  const resultado: BlocoMapaInterno[] = [];

  blocos.forEach((bloco) => {
    const linhasRestantes: LinhaMapaInterna[] = [];
    const linhasPorClienteSegregado = new Map<
      string,
      { cliente: string; linhas: LinhaMapaInterna[] }
    >();

    bloco.linhas.forEach((linha) => {
      const codCliente = linha.item.codCliente;

      if (clienteEstaNaListaSegregacao(codCliente, clientesAlvo)) {
        const chaveSegregacao = codCliente;
        const atual = linhasPorClienteSegregado.get(chaveSegregacao) ?? {
          cliente: linha.item.cliente,
          linhas: [],
        };

        atual.linhas.push(linha);
        linhasPorClienteSegregado.set(chaveSegregacao, atual);
        return;
      }

      linhasRestantes.push(linha);
    });

    linhasPorClienteSegregado.forEach(({ cliente, linhas }, codCliente) => {
      resultado.push({
        id: `${bloco.id}-cliente-${codCliente}`,
        titulo: bloco.titulo,
        subtitulo: `${cliente} · Cód. ${codCliente}`,
        cliente,
        linhas,
      });
    });

    if (linhasRestantes.length > 0) {
      resultado.push({
        ...bloco,
        linhas: linhasRestantes,
      });
    }
  });

  return resultado;
}

function itemPertenceAoGrupoCustomizado(
  contexto: ItemComContexto,
  tipoItem: GrupoMapaCustomizado['tipoItem'],
  itemValor: string,
): boolean {
  const valor = itemValor.trim();
  if (!valor) {
    return false;
  }

  switch (tipoItem) {
    case 'transporte':
      return (
        contexto.transporte.rota === valor || contexto.transporte.id === valor
      );
    case 'cliente':
      return (
        contexto.item.codCliente === valor || contexto.item.cliente === valor
      );
    case 'remessa':
      return (
        contexto.item.numeroRemessa === valor ||
        contexto.item.remessaId === valor
      );
  }
}

function montarSubtituloGrupoCustomizado(
  tipoItem: GrupoMapaCustomizado['tipoItem'],
  linhas: LinhaMapaInterna[],
): string {
  switch (tipoItem) {
    case 'transporte': {
      const rotas = [...new Set(linhas.map((linha) => linha.transporteRota))];
      return rotas.join(' · ');
    }
    case 'cliente': {
      const clientes = [
        ...new Set(
          linhas.map((linha) => `${linha.item.cliente} · Cód. ${linha.item.codCliente}`),
        ),
      ];
      return clientes.join(' · ');
    }
    case 'remessa': {
      const remessas = [...new Set(linhas.map((linha) => linha.item.numeroRemessa))];
      return remessas.join(' · ');
    }
  }
}

function montarBlocosPorGruposCustomizados(
  transportes: TransporteParaMapa[],
  grupos: GrupoMapaCustomizado[],
): BlocoMapaInterno[] {
  return grupos.flatMap((grupo) => {
    if (!grupo.nome.trim() || !grupo.itens.length) {
      return [];
    }

    const nomeGrupo = grupo.nome.trim();
    const linhas = coletarItens(transportes)
      .filter((contexto) =>
        grupo.itens.some((itemValor) =>
          itemPertenceAoGrupoCustomizado(contexto, grupo.tipoItem, itemValor),
        ),
      )
      .map((contexto) => criarLinha(contexto));

    if (!linhas.length) {
      return [];
    }

    return [
      {
        id: grupo.id,
        titulo: nomeGrupo,
        subtitulo: montarSubtituloGrupoCustomizado(grupo.tipoItem, linhas),
        linhas,
      },
    ];
  });
}

function coletarIdsLinhasDosBlocos(blocos: BlocoMapaInterno[]): Set<string> {
  const ids = new Set<string>();

  blocos.forEach((bloco) => {
    bloco.linhas.forEach((linha) => {
      ids.add(linha.item.id);
    });
  });

  return ids;
}

function filtrarTransportesExcluindoLinhas(
  transportes: TransporteParaMapa[],
  linhasExcluidas: Set<string>,
): TransporteParaMapa[] {
  return transportes
    .map((transporte) => ({
      ...transporte,
      remessas: transporte.remessas
        .map((remessa) => ({
          ...remessa,
          itens: remessa.itens.filter((item) => !linhasExcluidas.has(item.id)),
        }))
        .filter((remessa) => remessa.itens.length > 0),
    }))
    .filter((transporte) => transporte.remessas.length > 0);
}

function montarBlocosComGruposCustomizados(
  transportes: TransporteParaMapa[],
  config: GerarMapasConfigInput,
): BlocoMapaInterno[] {
  const blocosGrupos = montarBlocosPorGruposCustomizados(
    transportes,
    config.agrupamento.grupos,
  );

  if (!blocosGrupos.length) {
    return montarBlocosPorTransporte(transportes, config);
  }

  const linhasConsumidas = coletarIdsLinhasDosBlocos(blocosGrupos);
  const transportesRestantes = filtrarTransportesExcluindoLinhas(
    transportes,
    linhasConsumidas,
  );
  const blocosRestantes = montarBlocosPorTransporte(transportesRestantes, config);

  return [...blocosGrupos, ...blocosRestantes];
}

const CATEGORIA_LABELS: Record<string, string> = {
  seco: 'Seco',
  refrigerado: 'Refrigerado',
  queijo: 'Queijo',
  sem_categoria: 'Sem categoria',
};

function labelCategoria(categoria: string): string {
  return CATEGORIA_LABELS[categoria] ?? categoria;
}

function chaveEmpresaCategoria(linha: LinhaMapaInterna): string {
  const empresa = linha.item.empresa ?? 'SEM_EMPRESA';
  const categoria = linha.item.categoria ?? 'sem_categoria';
  return `${empresa}::${categoria}`;
}

function montarSubtituloEmpresaCategoria(
  subtitulo: string | undefined,
  empresa: string,
  categoria: string,
): string {
  const sufixo = `${empresa} · ${labelCategoria(categoria)}`;
  return subtitulo?.trim() ? `${subtitulo} · ${sufixo}` : sufixo;
}

function aplicarAgrupamentoEmpresaCategoria(
  blocos: BlocoMapaInterno[],
): BlocoMapaInterno[] {
  const resultado: BlocoMapaInterno[] = [];

  blocos.forEach((bloco) => {
    const porEmpresaCategoria = new Map<string, LinhaMapaInterna[]>();

    bloco.linhas.forEach((linha) => {
      const chave = chaveEmpresaCategoria(linha);
      const atual = porEmpresaCategoria.get(chave) ?? [];
      atual.push(linha);
      porEmpresaCategoria.set(chave, atual);
    });

    porEmpresaCategoria.forEach((linhas, chave) => {
      const separador = chave.indexOf('::');
      const empresa = chave.slice(0, separador);
      const categoria = chave.slice(separador + 2);

      resultado.push({
        ...bloco,
        id:
          porEmpresaCategoria.size > 1
            ? `${bloco.id}-${empresa}-${categoria}`
            : bloco.id,
        empresa,
        categoria,
        subtitulo: montarSubtituloEmpresaCategoria(
          bloco.subtitulo,
          empresa,
          categoria,
        ),
        linhas,
      });
    });
  });

  return resultado;
}

export function resolverBlocosBase(
  transportes: TransporteParaMapa[],
  config: GerarMapasConfigInput,
): BlocoMapaInterno[] {
  let blocos: BlocoMapaInterno[];

  if (config.tipoDadosBasicos === 'cliente') {
    blocos = montarBlocosPorCliente(transportes);
  } else if (config.agrupamento.tiposAtivos.includes('grupos_customizados')) {
    blocos = montarBlocosComGruposCustomizados(transportes, config);
  } else {
    blocos = montarBlocosPorTransporte(transportes, config);
  }

  return aplicarAgrupamentoEmpresaCategoria(
    aplicarSegregacaoEmBlocos(blocos, config),
  );
}

function labelAgrupamento(config: GerarMapasConfigInput): string {
  return config.tipoDadosBasicos === 'cliente' ? 'Por cliente' : 'Por transporte';
}

type ItemMapaConsolidavel = {
  sku: string;
  descricao: string | null;
  lote: string | null;
  peso: number | null;
  quantidade: number;
  quantidadeNormalizadaUnidades: number;
  unidadesPorCaixa: number | null;
  caixasPorPalete: number | null;
  pesoBrutoUnidade: string | null;
  pesoBrutoCaixa: string | null;
  pesoBrutoPalete: string | null;
  pesoLiquidoUnidade: string | null;
  pesoLiquidoCaixa: string | null;
  pesoLiquidoPalete: string | null;
};

export function consolidarItensPorSkuLote<T extends ItemMapaConsolidavel>(itens: T[]): T[] {
  const porChave = new Map<string, T>();

  itens.forEach((item) => {
    const chave = `${item.sku}::${item.lote ?? ''}`;
    const atual = porChave.get(chave);

    if (!atual) {
      porChave.set(chave, { ...item });
      return;
    }

    porChave.set(chave, {
      ...atual,
      peso: (atual.peso ?? 0) + (item.peso ?? 0),
      quantidade:
        (atual.quantidade ?? 0) + (item.quantidade ?? 0),
      quantidadeNormalizadaUnidades:
        atual.quantidadeNormalizadaUnidades + item.quantidadeNormalizadaUnidades,
      unidadesPorCaixa: atual.unidadesPorCaixa ?? item.unidadesPorCaixa ?? null,
      caixasPorPalete: atual.caixasPorPalete ?? item.caixasPorPalete ?? null,
      pesoBrutoUnidade: atual.pesoBrutoUnidade ?? item.pesoBrutoUnidade ?? null,
      pesoBrutoCaixa: atual.pesoBrutoCaixa ?? item.pesoBrutoCaixa ?? null,
      pesoBrutoPalete: atual.pesoBrutoPalete ?? item.pesoBrutoPalete ?? null,
      pesoLiquidoUnidade: atual.pesoLiquidoUnidade ?? item.pesoLiquidoUnidade ?? null,
      pesoLiquidoCaixa: atual.pesoLiquidoCaixa ?? item.pesoLiquidoCaixa ?? null,
      pesoLiquidoPalete: atual.pesoLiquidoPalete ?? item.pesoLiquidoPalete ?? null,
      descricao: atual.descricao ?? item.descricao ?? null,
    });
  });

  return Array.from(porChave.values());
}

function projetarItens(itens: ItemMapaSegregavel[]) {
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
    breakdown: calcularBreakdownQuantidade(
      item.quantidadeNormalizadaUnidades,
      item.unidadesPorCaixa,
      item.caixasPorPalete,
      item.pesoBrutoUnidade,
      item.pesoBrutoCaixa,
      item.pesoBrutoPalete,
      item.pesoLiquidoUnidade,
      item.pesoLiquidoCaixa,
      item.pesoLiquidoPalete,
    ),
  }));
}

export function mapearLinhaParaItemSegregavel(
  linha: LinhaMapaInterna,
): ItemMapaSegregavel {
  return {
    sku: linha.item.sku,
    descricao: linha.item.descricao,
    remessa: linha.item.numeroRemessa,
    cliente: linha.item.cliente,
    codCliente: linha.item.codCliente,
    empresa: linha.item.empresa,
    categoria: linha.item.categoria,
    lote: linha.item.lote,
    dataFabricacao: linha.item.dataFabricacao,
    faixa: linha.item.faixa,
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
  };
}

function projetarBloco(
  bloco: BlocoMapaInterno,
  config: GerarMapasConfigInput,
  transportesPorId: Map<string, TransporteMetaMapa>,
  parametrosSeparacao?: ParametrosSeparacao,
  clientesEspeciaisPorCodigo?: Map<string, ClienteEspecialRecord>,
): MapaEtapaPayload['grupos'] {
  const itensBrutos: ItemMapaSegregavel[] = bloco.linhas.map((linha) =>
    mapearLinhaParaItemSegregavel(linha),
  );

  const itensConsolidados = consolidarItensPorSkuLote(itensBrutos);
  const itensOrdenados = ordenarItensPickway(itensConsolidados);
  const gruposSegregados = segregarItensConsolidados(itensOrdenados, config);
  const contextoClienteEspecial = clientesEspeciaisPorCodigo
    ? montarContextoClienteEspecialDoBloco(bloco, clientesEspeciaisPorCodigo)
    : {};

  return gruposSegregados.flatMap((grupo) => {
    const tituloBase = `${bloco.titulo}${grupo.sufixoTitulo}`;
    const partesItens =
      grupo.idSuffix === '' && config.quebraPalete.ativo
        ? aplicarQuebraPaleteItens(grupo.itens, config.quebraPalete)
        : [grupo.itens];

    return partesItens
      .map((parteItens, index) => {
        const itens = projetarItens(parteItens);

        if (itens.length === 0) {
          return null;
        }

        const parteNumero = index + 1;
        const sufixoParte =
          partesItens.length > 1 ? ` — Parte ${parteNumero}` : '';

        const titulo = `${tituloBase}${sufixoParte}`;

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
          parteItens.map((item) => ({ caixasPorPalete: item.caixasPorPalete })),
        );

        const tempoEsperado = parametrosSeparacao
          ? calcularTempoEsperadoSeparacaoSeg(
              parametrosSeparacao,
              parteItens.map((item, itemIndex) => ({
                caixas: itens[itemIndex]?.breakdown?.caixas ?? 0,
                slottingOrdem: item.slottingOrdem ?? null,
              })),
            )
          : 0;

        return {
          id: cabecalho.microUuid,
          titulo,
          subtitulo: contextoClienteEspecial.subtitulo ?? bloco.subtitulo,
          infoAdicionaisI: contextoClienteEspecial.infoAdicionaisI,
          infoAdicionaisII: contextoClienteEspecial.infoAdicionaisII,
          totalItens: itens.length,
          pesoTotal: itens.reduce((total, item) => total + (item.peso ?? 0), 0),
          tempoEsperado,
          cabecalho,
          itens,
        };
      })
      .filter((grupoProjetado): grupoProjetado is NonNullable<typeof grupoProjetado> =>
        grupoProjetado !== null,
      );
  });
}

export function montarGruposMapa(
  transportes: TransporteParaMapa[],
  config: GerarMapasConfigInput,
  parametrosSeparacao?: ParametrosSeparacao,
  clientesEspeciaisPorCodigo?: Map<string, ClienteEspecialRecord>,
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

  const blocos = resolverBlocosBase(transportes, config).filter(
    (bloco) => bloco.linhas.length > 0,
  );

  const grupos = blocos.flatMap((bloco) =>
    projetarBloco(
      bloco,
      config,
      transportesPorId,
      parametrosSeparacao,
      clientesEspeciaisPorCodigo,
    ),
  );

  return {
    agrupamento: labelAgrupamento(config),
    tipoDadosBasicos: config.tipoDadosBasicos,
    totalGrupos: grupos.length,
    grupos,
  };
}
