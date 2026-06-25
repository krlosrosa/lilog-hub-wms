import type {
  CreatePreRecebimentoInput,
  PreRecebimentoSituacao,
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

export type PreRecebimentoRecord = {
  id: string;
  unidadeId: string;
  transportadoraId: string;
  placa: string;
  horarioPrevisto: Date;
  observacao: string | null;
  situacao: PreRecebimentoSituacao;
  dataChegada: Date | null;
  userId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PreRecebimentoWithItens = PreRecebimentoRecord & {
  itens: ItemPreRecebimentoRecord[];
};

export type ListPreRecebimentosFilter = {
  page?: number;
  limit?: number;
  unidadeId: string;
  situacao?: PreRecebimentoSituacao;
  transportadoraId?: string;
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
  cancel(id: string): Promise<PreRecebimentoRecord | null>;
}
