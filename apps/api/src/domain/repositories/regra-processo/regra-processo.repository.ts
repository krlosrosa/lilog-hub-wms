import type {
  AcaoRegra,
  ArvoreCondicoes,
  CreateRegraProcessoInput,
  GatilhoRegra,
  ModoAvaliacaoRegra,
  UpdateRegraProcessoInput,
} from '../../model/regra-processo/regra-processo.model.js';

export const REGRA_PROCESSO_REPOSITORY = 'IRegraProcessoRepository';

export type RegraProcessoRecord = {
  id: string;
  unidadeId: string;
  nome: string;
  descricao: string | null;
  gatilho: GatilhoRegra;
  prioridade: number;
  modoAvaliacao: ModoAvaliacaoRegra;
  arvoreCondicoes: ArvoreCondicoes;
  acoes: AcaoRegra[];
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ListRegrasProcessoFilter = {
  page?: number;
  limit?: number;
  unidadeId: string;
  gatilho?: GatilhoRegra;
  ativo?: boolean;
  search?: string;
};

export type ListRegrasProcessoResult = {
  items: RegraProcessoRecord[];
  total: number;
  page: number;
  limit: number;
};

export interface IRegraProcessoRepository {
  create(input: CreateRegraProcessoInput): Promise<RegraProcessoRecord>;
  list(filter: ListRegrasProcessoFilter): Promise<ListRegrasProcessoResult>;
  findById(id: string): Promise<RegraProcessoRecord | null>;
  findByNome(
    unidadeId: string,
    gatilho: GatilhoRegra,
    nome: string,
  ): Promise<RegraProcessoRecord | null>;
  update(
    id: string,
    input: UpdateRegraProcessoInput,
  ): Promise<RegraProcessoRecord | null>;
  delete(id: string): Promise<void>;
  listarAtivasPorGatilho(
    unidadeId: string,
    gatilho: GatilhoRegra,
  ): Promise<RegraProcessoRecord[]>;
}
