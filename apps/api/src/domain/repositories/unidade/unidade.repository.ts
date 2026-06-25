import type {
  CreateCentroInput,
  CreateUnidadeInput,
  UpdateCentroInput,
  UpdateUnidadeInput,
} from '../../model/unidade/unidade.model.js';

export const UNIDADE_REPOSITORY = 'IUnidadeRepository';

export type CentroRecord = {
  id: string;
  unidadeId: string;
  centro: string;
  empresa: CreateCentroInput['empresa'];
  nome: string;
  createdAt: Date;
};

export type CentroWithUnidadeRecord = CentroRecord & {
  unidadeNome: string;
  unidadeFilial: string;
};

export type UnidadeRecord = {
  id: string;
  nome: string;
  cluster: CreateUnidadeInput['cluster'];
  nomeFilial: string;
  modoUnitizacaoRecebimento: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UnidadeWithCentros = UnidadeRecord & {
  centros: CentroRecord[];
};

export type ListUnidadesFilter = {
  page?: number;
  limit?: number;
  cluster?: CreateUnidadeInput['cluster'];
  search?: string;
};

export type ListUnidadesResult = {
  items: UnidadeWithCentros[];
  total: number;
  page: number;
  limit: number;
};

export type AddCentroInput = CreateCentroInput & {
  unidadeId: string;
};

export interface IUnidadeRepository {
  list(filter: ListUnidadesFilter): Promise<ListUnidadesResult>;
  listCentros(unidadeId?: string): Promise<CentroWithUnidadeRecord[]>;
  findById(id: string): Promise<UnidadeWithCentros | null>;
  create(data: CreateUnidadeInput): Promise<UnidadeWithCentros>;
  update(id: string, data: UpdateUnidadeInput): Promise<UnidadeRecord | null>;
  delete(id: string): Promise<void>;
  addCentro(data: AddCentroInput): Promise<CentroRecord>;
  updateCentro(
    centroId: string,
    unidadeId: string,
    data: UpdateCentroInput,
  ): Promise<CentroRecord | null>;
  deleteCentro(centroId: string, unidadeId: string): Promise<void>;
}
