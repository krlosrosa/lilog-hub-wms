export type ProdutoConferenciaConfigApi = {
  controlaLote: boolean;
  controlaValidade: boolean;
  controlaPeso: boolean;
  pesoVariavel: boolean;
  controlaNumeroSerie: boolean;
};

export type OperadorDemandaApi = {
  preRecebimentoId: string;
  recebimentoId: string | null;
  unidadeId: string;
  placa: string;
  transportadoraId: string;
  situacao: string;
  dock: string | null;
  skuCount: number;
  horarioPrevisto: string;
};

export type ConferenciaItemBlindApi = {
  produtoId: string;
  sku: string;
  descricao: string;
  unidadeMedida: string;
  unidadesPorCaixa: number;
  config: ProdutoConferenciaConfigApi;
};

export type ConferenciaConferidoApi = {
  id: string;
  produtoId: string;
  quantidadeRecebida: number;
  unidadeMedida: string;
};

export type ConferenciaContextApi = {
  preRecebimentoId: string;
  recebimentoId: string | null;
  unidadeId: string;
  placa: string;
  transportadoraId: string;
  situacao: string;
  recebimentoSituacao: string | null;
  dock: string | null;
  checklistPreenchido: boolean;
  itens: ConferenciaItemBlindApi[];
  conferidos: ConferenciaConferidoApi[];
};

export type SaveChecklistPayload = {
  lacre?: string;
  tempBau?: number;
  tempProduto?: number;
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
  id: string;
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
  validade?: string;
  numeroSerie?: string;
};

export type SubmitAvariaPayload = {
  produtoId?: string;
  tipo: string;
  natureza: string;
  causa: string;
  quantidadeCaixas: number;
  quantidadeUnidades: number;
  photoCount?: number;
  replicarParaTodos?: boolean;
  skusAlvo?: string[];
};
