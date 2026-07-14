import type {
  CreateCentroOrigemInput,
  UpdateCentroOrigemInput,
} from '../../model/centro-origem/centro-origem.model.js';

export const CENTRO_ORIGEM_REPOSITORY = 'ICentroOrigemRepository';

export type CentroOrigemRecord = {
  centro: string;
  nome: string;
};

export type ListCentrosOrigemFilter = {
  page?: number;
  limit?: number;
  search?: string;
};

export type ListCentrosOrigemResult = {
  items: CentroOrigemRecord[];
  total: number;
  page: number;
  limit: number;
};

export interface ICentroOrigemRepository {
  list(filter: ListCentrosOrigemFilter): Promise<ListCentrosOrigemResult>;
  findById(centro: string): Promise<CentroOrigemRecord | null>;
  create(data: CreateCentroOrigemInput): Promise<CentroOrigemRecord>;
  update(
    centro: string,
    data: UpdateCentroOrigemInput,
  ): Promise<CentroOrigemRecord | null>;
  delete(centro: string): Promise<void>;
}
