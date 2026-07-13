import type {
  CreateChecklistRecebimentoInput,
  PreRecebimentoSituacao,
  RecebimentoSituacao,
  UpsertTemperaturaProdutoRecebimentoInput,
} from '../../model/recebimento/recebimento.model.js';



export const CONFERENCIA_REPOSITORY = 'IConferenciaRepository';



export type ProdutoConferenciaConfigRecord = {

  controlaLote: boolean;

  controlaValidade: boolean;

  controlaPeso: boolean;

  pesoVariavel: boolean;

  exigirEtiquetaPesoVariavel: boolean;

  controlaNumeroSerie: boolean;

};



export type OperadorDemandaRecord = {

  preRecebimentoId: string;

  recebimentoId: string | null;

  unidadeId: string;

  placa: string | null;

  transportadoraNome: string | null;

  situacao: PreRecebimentoSituacao;

  dock: string | null;

  skuCount: number;

  horarioPrevisto: Date;

  conferenteId: number | null;

  conferente: string | null;

  conferenteMatricula: string | null;

  alocacaoFuncionarioId: number | null;

};



export type ConferenciaItemBlindRecord = {

  produtoId: string;

  sku: string;

  descricao: string;

  unidadeMedida: string;

  unidadesPorCaixa: number;

  quantidadeEsperada: number;

  config: ProdutoConferenciaConfigRecord;

};



export type ConferenciaConferidoRecord = {
  id: string;
  produtoId: string;
  sku: string;
  descricao: string;
  unidadesPorCaixa: number;
  config: ProdutoConferenciaConfigRecord;
  quantidadeRecebida: number;
  unidadeMedida: string;
  loteRecebido: string | null;
  validade: Date | null;
  pesoRecebido: number | null;
  etiquetaCodigo: string | null;
  pesagemId: string | null;
  recebimentoItemId: string;
  unitizadorCodigo: string | null;
  unitizadorId: string | null;
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
  conditions: Record<string, boolean>;
  observacoes: string | null;
  photoCount: number;
  createdAt: Date;
};

export type TemperaturaProdutoRecebimentoRecord = {
  id: string;
  recebimentoId: string;
  etapa: 'inicio' | 'meio' | 'fim';
  temperatura: number;
  medidoEm: Date;
  operatorId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ResumoConferidoProdutoRecord = {
  produtoId: string;
  qtdContabil: number;
  qtdFisica: number;
  pesoTotal: number | null;
  hasDivergencia: boolean;
};

export type ConferenciaContextRecord = {
  preRecebimentoId: string;
  recebimentoId: string | null;
  unidadeId: string;
  placa: string | null;
  transportadoraNome: string | null;
  situacao: PreRecebimentoSituacao;
  recebimentoSituacao: RecebimentoSituacao | null;
  dock: string | null;
  checklistPreenchido: boolean;
  conferenteId: number | null;
  conferente: string | null;
  conferenteMatricula: string | null;
  modoUnitizacao: string;
  itens: ConferenciaItemBlindRecord[];
  conferidos: ConferenciaConferidoRecord[];
  resumoConferido: ResumoConferidoProdutoRecord[];
};



export type ListOperadorDemandasFilter = {

  unidadeId: string;

  /** funcionarioId do usuário logado — filtra em_conferencia ao conferente */
  responsavelId?: number;

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

  listTemperaturasProduto(
    recebimentoId: string,
  ): Promise<TemperaturaProdutoRecebimentoRecord[]>;

  upsertTemperaturaProduto(
    recebimentoId: string,
    data: UpsertTemperaturaProdutoRecebimentoInput,
    operatorId: number | null,
  ): Promise<TemperaturaProdutoRecebimentoRecord>;
}


