export type ProdutoConferenciaConfigApi = {
  controlaLote: boolean;
  controlaValidade: boolean;
  controlaPeso: boolean;
  pesoVariavel: boolean;
  exigirEtiquetaPesoVariavel: boolean;
  controlaNumeroSerie: boolean;
};

export type PreRecebimentoSituacaoApi =
  | 'agendado'
  | 'aguardando'
  | 'liberado_para_conferencia'
  | 'em_conferencia'
  | 'conferido'
  | 'finalizado'
  | 'cancelado';

export type OperadorDemandaApi = {
  preRecebimentoId: string;
  recebimentoId: string | null;
  unidadeId: string;
  placa: string | null;
  transportadoraNome: string | null;
  situacao: PreRecebimentoSituacaoApi;
  dock: string | null;
  skuCount: number;
  horarioPrevisto: string;
  conferenteId?: number | null;
  conferente?: string | null;
  conferenteMatricula?: string | null;
};

export type ConferenciaItemBlindApi = {
  produtoId: string;
  sku: string;
  descricao: string;
  unidadeMedida: string;
  unidadesPorCaixa: number;
  quantidadeEsperada: number;
  config: ProdutoConferenciaConfigApi;
};

export type ConferenciaConferidoApi = {
  id: string;
  produtoId: string;
  quantidadeRecebida: number;
  unidadeMedida: string;
};

export type ConferenciaConferidoDetalheApi = ConferenciaConferidoApi & {
  sku: string;
  descricao: string;
  unidadesPorCaixa: number;
  config: ProdutoConferenciaConfigApi;
  loteRecebido: string | null;
  validade: string | null;
  pesoRecebido: number | null;
  etiquetaCodigo: string | null;
  pesagemId: string | null;
  recebimentoItemId: string;
  unitizadorCodigo: string | null;
  unitizadorId: string | null;
};

export type ConferenciaContextApi = {
  preRecebimentoId: string;
  recebimentoId: string | null;
  unidadeId: string;
  placa: string | null;
  transportadoraNome: string | null;
  situacao: string;
  recebimentoSituacao: string | null;
  dock: string | null;
  checklistPreenchido: boolean;
  conferenteId?: number | null;
  conferente?: string | null;
  conferenteMatricula?: string | null;
  modoUnitizacao: string;
  exigePaleteConferencia: boolean;
  itens: ConferenciaItemBlindApi[];
  conferidos: ConferenciaConferidoDetalheApi[];
  resumoConferido: ResumoConferidoProdutoApi[];
};

export type ResumoConferidoProdutoApi = {
  produtoId: string;
  qtdContabil: number;
  qtdFisica: number;
  pesoTotal: number | null;
  hasDivergencia: boolean;
};

export type TemperaturaProdutoEtapa = 'inicio' | 'meio' | 'fim';

export type TemperaturaProdutoItemApi = {
  etapa: TemperaturaProdutoEtapa;
  temperatura: number;
  medidoEm: string;
};

export type TemperaturasProdutoApi = {
  recebimentoId: string;
  items: TemperaturaProdutoItemApi[];
};

export type UpsertTemperaturaProdutoPayload = {
  etapa: TemperaturaProdutoEtapa;
  temperatura: number;
};

export type SaveChecklistPayload = {
  lacre?: string;
  tempBau?: number;
  conditions: {
    limpeza: boolean;
    odor: boolean;
    estrutura: boolean;
    vedacao: boolean;
  };
  observacoes?: string;
  photoCount?: number;
};

export type ChecklistRecebimentoApi = {
  id: string;
  recebimentoId: string;
  lacre: string | null;
  tempBau: number | null;
  tempProduto: number | null;
  conditions: {
    limpeza: boolean;
    odor: boolean;
    estrutura: boolean;
    vedacao: boolean;
  };
  observacoes: string | null;
  photoCount: number;
  createdAt: string;
};

export type DocumentoApi = {
  id: string;
  nome: string;
  chave: string;
  mimeType: string;
  tamanho: number;
  entidadeTipo: string | null;
  entidadeId: string | null;
  status: string;
  uploadedBy: number | null;
  createdAt: string;
};

export type ProdutoApi = {
  produtoId: string;
  sku: string;
  descricao: string;
  ean: string | null;
  unidadesPorCaixa: number;
  tipo: string;
  categoria: string;
  shelfLife: number | null;
};

export type RecebimentoApi = {
  id: string;
  preRecebimentoId: string;
  docaId: string | null;
  responsavelId: number;
  situacao: string;
  divergencias?: Array<{
    id: string;
    produtoId: string | null;
    tipoDivergencia: string;
    quantidadeEsperada: number | null;
    quantidadeRecebida: number | null;
    descricao: string | null;
  }>;
};

export type RecebimentoAvariaApi = {
  id: string;
  recebimentoId: string;
  produtoId: string | null;
  tipo: string;
  natureza: string;
  causa: string;
  quantidadeCaixas: number;
  quantidadeUnidades: number;
  lote: string | null;
  validade: string | null;
  numeroSerie: string | null;
  photoCount: number;
  replicado: boolean;
  createdAt: string;
};

export type AuthMeApi = {
  id: number;
  name: string;
  email: string;
  role: string;
  funcionarioId: number | null;
};

export type DocaApi = {
  id: string;
  unidadeId: string;
  codigo: string;
  nome: string;
};

export type IniciarRecebimentoPayload = {
  preRecebimentoId: string;
  docaId?: string;
  responsavelId: number;
};

export type ConferirItemPayload = {
  produtoId: string;
  quantidadeRecebida: number;
  unidadeMedida: string;
  loteRecebido?: string;
  pesoRecebido?: number;
  etiquetaCodigo?: string;
  validade?: string;
  numeroSerie?: string;
  unitizadorCodigo?: string;
  clientConferenceId?: string;
};

export type SubmitAvariaPayload = {
  produtoId?: string;
  lote?: string;
  validade?: string;
  numeroSerie?: string;
  tipo: string;
  natureza: string;
  causa: string;
  quantidadeCaixas: number;
  quantidadeUnidades: number;
  photoCount?: number;
  replicarParaTodos?: boolean;
  skusAlvo?: string[];
};
