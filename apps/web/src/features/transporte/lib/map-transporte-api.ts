import type {
  RemessaLinhaApiItem,
  RemessaTransporteApiItem,
  TransporteApiItem,
} from '@/features/transporte/lib/expedicao-api';
import { inferirPerfilEsperado } from '@/features/transporte/lib/inferir-perfil-esperado';
import type {
  RemessaItem,
  RemessaLinhaItem,
  TipoVeiculo,
  TransporteGrupo,
} from '@/features/transporte/types/transporte.schema';

function mapRemessaLinha(
  item: RemessaLinhaApiItem,
  remessa: RemessaTransporteApiItem,
): RemessaLinhaItem {
  return {
    id: item.id,
    remessaId: remessa.id,
    numeroRemessa: remessa.remessa,
    codCliente: remessa.codCliente,
    cliente: remessa.cliente,
    cidade: remessa.cidade,
    sku: item.sku,
    descricao: item.descricao ?? null,
    produtoId: item.produtoId,
    empresa: item.empresa ?? remessa.empresa,
    categoria: item.categoria ?? 'sem_categoria',
    lote: item.lote,
    dataFabricacao: item.dataFabricacao ?? null,
    faixa: item.faixa ?? null,
    peso: item.peso,
    quantidade: item.quantidade,
    unidadeMedida: item.unidadeMedida,
    quantidadeNormalizadaUnidades: item.quantidadeNormalizadaUnidades,
    breakdown: item.breakdown ?? null,
    unidadesPorCaixa: item.unidadesPorCaixa ?? null,
    caixasPorPalete: item.caixasPorPalete ?? null,
    pesoBrutoUnidade: item.pesoBrutoUnidade ?? null,
    pesoBrutoCaixa: item.pesoBrutoCaixa ?? null,
    pesoBrutoPalete: item.pesoBrutoPalete ?? null,
    pesoLiquidoUnidade: item.pesoLiquidoUnidade ?? null,
    pesoLiquidoCaixa: item.pesoLiquidoCaixa ?? null,
    pesoLiquidoPalete: item.pesoLiquidoPalete ?? null,
  };
}

function mapRemessa(remessa: RemessaTransporteApiItem): RemessaItem {
  const itens = (remessa.itens ?? []).map((item) => mapRemessaLinha(item, remessa));

  return {
    id: remessa.id,
    remessa: remessa.remessa,
    empresa: remessa.empresa,
    codCliente: remessa.codCliente,
    cliente: remessa.cliente,
    cidade: remessa.cidade,
    peso: remessa.peso,
    volume: remessa.volume,
    origem: remessa.origem,
    motivoReentrega: remessa.motivoReentrega ?? undefined,
    itens,
  };
}

export function mapTransporteApiToGrupo(item: TransporteApiItem): TransporteGrupo {
  const perfilEsperado: TipoVeiculo =
    item.perfilEsperado ?? inferirPerfilEsperado(item.pesoTotal, item.volumeTotal);

  const transporte: TransporteGrupo = {
    id: item.id,
    uploadLoteId: item.uploadLoteId,
    rota: item.rota,
    regiao: item.regiao,
    cidade: item.cidade,
    bairro: item.bairro ?? '',
    remessas: item.remessas.map(mapRemessa),
    quantidadeRemessas: item.quantidadeRemessas,
    pesoTotal: item.pesoTotal,
    volumeTotal: item.volumeTotal,
    distanciaKm: item.distanciaKm ?? 0,
    itinerario: item.itinerario ?? null,
    perfilEsperado,
    status: item.status,
    custoPrevisto: item.custoPrevisto ?? undefined,
    freteSemCusto: item.freteSemCusto,
    perfilPagamentoId: item.perfilPagamentoId,
    perfilPagamentoNome: item.perfilPagamentoNome,
    reentregaExclusiva: item.reentregaExclusiva,
    isPrioridade: item.isPrioridade,
    nivelPrioridade: item.nivelPrioridade,
    dataTransporte: item.dataTransporte,
    horarioExpectativaSaida: item.horarioExpectativaSaida ?? null,
    mapaGeradoEm: item.mapaGeradoEm ?? null,
    ultimoMapaLoteId: item.ultimoMapaLoteId ?? null,
  };

  if (item.placa) {
    transporte.veiculoAlocado = {
      veiculoId: item.placa,
      placa: item.placa,
      tipo: perfilEsperado,
      motorista: item.motorista ?? '',
      transportadora: item.transportadora ?? '',
    };
  } else if (item.transportadora) {
    transporte.transportadoraAtribuida = item.transportadora;
  }

  return transporte;
}

export function mapTransportesApiToGrupos(
  items: TransporteApiItem[],
): TransporteGrupo[] {
  return items.map(mapTransporteApiToGrupo);
}
