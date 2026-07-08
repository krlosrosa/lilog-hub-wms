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
  horarioPrevisto: Date;
  observacao: string | null;
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
}
