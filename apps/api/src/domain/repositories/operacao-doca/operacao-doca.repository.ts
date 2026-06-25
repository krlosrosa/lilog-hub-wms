import type {
  CreateOperacaoDocaInput,
  OperacaoDocaSituacao,
} from '../../model/doca/doca.model.js';

export const OPERACAO_DOCA_REPOSITORY = 'IOperacaoDocaRepository';

export type OperacaoDocaRecord = {
  id: string;
  docaId: string;
  tipoOperacao: CreateOperacaoDocaInput['tipoOperacao'];
  veiculoId: string;
  transportadoraId: string;
  motorista: string | null;
  dataPrevista: Date | null;
  dataInicio: Date | null;
  dataFim: Date | null;
  situacao: OperacaoDocaSituacao;
  prioridade: CreateOperacaoDocaInput['prioridade'];
  observacao: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ListOperacoesDocaFilter = {
  page?: number;
  limit?: number;
  docaId?: string;
  situacao?: OperacaoDocaSituacao;
  dataPrevistaFrom?: Date;
  dataPrevistaTo?: Date;
};

export type ListOperacoesDocaResult = {
  items: OperacaoDocaRecord[];
  total: number;
  page: number;
  limit: number;
};

export type UpdateOperacaoDocaData = {
  situacao?: OperacaoDocaSituacao;
  dataInicio?: Date | null;
  dataFim?: Date | null;
  observacao?: string | null;
};

export interface IOperacaoDocaRepository {
  list(filter: ListOperacoesDocaFilter): Promise<ListOperacoesDocaResult>;
  findById(id: string): Promise<OperacaoDocaRecord | null>;
  findActiveByDocaId(docaId: string): Promise<OperacaoDocaRecord | null>;
  create(data: CreateOperacaoDocaInput): Promise<OperacaoDocaRecord>;
  update(
    id: string,
    data: UpdateOperacaoDocaData,
  ): Promise<OperacaoDocaRecord | null>;
}
