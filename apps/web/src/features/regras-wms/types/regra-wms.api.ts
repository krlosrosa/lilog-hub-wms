import type { Acao, GatilhoRegra } from '@/features/regras-wms/types/regra-wms.schema';
import type {
  ArvoreCondicoes,
  RegraWmsV2,
} from '@/features/regras-wms/types/regra-wms-tree.schema';

export type ModoAvaliacaoRegraApi =
  | 'parar_no_primeiro_match'
  | 'acumular_matches';

export type RegraProcessoApi = {
  id: string;
  unidadeId: string;
  nome: string;
  descricao: string | null;
  gatilho: GatilhoRegra;
  prioridade: number;
  modoAvaliacao: ModoAvaliacaoRegraApi;
  arvoreCondicoes: ArvoreCondicoes;
  acoes: Acao[];
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ListRegrasProcessoParams = {
  unidadeId: string;
  page?: number;
  limit?: number;
  gatilho?: GatilhoRegra;
  ativo?: boolean;
  search?: string;
};

export type ListRegrasProcessoApiResponse = {
  items: RegraProcessoApi[];
  total: number;
  page: number;
  limit: number;
};

export type CreateRegraProcessoPayload = {
  unidadeId: string;
  nome: string;
  descricao?: string;
  gatilho: GatilhoRegra;
  prioridade: number;
  modoAvaliacao?: ModoAvaliacaoRegraApi;
  arvoreCondicoes: ArvoreCondicoes;
  acoes: Acao[];
  ativo: boolean;
};

export type UpdateRegraProcessoPayload = Partial<
  Omit<CreateRegraProcessoPayload, 'unidadeId'>
>;

export function mapRegraProcessoToRegraWmsV2(
  item: RegraProcessoApi,
): RegraWmsV2 {
  const [acao] = item.acoes;

  return {
    id: item.id,
    nome: item.nome,
    descricao: item.descricao ?? undefined,
    ativo: item.ativo,
    prioridade: item.prioridade,
    gatilho: item.gatilho,
    arvoreCondicoes: item.arvoreCondicoes,
    acao: acao ?? {
      tipo: 'mover_deposito',
      parametros: {},
    },
    criadoEm: item.createdAt,
    atualizadoEm: item.updatedAt,
  };
}
