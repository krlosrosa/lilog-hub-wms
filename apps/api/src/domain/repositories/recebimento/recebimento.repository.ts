import type {
  ConferirItemInput,
  IniciarRecebimentoInput,
  RecebimentoSituacao,
  TipoDivergencia,
} from '../../model/recebimento/recebimento.model.js';
import type { PreRecebimentoSituacao } from '../../model/recebimento/recebimento.model.js';

export const RECEBIMENTO_REPOSITORY = 'IRecebimentoRepository';

export type RecebimentoRecord = {
  id: string;
  preRecebimentoId: string;
  docaId: string | null;
  responsavelId: number;
  dataInicio: Date;
  dataFim: Date | null;
  situacao: RecebimentoSituacao;
  modoUnitizacao: string;
  userId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ItemRecebimentoRecord = {
  id: string;
  recebimentoId: string;
  produtoId: string;
  quantidadeRecebida: number;
  unidadeMedida: string;
  loteRecebido: string | null;
  pesoRecebido: number | null;
  validade: Date | null;
  numeroSerie: string | null;
  unitizadorId: string | null;
  createdAt: Date;
};

export type DivergenciaRecebimentoRecord = {
  id: string;
  recebimentoId: string;
  produtoId: string | null;
  tipoDivergencia: TipoDivergencia;
  quantidadeEsperada: number | null;
  quantidadeRecebida: number | null;
  descricao: string | null;
  createdAt: Date;
};

export type RecebimentoWithDetails = RecebimentoRecord & {
  itens: ItemRecebimentoRecord[];
  divergencias: DivergenciaRecebimentoRecord[];
};

export type CreateDivergenciaInput = {
  recebimentoId: string;
  produtoId?: string | null;
  tipoDivergencia: TipoDivergencia;
  quantidadeEsperada?: number | null;
  quantidadeRecebida?: number | null;
  descricao?: string | null;
};

export type ListRecebimentosFilter = {
  page?: number;
  limit?: number;
  unidadeId: string;
  situacao?: RecebimentoSituacao | PreRecebimentoSituacao;
  transportadoraId?: string;
  responsavelId?: number;
  docaId?: string;
  dataInicio?: Date;
  dataFim?: Date;
};

export type ListRecebimentosResult = {
  items: Array<
    RecebimentoRecord & {
      unidadeId: string;
      transportadoraId: string;
      placa: string;
      preRecebimentoSituacao: PreRecebimentoSituacao;
    }
  >;
  total: number;
  page: number;
  limit: number;
};

export interface IRecebimentoRepository {
  create(
    data: IniciarRecebimentoInput,
    userId: number | null,
    modoUnitizacao: string,
  ): Promise<RecebimentoRecord>;
  findById(id: string): Promise<RecebimentoWithDetails | null>;
  findByPreRecebimentoId(
    preRecebimentoId: string,
  ): Promise<RecebimentoWithDetails | null>;
  list(filter: ListRecebimentosFilter): Promise<ListRecebimentosResult>;
  addItem(
    recebimentoId: string,
    data: ConferirItemInput,
    unitizadorId?: string | null,
  ): Promise<ItemRecebimentoRecord>;
  findItemsByRecebimento(
    recebimentoId: string,
  ): Promise<ItemRecebimentoRecord[]>;
  createDivergencia(
    data: CreateDivergenciaInput,
  ): Promise<DivergenciaRecebimentoRecord>;
  findDivergencias(
    recebimentoId: string,
  ): Promise<DivergenciaRecebimentoRecord[]>;
  clearDivergencias(recebimentoId: string): Promise<void>;
  updateStatus(
    id: string,
    situacao: RecebimentoSituacao,
    dataFim?: Date | null,
  ): Promise<RecebimentoRecord | null>;
}
