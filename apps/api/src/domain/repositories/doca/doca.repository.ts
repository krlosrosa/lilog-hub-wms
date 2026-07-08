import type {
  CreateDocaInput,
  DocaSituacao,
  DocaTipo,
  UpdateDocaInput,
} from '../../model/doca/doca.model.js';

export const DOCA_REPOSITORY = 'IDocaRepository';

export type DocaRecord = {
  id: string;
  unidadeId: string;
  codigo: string;
  nome: string;
  tipo: DocaTipo;
  situacao: DocaSituacao;
  capacidadeVeiculos: number | null;
  observacao: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ListDocasFilter = {
  page?: number;
  limit?: number;
  unidadeId?: string;
  situacao?: DocaSituacao;
  tipo?: DocaTipo;
  search?: string;
};

export type ListDocasResult = {
  items: DocaRecord[];
  total: number;
  page: number;
  limit: number;
};

export type BulkCreateDocasResult = {
  criadas: number;
  duplicadas: number;
  items: DocaRecord[];
};

export interface IDocaRepository {
  list(filter: ListDocasFilter): Promise<ListDocasResult>;
  findById(id: string): Promise<DocaRecord | null>;
  findByUnidadeAndCodigo(
    unidadeId: string,
    codigo: string,
  ): Promise<DocaRecord | null>;
  hasOperationalHistory(id: string): Promise<boolean>;
  create(data: CreateDocaInput): Promise<DocaRecord>;
  createBulk(items: CreateDocaInput[]): Promise<BulkCreateDocasResult>;
  update(id: string, data: UpdateDocaInput): Promise<DocaRecord | null>;
  delete(id: string): Promise<void>;
}
