export type TipoVeiculo = 'VUC' | 'Toco' | 'Truck_3_4' | 'Carreta' | 'Bitrem';

export type TipoCarga = 'seco' | 'refrigerado';

export type TipoFrete = 'fracionado' | 'lotacao' | 'carga_seca' | 'refrigerado';

export type StatusTransporte =
  | 'PENDENTE'
  | 'ALOCADO'
  | 'PARCIAL'
  | 'EM_SEPARACAO'
  | 'SEPARADO'
  | 'EM_CONFERENCIA'
  | 'CONFERIDO'
  | 'EM_CARREGAMENTO'
  | 'CARREGADO'
  | 'EM_VIAGEM'
  | 'VIAGEM_FINALIZADA';

export type FiltroStatusTransporte = 'todos' | StatusTransporte;

export type FiltroRapidoTransporte =
  | 'todos'
  | 'sem_placa'
  | 'alocados'
  | 'sem_mapa'
  | 'com_mapa';

export const FILTRO_RAPIDO_TRANSPORTE_LABELS: Record<
  FiltroRapidoTransporte,
  string
> = {
  todos: 'Todos',
  sem_placa: 'Sem placa',
  alocados: 'Alocados',
  sem_mapa: 'Sem mapa',
  com_mapa: 'Com mapa',
};

export type NivelPrioridadeTransporte =
  | 'urgente'
  | 'prioritaria'
  | 'normal'
  | 'baixa';

export const NIVEL_PRIORIDADE_LABELS: Record<NivelPrioridadeTransporte, string> = {
  urgente: 'Urgente',
  prioritaria: 'Prioritária',
  normal: 'Normal',
  baixa: 'Baixa',
};

export const NIVEL_PRIORIDADE_OPCOES: NivelPrioridadeTransporte[] = [
  'urgente',
  'prioritaria',
  'normal',
  'baixa',
];

export type NivelCusto = 'dentro' | 'atencao' | 'acima';

export type OrigemRemessa = 'upload' | 'reentrega';

export type TipoQuebraPalete = 'percentual' | 'linhas';

export type FaixaFifo = 'amarelo' | 'laranja' | 'vermelho';

export const FAIXA_FIFO_LABELS: Record<FaixaFifo, string> = {
  amarelo: 'Amarelo',
  laranja: 'Laranja',
  vermelho: 'Vermelho',
};

export const FAIXAS_FIFO_OPCOES: FaixaFifo[] = ['amarelo', 'laranja', 'vermelho'];

export type AgrupamentoMapa = 'segregar_clientes' | 'grupos_customizados';

export type TipoItemGrupoMapa = 'transporte' | 'cliente' | 'remessa';

export type GrupoMapaCustomizado = {
  id: string;
  nome: string;
  tipoItem: TipoItemGrupoMapa;
  itens: string[];
};

export type ConfigAgrupamentoMapa = {
  tiposAtivos: AgrupamentoMapa[];
  clientesSegregados: string[];
  grupos: GrupoMapaCustomizado[];
};

export type TipoDadosBasicosMapa = 'transporte' | 'cliente';

export const TIPO_DADOS_BASICOS_MAPA_LABELS: Record<TipoDadosBasicosMapa, string> = {
  transporte: 'Transporte',
  cliente: 'Cliente',
};

export const TIPO_DADOS_BASICOS_MAPA_OPCOES: TipoDadosBasicosMapa[] = [
  'transporte',
  'cliente',
];

export type OpcoesConferenciaMapa = {
  classificarPor: 'pickway' | 'sku';
  agrupamento: 'replicar_separacao' | 'apenas_transporte';
};

export type ConfigMapaImpressao = {
  tipoDadosBasicos: TipoDadosBasicosMapa;
  quebraPalete: { ativo: boolean; tipo: TipoQuebraPalete; valor: number };
  segregarPaleteFull: boolean;
  segregarUnidade: boolean;
  segregarFifo: boolean;
  faixasFifo: FaixaFifo[];
  exibirClienteCabecalho: boolean;
  agrupamento: ConfigAgrupamentoMapa;
  opcoesConferencia: OpcoesConferenciaMapa;
};

export type ImpressaoPayload = {
  ids: string[];
  config: ConfigMapaImpressao;
};

export type BreakdownQuantidade = {
  paletes: number;
  caixas: number;
  unidades: number;
  pesoPaletes: number | null;
  pesoCaixas: number | null;
  pesoUnidades: number | null;
};

export type RemessaLinhaItem = {
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
  breakdown: BreakdownQuantidade | null;
  unidadesPorCaixa: number | null;
  caixasPorPalete: number | null;
  pesoBrutoUnidade: string | null;
  pesoBrutoCaixa: string | null;
  pesoBrutoPalete: string | null;
  pesoLiquidoUnidade: string | null;
  pesoLiquidoCaixa: string | null;
  pesoLiquidoPalete: string | null;
  endereco?: string | null;
  enderecoId?: string | null;
  zona?: string | null;
  rua?: string | null;
  posicao?: string | null;
  nivel?: string | null;
  prioridadePicking?: number | null;
  slottingOrdem?: number | null;
  slottingPapel?: string | null;
};

export type LinhaMapaImpressao = {
  item: RemessaLinhaItem;
  transporteId: string;
  transporteRota: string;
  quebraPalete?: boolean;
  paleteFull?: boolean;
  faixaFifo?: FaixaFifo;
};

export type BlocoMapaImpressao = {
  id: string;
  titulo: string;
  subtitulo?: string;
  cliente?: string;
  empresa?: string;
  categoria?: string;
  transporte?: TransporteGrupo;
  linhas: LinhaMapaImpressao[];
};

export const MAPA_SELECAO_STORAGE_KEY = 'mapa_selecao';
export const MAPA_TRANSPORTES_STORAGE_KEY = 'mapa_transportes';
export const MAPA_IMPRESSAO_PAYLOAD_STORAGE_KEY = 'mapa_impressao_payload';

export const DEFAULT_CONFIG_MAPA_IMPRESSAO: ConfigMapaImpressao = {
  tipoDadosBasicos: 'transporte',
  quebraPalete: { ativo: false, tipo: 'linhas', valor: 10 },
  segregarPaleteFull: false,
  segregarUnidade: false,
  segregarFifo: false,
  faixasFifo: [],
  exibirClienteCabecalho: true,
  agrupamento: {
    tiposAtivos: [],
    clientesSegregados: [],
    grupos: [],
  },
  opcoesConferencia: {
    classificarPor: 'sku',
    agrupamento: 'replicar_separacao',
  },
};

export type PreConfiguracaoMapa = {
  id: string;
  nome: string;
  descricao?: string;
  config: ConfigMapaImpressao;
};

export type RemessaItem = {
  id: string;
  remessa: string;
  empresa: string;
  codCliente: string;
  cliente: string;
  cidade: string;
  peso: number;
  volume: number;
  origem?: OrigemRemessa;
  motivoReentrega?: string;
  itinerario?: string | null;
  itinerarioId?: string | null;
  itens?: RemessaLinhaItem[];
};

export type NfReentregaPendente = {
  id: string;
  numeroNF: string;
  destinatario: string;
  peso: number;
  volume: number;
  motivo: string;
  regiao: string;
  transporteOriginal?: string;
  dataReentrega: string;
};

export type PagamentoAlocacao = {
  perfilPagamentoId: string | null;
  perfilPagamentoNome: string | null;
  semCusto: boolean;
};

export type VeiculoAlocado = {
  veiculoId: string;
  placa: string;
  tipo: TipoVeiculo;
  motorista: string;
  transportadora: string;
  perfilTarifaId?: string | null;
  perfilTarifaNome?: string | null;
};

export type TransporteGrupo = {
  id: string;
  uploadLoteId?: string;
  rota: string;
  regiao: string;
  cidade: string;
  bairro: string;
  remessas: RemessaItem[];
  quantidadeRemessas: number;
  pesoTotal: number;
  volumeTotal: number;
  distanciaKm: number;
  itinerario: string | null;
  itinerarioId?: string | null;
  perfilEsperado: TipoVeiculo;
  status: StatusTransporte;
  veiculoAlocado?: VeiculoAlocado;
  /** Perfil de tarifa usado no pagamento (pode diferir do perfil do veículo alocado). */
  perfilPagamentoId?: string | null;
  perfilPagamentoNome?: string | null;
  /** Perfil de tarifa usado no cálculo do custo previsto (pode diferir do veículo alocado). */
  tipoTarifaCusto?: TipoVeiculo;
  custoPrevisto?: number;
  freteSemCusto?: boolean;
  /** Reentrega com placa exclusiva, sem vínculo a rota de transporte existente. */
  reentregaExclusiva?: boolean;
  isPrioridade?: boolean;
  nivelPrioridade?: NivelPrioridadeTransporte | null;
  /** Transportadora responsável no portal — persiste mesmo sem placa alocada. */
  transportadoraAtribuida?: string;
  horarioExpectativaSaida?: string | null;
  dataTransporte: string;
  mapaGeradoEm?: string | null;
  ultimoMapaLoteId?: string | null;
  temMapaConferenciaReentrega?: boolean;
};

export type Veiculo = {
  id: string;
  placa: string;
  transportadora: string;
  modelo: string;
  ano: number;
  tipo: TipoVeiculo;
  perfilTarifaId?: string | null;
  perfilTarifaNome?: string | null;
  capacidadePeso: number;
  capacidadeVolume: number;
  motorista: string;
  cnhCategoria: string;
  ultimaManutencao: string;
  proximaRevisao: string;
  tipoFrete: TipoFrete;
  pesoAlocado: number;
  disponivel: boolean;
};

export type CustoPorTipo = {
  tipo: TipoVeiculo;
  custoDiaria: number;
};

export type TarifaVeiculo = {
  tipo: TipoVeiculo;
  tipoCarga: TipoCarga;
  custoDiaria: number;
};

export type PerfilVeiculoItem = {
  tipo: TipoVeiculo;
  tipoCarga: TipoCarga;
  nomeExibicao: string;
  pesoMaxKg: number;
  volumeMaxM3: number;
  descricao: string;
};

type PerfilVeiculoBase = Omit<PerfilVeiculoItem, 'tipoCarga'>;

const PERFIS_VEICULO_BASE: PerfilVeiculoBase[] = [
  {
    tipo: 'VUC',
    nomeExibicao: 'VUC',
    pesoMaxKg: 1200,
    volumeMaxM3: 8,
    descricao:
      'Veículo urbano de carga para entregas leves em vias estreitas e centros urbanos.',
  },
  {
    tipo: 'Toco',
    nomeExibicao: 'Toco',
    pesoMaxKg: 6000,
    volumeMaxM3: 25,
    descricao:
      'Caminhão toco para cargas médias em rotas urbanas e intermunicipais.',
  },
  {
    tipo: 'Truck_3_4',
    nomeExibicao: 'Truck 3/4',
    pesoMaxKg: 3500,
    volumeMaxM3: 18,
    descricao:
      'Truck 3/4 versátil para distribuição regional com boa relação custo-capacidade.',
  },
  {
    tipo: 'Carreta',
    nomeExibicao: 'Carreta',
    pesoMaxKg: 10000,
    volumeMaxM3: 45,
    descricao:
      'Carreta para cargas volumosas em rotas de média e longa distância.',
  },
  {
    tipo: 'Bitrem',
    nomeExibicao: 'Bitrem',
    pesoMaxKg: 40000,
    volumeMaxM3: 120,
    descricao:
      'Conjunto bitrem para cargas pesadas e de grande volume em rotas rodoviárias.',
  },
];

const FATOR_CAPACIDADE_REFRIGERADO = 0.85;

function ajustarCapacidadeRefrigerado(valor: number): number {
  return Math.round(valor * FATOR_CAPACIDADE_REFRIGERADO);
}

function montarPerfilPorCarga(
  base: PerfilVeiculoBase,
  tipoCarga: TipoCarga,
): PerfilVeiculoItem {
  if (tipoCarga === 'seco') {
    return { ...base, tipoCarga };
  }

  return {
    ...base,
    tipoCarga,
    pesoMaxKg: ajustarCapacidadeRefrigerado(base.pesoMaxKg),
    volumeMaxM3:
      Math.round(base.volumeMaxM3 * FATOR_CAPACIDADE_REFRIGERADO * 10) / 10,
    descricao: `${base.descricao} Versão refrigerada com baú térmico.`,
  };
}

export const PERFIS_VEICULO_INICIAIS: PerfilVeiculoItem[] =
  PERFIS_VEICULO_BASE.flatMap((base) =>
    (['seco', 'refrigerado'] as TipoCarga[]).map((tipoCarga) =>
      montarPerfilPorCarga(base, tipoCarga),
    ),
  );

export const TARIFAS_VEICULO_INICIAIS: TarifaVeiculo[] = [
  { tipo: 'VUC', tipoCarga: 'seco', custoDiaria: 420 },
  { tipo: 'VUC', tipoCarga: 'refrigerado', custoDiaria: 567 },
  { tipo: 'Toco', tipoCarga: 'seco', custoDiaria: 580 },
  { tipo: 'Toco', tipoCarga: 'refrigerado', custoDiaria: 783 },
  { tipo: 'Truck_3_4', tipoCarga: 'seco', custoDiaria: 720 },
  { tipo: 'Truck_3_4', tipoCarga: 'refrigerado', custoDiaria: 972 },
  { tipo: 'Carreta', tipoCarga: 'seco', custoDiaria: 1150 },
  { tipo: 'Carreta', tipoCarga: 'refrigerado', custoDiaria: 1553 },
  { tipo: 'Bitrem', tipoCarga: 'seco', custoDiaria: 1580 },
  { tipo: 'Bitrem', tipoCarga: 'refrigerado', custoDiaria: 2133 },
];

export function chavePerfilTarifa(
  tipo: TipoVeiculo,
  tipoCarga: TipoCarga,
): string {
  return `${tipoCarga}:${tipo}`;
}

export type TransporteSummary = {
  totalTransportes: number;
  totalRemessas: number;
  transportesPendentes: number;
  placasAlocadas: number;
  custoPrevistoTotal: number;
  transportesComPlaca: number;
  pesoTotalKg: number;
  custoPorTon: number;
  dropsizeMedio: number;
  totalEntregas: number;
  ocupacaoMedia: number;
};

export type CustoDetalhado = {
  custoDiaria: number;
  subtotal: number;
  total: number;
  nivel: NivelCusto;
};

export type TipoCustoAdicional =
  | 'pernoite'
  | 'paletizacao'
  | 'pedagio'
  | 'ajudante'
  | 'hora_extra'
  | 'outros';

export type CustoAdicionalItem = {
  id: string;
  tipo: TipoCustoAdicional;
  descricao: string;
  valor: number;
};

export type StatusCustoFrete = 'pendente' | 'pago' | 'contestado';

export type FiltroStatusCustoFrete = 'todos' | StatusCustoFrete;

export type CustoFreteRealizado = {
  id: string;
  transporteId: string;
  custoDiariaPago: number;
  custosAdicionais: CustoAdicionalItem[];
  totalAdicionais: number;
  totalPago: number;
  status: StatusCustoFrete;
  observacoes?: string;
  dataPagamento?: string;
};

export type CustoFreteItem = {
  custoFrete: CustoFreteRealizado;
  transporte: TransporteGrupo;
  custoPrevisto: number;
  variacaoValor: number;
  variacaoPercentual: number;
  nivelVariacao: NivelCusto;
};

export type CustoFreteSummary = {
  totalPrevisto: number;
  totalPago: number;
  variacaoValor: number;
  variacaoPercentual: number;
  pendentesLancamento: number;
  pesoTotalKg: number;
  custoPorTon: number;
};

export type CustoFreteInsightRanking = {
  label: string;
  valor: number;
  detalhe?: string;
};

export type CustoFreteInsights = {
  transportadoraMaiorCusto: CustoFreteInsightRanking & { transportes: number };
  rotaMaiorVariacao: CustoFreteInsightRanking & {
    variacaoPercentual: number;
  };
  clienteMaiorAdicional: CustoFreteInsightRanking & { rota: string };
  tipoAdicionalMaisFrequente: CustoFreteInsightRanking & {
    tipo: TipoCustoAdicional;
    ocorrencias: number;
  };
  rotaMaiorAdicional: CustoFreteInsightRanking;
  contestados: { quantidade: number; valorTotal: number };
};

export type CustoFreteIndicadores = {
  dropsizeMedio: number;
  ocupacaoMedia: number;
  custoPorKgMedio: number;
  custoPorTonMedio: number;
  custoPorKmMedio: number;
  rankingOcupacaoPorRota: Array<{
    rota: string;
    ocupacao: number;
    cidade: string;
    dropsize: number;
  }>;
  rankingDropsizePorRota: Array<{
    rota: string;
    dropsize: number;
    entregas: number;
  }>;
};

export type RankingTransportadoraCusto = {
  transportadora: string;
  transportes: number;
  totalPago: number;
  pesoTotalKg: number;
  custoPorTon: number;
  percentualTotal: number;
};

export type RankingTipoAdicional = {
  tipo: TipoCustoAdicional;
  label: string;
  ocorrencias: number;
  valorTotal: number;
};

export type CustoFreteGraficoRota = {
  rota: string;
  previsto: number;
  pago: number;
  variacao: number;
};

export type CustoFreteGraficoStatus = {
  status: StatusCustoFrete;
  quantidade: number;
};

export type CustoFreteGraficos = {
  previstoVsPagoPorRota: CustoFreteGraficoRota[];
  distribuicaoStatus: CustoFreteGraficoStatus[];
};

export const TIPO_VEICULO_LABELS: Record<TipoVeiculo, string> = {
  VUC: 'VUC',
  Toco: 'Toco',
  Truck_3_4: 'Truck 3/4',
  Carreta: 'Carreta',
  Bitrem: 'Bitrem',
};

export const TIPO_CARGA_LABELS: Record<TipoCarga, string> = {
  seco: 'Carga Seca',
  refrigerado: 'Refrigerado',
};

export const TIPO_FRETE_LABELS: Record<TipoFrete, string> = {
  fracionado: 'Fracionado',
  lotacao: 'Lotação',
  carga_seca: 'Carga Seca',
  refrigerado: 'Refrigerado',
};

export const STATUS_TRANSPORTE_LABELS: Record<StatusTransporte, string> = {
  PENDENTE: 'Pendente',
  ALOCADO: 'Alocado',
  PARCIAL: 'Parcial',
  EM_SEPARACAO: 'Em Separação',
  SEPARADO: 'Separado',
  EM_CONFERENCIA: 'Em Conferência',
  CONFERIDO: 'Conferido',
  EM_CARREGAMENTO: 'Em Carregamento',
  CARREGADO: 'Carregado',
  EM_VIAGEM: 'Em Viagem',
  VIAGEM_FINALIZADA: 'Viagem Finalizada',
};

export const TIPO_CUSTO_ADICIONAL_LABELS: Record<TipoCustoAdicional, string> = {
  pernoite: 'Pernoite',
  paletizacao: 'Paletização',
  pedagio: 'Pedágio',
  ajudante: 'Ajudante',
  hora_extra: 'Hora Extra',
  outros: 'Outros',
};

export const STATUS_CUSTO_FRETE_LABELS: Record<StatusCustoFrete, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  contestado: 'Contestado',
};

export const AGRUPAMENTO_MAPA_LABELS: Record<AgrupamentoMapa, string> = {
  segregar_clientes: 'Segregar clientes',
  grupos_customizados: 'Grupos personalizados',
};

export const TIPO_ITEM_GRUPO_LABELS: Record<TipoItemGrupoMapa, string> = {
  transporte: 'Transporte',
  cliente: 'Cliente',
  remessa: 'Remessa / NF',
};
