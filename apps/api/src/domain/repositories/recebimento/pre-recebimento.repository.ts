import type {
  CreatePreRecebimentoInput,
  OrigemDadosPreRecebimento,
  PreRecebimentoSituacao,
  RecepcionarCarroInput,
  UpdatePreRecebimentoInput,
} from '../../model/recebimento/recebimento.model.js';

export const PRE_RECEBIMENTO_REPOSITORY = 'IPreRecebimentoRepository';

export type ItemPreRecebimentoRecord = {
  id: string;
  preRecebimentoId: string;
  produtoId: string;
  quantidadeEsperada: number;
  unidadeMedida: string;
  unidadesPorCaixa: number;
  loteEsperado: string | null;
  pesoEsperado: number | null;
  validadeEsperada: Date | null;
  createdAt: Date;
};

export type NotaFiscalPreRecebimentoRecord = {
  id: string;
  preRecebimentoId: string;
  numeroNf: string;
  serie: string | null;
  chaveAcesso: string | null;
  numeroRemessa: string | null;
  fornecedorNome: string | null;
  fornecedorDocumento: string | null;
  pesoTotal: number | null;
  volumeTotal: number | null;
  observacao: string | null;
  createdAt: Date;
};

export type PreRecebimentoRecord = {
  id: string;
  unidadeId: string;
  transportadoraNome: string | null;
  placa: string | null;
  motoristaNome: string | null;
  motoristaTelefone: string | null;
  grauPrioridade: string | null;
  numeroOcr: string | null;
  numeroTransporte: string | null;
  origemDados: OrigemDadosPreRecebimento;
  origem: string | null;
  horarioPrevisto: Date;
  observacao: string | null;
  quantidadePaletesEsperada: number | null;
  numeroTermoPalete: string | null;
  situacao: PreRecebimentoSituacao;
  dataChegada: Date | null;
  docaId: string | null;
  rastreioToken: string | null;
  userId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RastreioStatusRecord = {
  placa: string | null;
  transportadoraNome: string | null;
  situacao: PreRecebimentoSituacao;
  docaNome: string | null;
  horarioPrevisto: Date;
  dataChegada: Date | null;
  unidadeNome: string;
};

export type PreRecebimentoWithItens = PreRecebimentoRecord & {
  itens: ItemPreRecebimentoRecord[];
  notasFiscais: NotaFiscalPreRecebimentoRecord[];
};

export type ListPreRecebimentosFilter = {
  page?: number;
  limit?: number;
  unidadeId: string;
  situacao?: PreRecebimentoSituacao;
  transportadoraNome?: string;
  dataInicio?: Date;
  dataFim?: Date;
};

export type ListPreRecebimentosResult = {
  items: PreRecebimentoRecord[];
  total: number;
  page: number;
  limit: number;
};

export type PreRecebimentoDetalheItemEsperado = {
  id: string;
  produtoId: string;
  quantidadeEsperada: number;
  unidadeMedida: string;
  loteEsperado: string | null;
  pesoEsperado: number | null;
  validadeEsperada: string | null;
  unidadesPorCaixa: number;
};

export type PreRecebimentoDetalheItemRecebido = {
  id: string;
  produtoId: string;
  quantidadeRecebida: number;
  unidadeMedida: string;
  loteRecebido: string | null;
  pesoRecebido: number | null;
  validade: string | null;
  numeroSerie: string | null;
  unitizadorId: string | null;
  unitizadorCodigo: string | null;
};

export type PreRecebimentoDetalheDivergencia = {
  id: string;
  produtoId: string | null;
  tipoDivergencia: string;
  quantidadeEsperada: number | null;
  quantidadeRecebida: number | null;
  descricao: string | null;
};

export type PreRecebimentoDetalheAvaria = {
  id: string;
  recebimentoId: string;
  produtoId: string | null;
  tipo: string;
  natureza: string;
  causa: string;
  quantidadeCaixas: number;
  quantidadeUnidades: number;
  lote: string | null;
  photoCount: number;
  replicado: boolean;
  createdAt: string;
};

export type PreRecebimentoDetalheProduto = {
  produtoId: string;
  sku: string;
  descricao: string;
  ean: string | null;
  unidadesPorCaixa: number;
};

export type PreRecebimentoDetalheRecord = {
  preRecebimento: {
    id: string;
    unidadeId: string;
    transportadoraNome: string | null;
    placa: string | null;
    motoristaNome: string | null;
    motoristaTelefone: string | null;
    grauPrioridade: string | null;
    numeroOcr: string | null;
    numeroTransporte: string | null;
    origemDados: string;
    origem: string | null;
    horarioPrevisto: string;
    observacao: string | null;
    quantidadePaletesEsperada: number | null;
    numeroTermoPalete: string | null;
    situacao: string;
    dataChegada: string | null;
    docaId: string | null;
    createdAt: string;
    updatedAt: string;
    itens: PreRecebimentoDetalheItemEsperado[];
  };
  recebimento: {
    id: string;
    preRecebimentoId: string;
    docaId: string | null;
    responsavelId: number;
    conferenteNome: string | null;
    conferenteMatricula: string | null;
    dataInicio: string;
    dataFim: string | null;
    situacao: string;
    quantidadePaletes: number | null;
    modoUnitizacao: string;
    createdAt: string;
    updatedAt: string;
    itens: PreRecebimentoDetalheItemRecebido[];
    divergencias: PreRecebimentoDetalheDivergencia[];
  } | null;
  checklist: {
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
  } | null;
  avarias: PreRecebimentoDetalheAvaria[];
  produtos: PreRecebimentoDetalheProduto[];
  numDivergencias: number;
};

export interface IPreRecebimentoRepository {
  create(
    data: CreatePreRecebimentoInput,
    userId: number | null,
  ): Promise<PreRecebimentoWithItens>;
  update(
    id: string,
    data: UpdatePreRecebimentoInput,
  ): Promise<PreRecebimentoWithItens | null>;
  findById(id: string): Promise<PreRecebimentoWithItens | null>;
  findDetalheById(id: string): Promise<PreRecebimentoDetalheRecord | null>;
  list(filter: ListPreRecebimentosFilter): Promise<ListPreRecebimentosResult>;
  updateSituacao(
    id: string,
    situacao: PreRecebimentoSituacao,
    dataChegada?: Date | null,
  ): Promise<PreRecebimentoRecord | null>;
  liberarConferencia(
    id: string,
    docaId: string,
    dataChegada: Date,
  ): Promise<PreRecebimentoRecord | null>;
  recepcionarCarro(
    id: string,
    data: RecepcionarCarroInput,
  ): Promise<PreRecebimentoRecord | null>;
  cancel(id: string): Promise<PreRecebimentoRecord | null>;
  gerarLinkRastreio(
    id: string,
    options?: { regenerar?: boolean },
  ): Promise<{ token: string } | null>;
  findRastreioByToken(token: string): Promise<RastreioStatusRecord | null>;
  addManualExpectedItem(
    preRecebimentoId: string,
    produtoId: string,
  ): Promise<void>;
  removeManualExpectedItem(
    preRecebimentoId: string,
    produtoId: string,
  ): Promise<boolean>;
}
