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
  quantidadePaletes: number | null;
  teveSobreposicaoCarga: boolean;
  modoUnitizacao: string;
  userId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ItemRecebimentoRecord = {
  id: string;
  recebimentoId: string;
  unidadeId: string;
  produtoId: string;
  quantidadeRecebida: number;
  unidadeMedida: string;
  loteRecebido: string | null;
  pesoRecebido: number | null;
  validade: Date | null;
  numeroSerie: string | null;
  unitizadorId: string | null;
  unitizadorCodigo?: string | null;
  createdAt: Date;
};

export type PesagemRecebimentoRecord = {
  id: string;
  recebimentoItemId: string;
  unidadeId: string;
  sequenciaCaixa: number;
  etiquetaCodigo: string | null;
  pesoKg: number;
  clientConferenceId?: string | null;
  createdAt: Date;
};

export type AddItemRecebimentoResult = {
  item: ItemRecebimentoRecord;
  pesagem: PesagemRecebimentoRecord | null;
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
  transportadoraNome?: string;
  responsavelId?: number;
  docaId?: string;
  dataInicio?: Date;
  dataFim?: Date;
};

export type ListRecebimentosResult = {
  items: Array<
    RecebimentoRecord & {
      unidadeId: string;
      transportadoraNome: string | null;
      placa: string | null;
      preRecebimentoSituacao: PreRecebimentoSituacao;
    }
  >;
  total: number;
  page: number;
  limit: number;
};

export type RemoveItemsByProdutoResult = {
  produtoId: string;
  removedCount: number;
};

export type RemoveItemConferenciaByIdResult = {
  itemId: string;
  removed: boolean;
  produtoId?: string;
};

export type RemoveItensConferenciaByUnitizadorResult = {
  unitizadorId: string;
  removedCount: number;
};

export type RemovePesagemRecebimentoResult = {
  pesagemId: string;
  removed: boolean;
  produtoId?: string;
  recebimentoItemId?: string;
  itemRemoved?: boolean;
};

export type AddItemRecebimentoOptions = {
  unitizadorId?: string | null;
  pesoVariavel?: boolean;
  conferidoPorId?: number | null;
  clientConferenceId?: string | null;
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
    unidadeId: string,
    data: ConferirItemInput,
    options?: AddItemRecebimentoOptions,
  ): Promise<AddItemRecebimentoResult>;
  findPesagemByEtiqueta(
    unidadeId: string,
    etiquetaCodigo: string,
  ): Promise<PesagemRecebimentoRecord | null>;
  removePesagem(
    recebimentoId: string,
    pesagemId: string,
  ): Promise<RemovePesagemRecebimentoResult>;
  removeItemsByProduto(
    recebimentoId: string,
    produtoId: string,
  ): Promise<RemoveItemsByProdutoResult>;
  removeItemConferenciaById(
    recebimentoId: string,
    itemId: string,
  ): Promise<RemoveItemConferenciaByIdResult>;
  removeItensConferenciaByUnitizador(
    recebimentoId: string,
    unitizadorId: string,
    produtoId?: string,
  ): Promise<RemoveItensConferenciaByUnitizadorResult>;
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
    quantidadePaletes?: number | null,
    teveSobreposicaoCarga?: boolean,
  ): Promise<RecebimentoRecord | null>;
}
