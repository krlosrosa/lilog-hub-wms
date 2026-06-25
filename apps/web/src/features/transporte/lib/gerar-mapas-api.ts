import { apiRequest } from '@/lib/api';



import type { BreakdownQuantidade } from '@/features/transporte/types/transporte.schema';

import type {

  ConfigAgrupamentoMapa,

  OpcoesConferenciaMapa,

  TipoDadosBasicosMapa,

  TipoQuebraPalete,

} from '@/features/transporte/types/transporte.schema';



export type ConfigMapaImpressaoApi = {

  tipoDadosBasicos: TipoDadosBasicosMapa;

  quebraPalete: {

    ativo: boolean;

    tipo: TipoQuebraPalete;

    valor: number;

  };

  exibirClienteCabecalho: boolean;

  segregarPaleteFull: boolean;

  segregarUnidade: boolean;

  agrupamento: ConfigAgrupamentoMapa;

  opcoesConferencia: OpcoesConferenciaMapa;

};



export type ItemGrupoMapaApi = {

  sku: string;

  descricao: string | null;

  remessa: string;

  cliente: string;

  codCliente: string;

  empresa: string;

  categoria: string;

  lote: string | null;

  dataFabricacao: string | null;

  faixa: string | null;

  quantidade: number;

  unidadeMedida: string;

  quantidadeNormalizadaUnidades: number;

  peso: number | null;

  endereco?: string | null;

  quebraPalete?: boolean;

  breakdown: BreakdownQuantidade | null;

};



export type CabecalhoGrupoMapaApi = {

  transporte: string;

  placa: string | null;

  transportadora: string | null;

  codPrimeiroCliente: string;

  primeiroCliente: string;

  codTodosClientes: string;

  todosClientes: string;

  pesoTotal: number;

  totalCaixas: number;

  totalUnidades: number;

  totalPaletes: number;

  nomeGrupo: string;

  quantidadeLinhas: number;

  categoria: string;

  empresa: string;

  microUuid: string;

};



export type GrupoMapaApi = {

  id: string;

  titulo: string;

  subtitulo?: string;

  totalItens: number;

  pesoTotal: number;

  tempoEsperado?: number;

  cabecalho: CabecalhoGrupoMapaApi;

  itens: ItemGrupoMapaApi[];

};



export type MapaEtapaPayload = {

  agrupamento: string;

  tipoDadosBasicos: TipoDadosBasicosMapa;

  totalGrupos: number;

  grupos: GrupoMapaApi[];

};

export type LinhaTabelaEmpresaCarregamentoApi = {
  empresa: string;
  categoria: string;
  quantidadeUnidade: number;
  quantidadeCaixa: number;
  quantidadePalete: number;
  pesoKg: number;
};

export type LinhaTabelaClienteCarregamentoApi = {
  codCliente: string;
  cliente: string;
  cidade: string;
  pesoKg: number;
  volumeM3: number;
  quantidadeUnidade: number;
  quantidadeCaixa: number;
  quantidadePalete: number;
};

export type MinutaCarregamentoApi = {
  transporteId: string;
  cabecalho: CabecalhoGrupoMapaApi;
  tabelaEmpresa: LinhaTabelaEmpresaCarregamentoApi[];
  tabelaClientes: LinhaTabelaClienteCarregamentoApi[];
  totais: {
    pesoKg: number;
    volumeM3: number;
    quantidadeUnidade: number;
    quantidadeCaixa: number;
    quantidadePalete: number;
  };
};

export type CarregamentoPayload = {
  totalMinutas: number;
  minutas: MinutaCarregamentoApi[];
};

export type GerarMapasResponse = MapaEtapaPayload & {

  separacao: MapaEtapaPayload;

  conferencia: MapaEtapaPayload;

  opcoesConferencia: OpcoesConferenciaMapa;

  carregamento: CarregamentoPayload;

};



export type GerarMapasPayload = {
  transporteIds: string[];
  config: ConfigMapaImpressaoApi;
};



export function toConfigMapaImpressaoApi(

  config: {

    tipoDadosBasicos: TipoDadosBasicosMapa;

    quebraPalete: ConfigMapaImpressaoApi['quebraPalete'];

    exibirClienteCabecalho: boolean;

    segregarPaleteFull: boolean;

    segregarUnidade: boolean;

    agrupamento: ConfigAgrupamentoMapa;

    opcoesConferencia: OpcoesConferenciaMapa;

  },

): ConfigMapaImpressaoApi {

  return {

    tipoDadosBasicos: config.tipoDadosBasicos,

    quebraPalete: config.quebraPalete,

    exibirClienteCabecalho: config.exibirClienteCabecalho,

    segregarPaleteFull: config.segregarPaleteFull,

    segregarUnidade: config.segregarUnidade,

    agrupamento: config.agrupamento,

    opcoesConferencia: config.opcoesConferencia,

  };

}



export function gerarMapasApi(unidadeId: string, payload: GerarMapasPayload) {

  return apiRequest<GerarMapasResponse>('/expedicao/mapas/gerar', {

    method: 'POST',

    body: JSON.stringify({ ...payload, unidadeId }),

  });

}



export type MapaLoteResumoGrupo = {

  microUuid: string;

  titulo: string;

  totalItens: number;

  pesoTotalKg: number;

};



export type MapaLoteResumoTransporte = {

  transporteId: string;

  rota: string;

  placa: string | null;

  mapaGeradoEmAnterior?: string | null;

  totalGrupos: number;

  totalItens: number;

  pesoTotalKg: number;

  grupos: MapaLoteResumoGrupo[];

};



export type MapaLoteResumo = {

  totalTransportes: number;

  totalGrupos: number;

  totalItens: number;

  pesoTotalKg: number;

  transportes: MapaLoteResumoTransporte[];

  configResumo: {

    tipoDadosBasicos: TipoDadosBasicosMapa;

    segregarPaleteFull: boolean;

    segregarUnidade: boolean;

    quebraPaleteAtivo: boolean;

  };

};



export type SalvarMapasPayload = GerarMapasPayload & {

  configuracaoImpressaoId?: string;

};



export type SalvarMapasResponse = GerarMapasResponse & {

  mapaLoteId: string;

  resumo: MapaLoteResumo;

};



export type MapaLoteListItem = {

  id: string;

  unidadeId: string;

  resumo: MapaLoteResumo;

  configuracaoImpressaoId: string | null;

  criadoPor: number | null;

  createdAt: string;

  transporteIds: string[];

};



export function salvarMapasApi(unidadeId: string, payload: SalvarMapasPayload) {

  return apiRequest<SalvarMapasResponse>('/expedicao/mapas/salvar', {

    method: 'POST',

    body: JSON.stringify({ ...payload, unidadeId }),

  });

}



export function listarMapasLotesApi(

  unidadeId: string,

  transporteIds: string[],

) {

  const params = new URLSearchParams({ unidadeId });

  transporteIds.forEach((id) => params.append('transporteIds', id));



  return apiRequest<{ lotes: MapaLoteListItem[] }>(

    `/expedicao/mapas?${params.toString()}`,

  );

}



export function obterMapaLoteApi(loteId: string, unidadeId: string) {

  const params = new URLSearchParams({ unidadeId });



  return apiRequest<{

    id: string;

    unidadeId: string;

    payload: GerarMapasResponse;

    resumo: MapaLoteResumo;

    createdAt: string;

  }>(`/expedicao/mapas/${loteId}?${params.toString()}`);

}



export type ExcluirMapaLoteResponse = {
  loteId: string;
  transportesAfetados: number;
};



export function deleteMapaLoteApi(loteId: string, unidadeId: string) {
  const params = new URLSearchParams({ unidadeId });

  return apiRequest<ExcluirMapaLoteResponse>(
    `/expedicao/mapas/${loteId}?${params.toString()}`,
    {
      method: 'DELETE',
    },
  );
}

