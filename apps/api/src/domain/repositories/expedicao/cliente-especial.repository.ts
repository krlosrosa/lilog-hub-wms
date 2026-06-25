import type {
  CreateClienteEspecialInput,
  UpdateClienteEspecialInput,
} from '../../model/expedicao/cliente-especial.model.js';

export const CLIENTE_ESPECIAL_REPOSITORY = 'IClienteEspecialRepository';

export type ClienteEspecialRecord = {
  id: string;
  unidadeId: string;
  codCliente: string;
  nomeCliente: string;
  ativo: boolean;
  exigeSegregacaoMapa: boolean;
  exigeSeparacaoEspecial: boolean;
  exigeCarregamentoEspecial: boolean;
  observacaoSeparacao: string | null;
  observacaoCarregamento: string | null;
  observacaoGeral: string | null;
  criadoPor: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ListClientesEspeciaisFilter = {
  unidadeId: string;
  ativo?: boolean;
  search?: string;
  page?: number;
  limit?: number;
};

export type ListClientesEspeciaisResult = {
  items: ClienteEspecialRecord[];
  total: number;
  page: number;
  limit: number;
};

export interface IClienteEspecialRepository {
  list(filter: ListClientesEspeciaisFilter): Promise<ListClientesEspeciaisResult>;
  findById(id: string): Promise<ClienteEspecialRecord | null>;
  findByUnidadeAndCodCliente(
    unidadeId: string,
    codCliente: string,
  ): Promise<ClienteEspecialRecord | null>;
  findByCodigos(
    unidadeId: string,
    codClientes: string[],
  ): Promise<ClienteEspecialRecord[]>;
  create(data: CreateClienteEspecialInput): Promise<ClienteEspecialRecord>;
  update(
    id: string,
    data: UpdateClienteEspecialInput,
  ): Promise<ClienteEspecialRecord | null>;
  delete(id: string): Promise<void>;
}
