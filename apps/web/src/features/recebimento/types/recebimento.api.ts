export type ItemPreRecebimentoPayload = {
  produtoId: string;
  quantidadeEsperada: number;
  unidadeMedida: string;
  loteEsperado?: string;
  pesoEsperado?: number;
  validadeEsperada?: string;
};

export type NotaFiscalPreRecebimentoPayload = {
  numeroNf: string;
  serie?: string;
  chaveAcesso?: string;
  numeroRemessa?: string;
  fornecedorNome?: string;
  fornecedorDocumento?: string;
  pesoTotal?: number;
  volumeTotal?: number;
  observacao?: string;
};

export type OrigemDadosPreRecebimentoApi =
  | 'manual'
  | 'xlsx'
  | 'xml'
  | 'ocr';

export type CreatePreRecebimentoPayload = {
  unidadeId: string;
  transportadoraNome?: string;
  placa?: string;
  numeroOcr?: string;
  numeroTransporte?: string;
  origemDados?: OrigemDadosPreRecebimentoApi;
  origem?: string;
  horarioPrevisto: string;
  observacao?: string;
  quantidadePaletesEsperada?: number;
  itens: ItemPreRecebimentoPayload[];
  notasFiscais?: NotaFiscalPreRecebimentoPayload[];
};

export type ItemPreRecebimentoApi = ItemPreRecebimentoPayload & {
  id: string;
  unidadesPorCaixa: number;
};

export type NotaFiscalPreRecebimentoApi = NotaFiscalPreRecebimentoPayload & {
  id: string;
  createdAt: string;
};

export type PreRecebimentoSituacaoApi =
  | 'agendado'
  | 'aguardando'
  | 'liberado_para_conferencia'
  | 'em_conferencia'
  | 'impedido'
  | 'conferido'
  | 'finalizado'
  | 'cancelado';

export type GrauPrioridadePreRecebimentoApi =
  | 'baixo'
  | 'normal'
  | 'alto'
  | 'urgente';

export type RecepcionarCarroPayload = {
  motoristaNome: string;
  placa: string;
  motoristaTelefone?: string;
  dataChegada?: string;
  grauPrioridade?: GrauPrioridadePreRecebimentoApi;
  quantidadePaletesEsperada?: number;
  numeroTermoPalete?: string;
};

export type PreRecebimentoApi = {
  id: string;
  unidadeId: string;
  transportadoraNome: string | null;
  placa: string | null;
  motoristaNome: string | null;
  motoristaTelefone: string | null;
  grauPrioridade: GrauPrioridadePreRecebimentoApi | null;
  numeroOcr: string | null;
  numeroTransporte: string | null;
  origemDados: OrigemDadosPreRecebimentoApi;
  origem: string | null;
  horarioPrevisto: string;
  observacao: string | null;
  quantidadePaletesEsperada: number | null;
  numeroTermoPalete: string | null;
  situacao: PreRecebimentoSituacaoApi;
  dataChegada: string | null;
  docaId: string | null;
  itens?: ItemPreRecebimentoApi[];
  notasFiscais?: NotaFiscalPreRecebimentoApi[];
  createdAt: string;
  updatedAt: string;
};

export type ListPreRecebimentosParams = {
  page?: number;
  limit?: number;
  unidadeId: string;
  situacao?: PreRecebimentoSituacaoApi;
  transportadoraNome?: string;
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
  | 'em_conferencia'
  | 'conferido'
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
  unitizadorId?: string | null;
  unitizadorCodigo?: string | null;
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
  conferenteNome?: string | null;
  conferenteMatricula?: string | null;
  dataInicio: string;
  dataFim: string | null;
  situacao: RecebimentoSituacaoApi;
  quantidadePaletes?: number | null;
  modoUnitizacao?: string;
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

export type TemperaturaProdutoEtapaApi = 'inicio' | 'meio' | 'fim';

export type TemperaturaProdutoItemApi = {
  etapa: TemperaturaProdutoEtapaApi;
  temperatura: number;
  medidoEm: string;
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

export type GerarLinkRastreioResponse = {
  token: string;
  url: string;
};

export type PreRecebimentoDetalheProdutoApi = {
  produtoId: string;
  sku: string;
  descricao: string;
  ean: string | null;
  unidadesPorCaixa: number;
};

export type ImpedimentoDetalheApi = {
  id: string;
  tipo: string;
  descricao: string;
  photoCount: number;
  registradoPorId: number | null;
  registradoPorNome: string | null;
  registradoPorMatricula: string | null;
  registradoEm: string;
};

export type PreRecebimentoDetalheApi = {
  preRecebimento: PreRecebimentoApi & {
    itens: ItemPreRecebimentoApi[];
  };
  recebimento: RecebimentoApi | null;
  checklist: ChecklistRecebimentoApi | null;
  temperaturasProduto: TemperaturaProdutoItemApi[];
  avarias: RecebimentoAvariaApi[];
  produtos: PreRecebimentoDetalheProdutoApi[];
  numDivergencias: number;
  impedimento: ImpedimentoDetalheApi | null;
};
