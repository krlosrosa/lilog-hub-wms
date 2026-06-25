import type {
  CncItemTipo,
  CncOrigem,
  CncResponsavel,
  CncSituacao,
} from '../../model/cnc/cnc.model.js';

export const CNC_REPOSITORY = 'ICncRepository';

export type CncItemRecord = {
  id: string;
  cncId: string;
  tipo: CncItemTipo;
  referenciaId: string;
  createdAt: Date;
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
  acaoImediata: string | null;
  acaoCorretiva: string | null;
  situacao: CncSituacao;
  solicitanteId: number;
  aprovadorId: number | null;
  dataAprovacao: Date | null;
  observacaoAprovador: string | null;
  valorDebito: number | null;
  debitoConfirmado: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CncWithItens = CncRecord & {
  itens: CncItemRecord[];
};

export type CreateCncItemInput = {
  tipo: CncItemTipo;
  referenciaId: string;
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

export type UpdateCncSituacaoInput = {
  situacao: CncSituacao;
  aprovadorId?: number | null;
  dataAprovacao?: Date | null;
  observacaoAprovador?: string | null;
  responsavel?: CncResponsavel;
  responsavelId?: string | null;
  valorDebito?: number | null;
  debitoConfirmado?: boolean;
};

export interface ICncRepository {
  create(data: CreateCncInput): Promise<CncWithItens>;
  findById(id: string): Promise<CncWithItens | null>;
  findByOrigem(origem: CncOrigem, origemId: string): Promise<CncWithItens | null>;
  countByYear(year: number): Promise<number>;
  list(filter: ListCncsFilter): Promise<ListCncsResult>;
  updateSituacao(
    id: string,
    data: UpdateCncSituacaoInput,
  ): Promise<CncRecord | null>;
}
