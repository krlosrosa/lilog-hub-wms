import type {
  CreateTransportadoraInput,
  TransportadoraStatus,
  UpdateTransportadoraInput,
} from '../../model/transportadora/transportadora.model.js';

export const TRANSPORTADORA_REPOSITORY = 'ITransportadoraRepository';

export type TransportadoraRecord = {
  id: string;
  unidadeId: string;
  idRavexTransportadora: number;
  nome: string;
  cnpj: string;
  status: TransportadoraStatus;
  quantidadeVeiculos: number;
  emails: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type ListTransportadorasFilter = {
  page?: number;
  limit?: number;
  unidadeId?: string;
  status?: TransportadoraStatus;
  search?: string;
};

export type ListTransportadorasResult = {
  items: TransportadoraRecord[];
  total: number;
  page: number;
  limit: number;
};

export interface ITransportadoraRepository {
  list(filter: ListTransportadorasFilter): Promise<ListTransportadorasResult>;
  findById(id: string): Promise<TransportadoraRecord | null>;
  findByEmail(email: string): Promise<TransportadoraRecord | null>;
  findByUnidadeAndRavexId(
    unidadeId: string,
    idRavexTransportadora: number,
  ): Promise<TransportadoraRecord | null>;
  create(data: CreateTransportadoraInput): Promise<TransportadoraRecord>;
  update(
    id: string,
    data: UpdateTransportadoraInput,
  ): Promise<TransportadoraRecord | null>;
  delete(id: string): Promise<void>;
}
