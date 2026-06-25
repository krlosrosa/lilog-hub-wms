import type {
  GerarMapasConfigInput,
  GerarMapasResponse,
  MapaEtapaPayload,
} from '../../dtos/expedicao/gerar-mapas.dto.js';
import { emptyCarregamentoPayload, montarGerarMapasResponse } from '../../dtos/expedicao/gerar-mapas.dto.js';
import { aplicarClientesEspeciaisNaConfig, montarMapaClientesEspeciaisPorCodigoRemessa } from './aplicar-clientes-especiais-mapa.js';
import { montarGruposMapaConferencia } from './montar-grupos-mapa-conferencia.js';
import { montarMinutaCarregamento } from './montar-minuta-carregamento.js';
import {
  montarGruposMapa,
  resolverBlocosBase,
  type TransporteParaMapa,
} from './montar-grupos-mapa.js';
import { obterParametrosSeparacaoPadraoDb } from '../../../infra/db/configuracao-operacional/obter-configuracao-operacional-padrao.drizzle.js';
import { findClientesEspeciaisPorCodigosDb } from '../../../infra/db/expedicao/find-clientes-especiais-por-codigos.drizzle.js';
import { listRemessaItensByRemessaIdsDb } from '../../../infra/db/expedicao/list-remessa-itens-by-remessa-ids.drizzle.js';
import { listTransportesByIdsDb } from '../../../infra/db/expedicao/list-transportes-by-ids.drizzle.js';
import { listProdutoEnderecosByProdutoIdsDb } from '../../../infra/db/produto-endereco/list-produto-enderecos-by-produto-ids.drizzle.js';
import type { DrizzleClient } from '../../../infra/db/providers/drizzle/drizzle.provider.js';
import {
  enderecoItemMapaParaCampos,
  type EnderecoItemMapaCampos,
} from './endereco-item-mapa.js';
import {
  coletarProdutoUuidsParaSlotting,
  montarMapaEnderecoPorProdutoCodigo,
  resolverEnderecoItemMapa,
} from './resolver-endereco-produto-slotting.js';

function parseNumeric(value: string | null | undefined): number | null {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function emptyEtapaPayload(
  config: GerarMapasConfigInput,
): MapaEtapaPayload {
  return {
    agrupamento:
      config.tipoDadosBasicos === 'cliente' ? 'Por cliente' : 'Por transporte',
    tipoDadosBasicos: config.tipoDadosBasicos,
    totalGrupos: 0,
    grupos: [],
  };
}

function emptyConferenciaPayload(
  config: GerarMapasConfigInput,
): MapaEtapaPayload {
  return {
    agrupamento:
      config.opcoesConferencia.agrupamento === 'replicar_separacao'
        ? 'Replicar separação'
        : 'Apenas transporte',
    tipoDadosBasicos:
      config.opcoesConferencia.agrupamento === 'replicar_separacao'
        ? config.tipoDadosBasicos
        : 'transporte',
    totalGrupos: 0,
    grupos: [],
  };
}

export type TransporteMapaContext = {
  id: string;
  rota: string;
  placa: string | null;
  transportadora: string | null;
  mapaGeradoEm: Date | null;
  ultimoMapaLoteId: string | null;
};

export type MontarMapasDeTransportesResult = {
  payload: GerarMapasResponse;
  transportes: TransporteMapaContext[];
  transportesPorRota: Map<string, string>;
};

export async function montarMapasDeTransportes(
  db: DrizzleClient,
  input: {
    unidadeId: string;
    transporteIds: string[];
    config: GerarMapasConfigInput;
  },
): Promise<MontarMapasDeTransportesResult> {
  const rows = await listTransportesByIdsDb(
    db,
    input.unidadeId,
    input.transporteIds,
  );

  const transportesPorRota = new Map<string, string>();
  const transportesContext: TransporteMapaContext[] = rows.map((row) => {
    transportesPorRota.set(row.rota, row.id);

    return {
      id: row.id,
      rota: row.rota,
      placa: row.placa,
      transportadora: row.transportadora,
      mapaGeradoEm: row.mapaGeradoEm ?? null,
      ultimoMapaLoteId: row.ultimoMapaLoteId ?? null,
    };
  });

  if (!rows.length) {
    const separacao = emptyEtapaPayload(input.config);
    const conferencia = emptyConferenciaPayload(input.config);

    return {
      payload: montarGerarMapasResponse(
        separacao,
        conferencia,
        input.config.opcoesConferencia,
        emptyCarregamentoPayload(),
      ),
      transportes: transportesContext,
      transportesPorRota,
    };
  }

  const remessaIds = rows.flatMap((row) => row.remessas.map((r) => r.id));
  const itensRows = await listRemessaItensByRemessaIdsDb(db, remessaIds);

  const produtoCodigos = [
    ...new Set(
      itensRows
        .map((row) => row.produtoCodigo.trim())
        .filter((codigo) => codigo.length > 0),
    ),
  ];

  const produtoUuids = [
    ...new Set(
      itensRows.flatMap((row) =>
        coletarProdutoUuidsParaSlotting({
          produtoId: row.produtoId,
          produtoIdResolvido: row.produtoIdResolvido,
          produtoCodigo: row.produtoCodigo,
          sku: row.sku,
        }),
      ),
    ),
  ];

  const slottingRows = await listProdutoEnderecosByProdutoIdsDb(db, {
    unidadeId: input.unidadeId,
    produtoUuids,
    produtoCodigos,
  });

  const enderecoPorProdutoCodigo = montarMapaEnderecoPorProdutoCodigo(slottingRows);

  const itensPorRemessaId = new Map<
    string,
    TransporteParaMapa['remessas'][number]['itens']
  >();

  itensRows.forEach((row) => {
    const remessa = rows
      .flatMap((transporte) => transporte.remessas)
      .find((item) => item.id === row.remessaId);

    if (!remessa) {
      return;
    }

    const enderecoCampos: EnderecoItemMapaCampos = enderecoItemMapaParaCampos(
      resolverEnderecoItemMapa({
        produtoUuid: row.produtoIdResolvido ?? row.produtoId,
        produtoCodigo: row.produtoCodigo,
        sku: row.sku,
        enderecoPorProdutoCodigo,
      }),
    );

    const item = {
      id: row.id,
      remessaId: row.remessaId,
      numeroRemessa: remessa.remessa,
      codCliente: remessa.codCliente,
      cliente: remessa.cliente,
      cidade: remessa.cidade,
      sku: row.sku,
      produtoId: row.produtoIdResolvido ?? row.produtoId,
      empresa: row.empresaProduto ?? remessa.empresa,
      categoria: row.categoriaProduto ?? 'sem_categoria',
      lote: row.lote,
      dataFabricacao: row.dataFabricacao,
      faixa: row.faixa,
      peso: parseNumeric(row.peso),
      quantidade: parseNumeric(row.quantidade) ?? 0,
      unidadeMedida: row.unidadeMedida,
      quantidadeNormalizadaUnidades:
        parseNumeric(row.quantidadeNormalizadaUnidades) ?? 0,
      unidadesPorCaixa: row.unidadesPorCaixa,
      caixasPorPalete: row.caixasPorPalete,
      pesoBrutoUnidade: row.pesoBrutoUnidade,
      pesoBrutoCaixa: row.pesoBrutoCaixa,
      pesoBrutoPalete: row.pesoBrutoPalete,
      pesoLiquidoUnidade: row.pesoLiquidoUnidade,
      pesoLiquidoCaixa: row.pesoLiquidoCaixa,
      pesoLiquidoPalete: row.pesoLiquidoPalete,
      descricao: row.descricaoProduto,
      ...enderecoCampos,
    };

    const atual = itensPorRemessaId.get(row.remessaId) ?? [];
    atual.push(item);
    itensPorRemessaId.set(row.remessaId, atual);
  });

  const transportes: TransporteParaMapa[] = rows.map((row) => ({
    id: row.id,
    rota: row.rota,
    cidade: row.cidade,
    bairro: row.bairro,
    placa: row.placa,
    transportadora: row.transportadora,
    remessas: row.remessas.map((remessa) => ({
      id: remessa.id,
      remessa: remessa.remessa,
      codCliente: remessa.codCliente,
      cliente: remessa.cliente,
      cidade: remessa.cidade,
      peso: parseNumeric(remessa.peso) ?? 0,
      volume: parseNumeric(remessa.volume) ?? 0,
      itens: itensPorRemessaId.get(remessa.id) ?? [],
    })),
  }));

  const codClientes = [
    ...new Set(
      transportes.flatMap((transporte) =>
        transporte.remessas.map((remessa) => remessa.codCliente),
      ),
    ),
  ];

  const clientesEspeciais = await findClientesEspeciaisPorCodigosDb(
    db,
    input.unidadeId,
    codClientes,
  );

  const clientesEspeciaisPorCodigo = montarMapaClientesEspeciaisPorCodigoRemessa(
    clientesEspeciais,
    codClientes,
  );

  const configEnriquecida = aplicarClientesEspeciaisNaConfig(
    input.config,
    clientesEspeciais,
    codClientes,
  );

  const blocosSeparacao = resolverBlocosBase(transportes, configEnriquecida).filter(
    (bloco) => bloco.linhas.length > 0,
  );

  const parametrosSeparacao = await obterParametrosSeparacaoPadraoDb(
    db,
    input.unidadeId,
  );
  const separacao = montarGruposMapa(
    transportes,
    configEnriquecida,
    parametrosSeparacao ?? undefined,
    clientesEspeciaisPorCodigo,
  );
  const conferencia = montarGruposMapaConferencia(
    transportes,
    configEnriquecida,
    input.config.opcoesConferencia,
    blocosSeparacao,
    separacao,
  );

  const carregamento = montarMinutaCarregamento(transportes);

  const payload = montarGerarMapasResponse(
    separacao,
    conferencia,
    input.config.opcoesConferencia,
    carregamento,
  );

  return {
    payload,
    transportes: transportesContext,
    transportesPorRota,
  };
}
