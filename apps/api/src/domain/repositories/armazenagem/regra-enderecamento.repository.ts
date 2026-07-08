import type {
  CreateRegraEnderecamentoInput,
  RegraEnderecamentoCriterioTipo,
  UpdateRegraEnderecamentoInput,
} from '../../model/armazenagem/regra-enderecamento.model.js';

export const REGRA_ENDERECAMENTO_REPOSITORY = 'IRegraEnderecamentoRepository';

export type RegraEnderecamentoDestinoRecord = {
  id: string;
  regraId: string;
  prioridade: number;
  tipo: 'zona' | 'endereco';
  zona: string | null;
  rua: string | null;
  enderecoId: string | null;
  enderecoLabel: string | null;
  ativo: boolean;
};

export type RegraEnderecamentoRecord = {
  id: string;
  unidadeId: string;
  nome: string;
  criterioTipo: RegraEnderecamentoCriterioTipo;
  criterioValor: string;
  prioridade: number;
  ativo: boolean;
  destinos: RegraEnderecamentoDestinoRecord[];
  createdAt: Date;
  updatedAt: Date;
};

export type ListRegrasEnderecamentoFilter = {
  page?: number;
  limit?: number;
  unidadeId: string;
  criterioTipo?: RegraEnderecamentoCriterioTipo;
  ativo?: boolean;
  search?: string;
};

export type ListRegrasEnderecamentoResult = {
  items: RegraEnderecamentoRecord[];
  total: number;
  page: number;
  limit: number;
};

export type FindEnderecoDisponivelPorRegraInput = {
  unidadeId: string;
  tipo: 'zona' | 'endereco';
  zona?: string | null;
  rua?: string | null;
  enderecoId?: string | null;
  excludeIds?: string[];
};

export interface IRegraEnderecamentoRepository {
  create(input: CreateRegraEnderecamentoInput): Promise<RegraEnderecamentoRecord>;
  list(
    filter: ListRegrasEnderecamentoFilter,
  ): Promise<ListRegrasEnderecamentoResult>;
  findById(id: string): Promise<RegraEnderecamentoRecord | null>;
  listAtivasByUnidade(unidadeId: string): Promise<RegraEnderecamentoRecord[]>;
  update(
    id: string,
    input: UpdateRegraEnderecamentoInput,
  ): Promise<RegraEnderecamentoRecord | null>;
  delete(id: string): Promise<void>;
  findEnderecoDisponivelPorRegra(
    input: FindEnderecoDisponivelPorRegraInput,
  ): Promise<string | null>;
}
