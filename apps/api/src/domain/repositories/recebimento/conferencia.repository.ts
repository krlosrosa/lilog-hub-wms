import type {
  CreateChecklistRecebimentoInput,
  PreRecebimentoSituacao,
  RecebimentoSituacao,
} from '../../model/recebimento/recebimento.model.js';



export const CONFERENCIA_REPOSITORY = 'IConferenciaRepository';



export type ProdutoConferenciaConfigRecord = {

  controlaLote: boolean;

  controlaValidade: boolean;

  controlaPeso: boolean;

  pesoVariavel: boolean;

  controlaNumeroSerie: boolean;

};



export type OperadorDemandaRecord = {

  preRecebimentoId: string;

  recebimentoId: string | null;

  unidadeId: string;

  placa: string;

  transportadoraId: string;

  situacao: PreRecebimentoSituacao;

  dock: string | null;

  skuCount: number;

  horarioPrevisto: Date;

};



export type ConferenciaItemBlindRecord = {

  produtoId: string;

  sku: string;

  descricao: string;

  unidadeMedida: string;

  unidadesPorCaixa: number;

  config: ProdutoConferenciaConfigRecord;

};



export type ConferenciaConferidoRecord = {

  id: string;

  produtoId: string;

  quantidadeRecebida: number;

  unidadeMedida: string;

};



export type ChecklistRecebimentoRecord = {
  id: string;
  recebimentoId: string;
  lacre: string | null;
  tempBau: number | null;
  tempProduto: number | null;
  condicaoLimpeza: boolean;
  condicaoOdor: boolean;
  condicaoEstrutura: boolean;
  condicaoVedacao: boolean;
  observacoes: string | null;
  photoCount: number;
  createdAt: Date;
};

export type ConferenciaContextRecord = {
  preRecebimentoId: string;
  recebimentoId: string | null;
  unidadeId: string;
  placa: string;
  transportadoraId: string;
  situacao: PreRecebimentoSituacao;
  recebimentoSituacao: RecebimentoSituacao | null;
  dock: string | null;
  checklistPreenchido: boolean;
  itens: ConferenciaItemBlindRecord[];
  conferidos: ConferenciaConferidoRecord[];
};



export type ListOperadorDemandasFilter = {

  unidadeId: string;

};



export interface IConferenciaRepository {
  listOperadorDemandas(
    filter: ListOperadorDemandasFilter,
  ): Promise<OperadorDemandaRecord[]>;

  getConferenciaContext(
    preRecebimentoId: string,
  ): Promise<ConferenciaContextRecord | null>;

  findChecklistByRecebimentoId(
    recebimentoId: string,
  ): Promise<ChecklistRecebimentoRecord | null>;

  createChecklist(
    recebimentoId: string,
    data: CreateChecklistRecebimentoInput,
  ): Promise<ChecklistRecebimentoRecord>;
}


