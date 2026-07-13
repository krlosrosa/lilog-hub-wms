import type {
  CncItemTipo,
  CncOpcoesImpressao,
  CncOrigem,
  CncResponsavel,
  CncSituacao,
  CncSubtipoOcorrencia,
  CncTratativaStatus,
  CncTratativaTipo,
} from '../../model/cnc/cnc.model.js';

export const CNC_REPOSITORY = 'ICncRepository';

export type CncItemRecord = {
  id: string;
  cncId: string;
  tipo: CncItemTipo;
  referenciaId: string;
  produtoId: string | null;
  sku: string | null;
  descricaoProduto: string | null;
  subtipoOcorrencia: CncSubtipoOcorrencia | null;
  quantidadeEsperada: number | null;
  quantidadeRecebida: number | null;
  quantidadeDivergente: number | null;
  quantidadeCaixas: number | null;
  quantidadeUnidades: number | null;
  unidadeMedida: string | null;
  loteEsperado: string | null;
  loteRecebido: string | null;
  validadeEsperada: Date | null;
  validadeRecebida: Date | null;
  pesoEsperado: number | null;
  pesoRecebido: number | null;
  naturezaAvaria: string | null;
  causaAvaria: string | null;
  tipoAvaria: string | null;
  shelfLifeDias: number | null;
  descricaoDetalhe: string | null;
  responsavelSugerido: CncResponsavel | null;
  createdAt: Date;
};

export type CncEventoRecord = {
  id: string;
  cncId: string;
  tipoEvento: string;
  situacaoAnterior: string | null;
  situacaoNova: string | null;
  descricao: string | null;
  metadata: Record<string, unknown>;
  criadoPorUserId: number | null;
  createdAt: Date;
};

export type CncTratativaRecord = {
  id: string;
  cncId: string;
  tipo: CncTratativaTipo;
  descricao: string;
  responsavelTipo: CncResponsavel;
  prazo: Date | null;
  concluidaEm: Date | null;
  concluidaPorUserId: number | null;
  status: CncTratativaStatus;
  criadoPorUserId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CncRecord = {
  id: string;
  numero: string;
  origem: CncOrigem;
  origemId: string;
  unidadeId: string;
  responsavel: CncResponsavel;
  responsavelId: string | null;
  descricao: string | null;
  observacao: string | null;
  situacao: CncSituacao;
  solicitanteId: number;
  analistaId: number | null;
  iniciadoEm: Date | null;
  encerradoEm: Date | null;
  encerradoPorUserId: number | null;
  valorDebito: number | null;
  opcoesImpressao: CncOpcoesImpressao | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CncWithItens = CncRecord & {
  itens: CncItemRecord[];
};

export type CncDetalhe = CncWithItens & {
  tratativas: CncTratativaRecord[];
  eventos: CncEventoRecord[];
};

export type CreateCncItemInput = {
  tipo: CncItemTipo;
  referenciaId: string;
  produtoId?: string | null;
  sku?: string | null;
  descricaoProduto?: string | null;
  subtipoOcorrencia?: CncSubtipoOcorrencia | null;
  quantidadeEsperada?: number | null;
  quantidadeRecebida?: number | null;
  quantidadeDivergente?: number | null;
  quantidadeCaixas?: number | null;
  quantidadeUnidades?: number | null;
  unidadeMedida?: string | null;
  loteEsperado?: string | null;
  loteRecebido?: string | null;
  validadeEsperada?: Date | null;
  validadeRecebida?: Date | null;
  pesoEsperado?: number | null;
  pesoRecebido?: number | null;
  naturezaAvaria?: string | null;
  causaAvaria?: string | null;
  tipoAvaria?: string | null;
  shelfLifeDias?: number | null;
  descricaoDetalhe?: string | null;
  responsavelSugerido?: CncResponsavel | null;
};

export type CreateCncInput = {
  numero: string;
  origem: CncOrigem;
  origemId: string;
  unidadeId: string;
  responsavel: CncResponsavel;
  responsavelId?: string | null;
  descricao?: string | null;
  solicitanteId: number;
  itens: CreateCncItemInput[];
};

export type ListCncsFilter = {
  page?: number;
  limit?: number;
  unidadeId: string;
  situacao?: CncSituacao;
  origemId?: string;
};

export type ListCncsResult = {
  items: CncRecord[];
  total: number;
  page: number;
  limit: number;
};

export type CncItemListRecord = CncItemRecord & {
  cncNumero: string;
  cncSituacao: CncSituacao;
};

export type ListCncItensFilter = {
  page?: number;
  limit?: number;
  unidadeId: string;
  dataInicio: string;
  dataFim: string;
  situacao?: CncSituacao;
  tipo?: CncItemTipo;
};

export type ListCncItensResult = {
  items: CncItemListRecord[];
  total: number;
  page: number;
  limit: number;
};

export type IniciarAnaliseCncInput = {
  analistaId: number;
  iniciadoEm: Date;
};

export type EncerrarCncInput = {
  encerradoPorUserId: number;
  encerradoEm: Date;
  responsavel?: CncResponsavel;
  responsavelId?: string | null;
  valorDebito?: number | null;
  observacao?: string | null;
};

export type CancelarCncInput = {
  encerradoPorUserId: number;
  encerradoEm: Date;
};

export type CreateCncTratativaInput = {
  cncId: string;
  tipo: CncTratativaTipo;
  descricao: string;
  responsavelTipo: CncResponsavel;
  prazo?: Date | null;
  criadoPorUserId: number | null;
};

export type ConcluirCncTratativaInput = {
  concluidaPorUserId: number;
  concluidaEm: Date;
};

export type UpdateObservacaoCncInput = {
  observacao: string | null;
};

export type UpdateOpcoesImpressaoCncInput = {
  opcoesImpressao: CncOpcoesImpressao;
};

export type UpdateCncItemInput = {
  quantidadeEsperada?: number | null;
  quantidadeRecebida?: number | null;
  quantidadeDivergente?: number | null;
  pesoEsperado?: number | null;
  pesoRecebido?: number | null;
};

export type AddCncEventoInput = {
  cncId: string;
  tipoEvento: string;
  situacaoAnterior?: string | null;
  situacaoNova?: string | null;
  descricao?: string | null;
  metadata?: Record<string, unknown>;
  criadoPorUserId?: number | null;
};

export interface ICncRepository {
  create(data: CreateCncInput): Promise<CncWithItens>;
  findById(id: string): Promise<CncDetalhe | null>;
  findByOrigem(origem: CncOrigem, origemId: string): Promise<CncWithItens | null>;
  countByYear(year: number): Promise<number>;
  list(filter: ListCncsFilter): Promise<ListCncsResult>;
  listItens(filter: ListCncItensFilter): Promise<ListCncItensResult>;
  iniciarAnalise(
    id: string,
    data: IniciarAnaliseCncInput,
  ): Promise<CncRecord | null>;
  encerrar(id: string, data: EncerrarCncInput): Promise<CncRecord | null>;
  cancelar(id: string, data: CancelarCncInput): Promise<CncRecord | null>;
  updateObservacao(
    id: string,
    data: UpdateObservacaoCncInput,
  ): Promise<CncRecord | null>;
  updateOpcoesImpressao(
    id: string,
    data: UpdateOpcoesImpressaoCncInput,
  ): Promise<CncRecord | null>;
  addTratativa(data: CreateCncTratativaInput): Promise<CncTratativaRecord>;
  concluirTratativa(
    cncId: string,
    tratativaId: string,
    data: ConcluirCncTratativaInput,
  ): Promise<CncTratativaRecord | null>;
  listTratativas(cncId: string): Promise<CncTratativaRecord[]>;
  countTratativas(cncId: string): Promise<number>;
  countTratativasPendentes(cncId: string): Promise<number>;
  updateItem(
    cncId: string,
    itemId: string,
    data: UpdateCncItemInput,
  ): Promise<CncItemRecord | null>;
  removeItem(cncId: string, itemId: string): Promise<CncItemRecord | null>;
  addEvento(data: AddCncEventoInput): Promise<CncEventoRecord>;
}
