export type ItemPreRecebimentoPayload = {
  produtoId: string;
  quantidadeEsperada: number;
  unidadeMedida: string;
  loteEsperado?: string;
  pesoEsperado?: number;
  validadeEsperada?: string;
};

export type CreatePreRecebimentoPayload = {
  unidadeId: string;
  transportadoraId: string;
  placa: string;
  horarioPrevisto: string;
  observacao?: string;
  itens: ItemPreRecebimentoPayload[];
};

export type ItemPreRecebimentoApi = ItemPreRecebimentoPayload & {
  id: string;
  unidadesPorCaixa: number;
};

export type PreRecebimentoSituacaoApi =
  | 'agendado'
  | 'veiculo_chegou'
  | 'em_recebimento'
  | 'aguardando_aprovacao'
  | 'aprovado'
  | 'finalizado'
  | 'cancelado';

export type PreRecebimentoApi = {
  id: string;
  unidadeId: string;
  transportadoraId: string;
  placa: string;
  horarioPrevisto: string;
  observacao: string | null;
  situacao: PreRecebimentoSituacaoApi;
  dataChegada: string | null;
  itens?: ItemPreRecebimentoApi[];
  createdAt: string;
  updatedAt: string;
};

export type ListPreRecebimentosParams = {
  page?: number;
  limit?: number;
  unidadeId: string;
  situacao?: PreRecebimentoSituacaoApi;
  transportadoraId?: string;
  dataInicio?: string;
  dataFim?: string;
};

export type ListPreRecebimentosApiResponse = {
  items: PreRecebimentoApi[];
  total: number;
  page: number;
  limit: number;
};

export type RecebimentoSituacaoApi =
  | 'em_recebimento'
  | 'aguardando_aprovacao'
  | 'aprovado'
  | 'finalizado'
  | 'cancelado';

export type TipoDivergenciaApi =
  | 'quantidade_maior'
  | 'quantidade_menor'
  | 'produto_nao_esperado'
  | 'produto_ausente'
  | 'divergencia_lote'
  | 'divergencia_peso'
  | 'divergencia_validade';

export type ItemRecebimentoApi = {
  id: string;
  produtoId: string;
  quantidadeRecebida: number;
  unidadeMedida: string;
  loteRecebido: string | null;
  pesoRecebido: number | null;
  validade: string | null;
  numeroSerie: string | null;
};

export type DivergenciaRecebimentoApi = {
  id: string;
  produtoId: string | null;
  tipoDivergencia: TipoDivergenciaApi;
  quantidadeEsperada: number | null;
  quantidadeRecebida: number | null;
  descricao: string | null;
};

export type RecebimentoApi = {
  id: string;
  preRecebimentoId: string;
  docaId: string | null;
  responsavelId: number;
  dataInicio: string;
  dataFim: string | null;
  situacao: RecebimentoSituacaoApi;
  itens?: ItemRecebimentoApi[];
  divergencias?: DivergenciaRecebimentoApi[];
  createdAt: string;
  updatedAt: string;
};

export type IniciarRecebimentoPayload = {
  preRecebimentoId: string;
  docaId?: string;
  responsavelId: number;
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
