import type {
  ConfirmarItemArmazenagemPayload,
  PoliticaArmazenagem,
} from '@lilog/contracts';

import { request } from '@/lib/offline/api-client';

export type ItemArmazenagemApi = {
  id: string;
  demandaId: string;
  produtoId: string;
  unitizadorId: string | null;
  quantidade: number;
  unidadeMedida: string;
  lote: string | null;
  validade: string | null;
  numeroSerie: string | null;
  enderecoSugeridoId: string | null;
  enderecoSugeridoLabel: string | null;
  enderecoConfirmadoId: string | null;
  status: 'pendente' | 'em_andamento' | 'armazenado' | 'divergente';
  produtoSku: string | null;
  produtoNome: string | null;
};

export type DemandaArmazenagemDetalheApi = {
  id: string;
  unidadeId: string;
  recebimentoId: string;
  modoUnitizacao: string;
  status: 'aguardando_inicio' | 'em_andamento' | 'concluida' | 'cancelada';
  responsavelId: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  itens: ItemArmazenagemApi[];
  politica: PoliticaArmazenagem;
};

export type DemandaArmazenagemListItemApi = Omit<
  DemandaArmazenagemDetalheApi,
  'itens' | 'politica'
>;

export type ListDemandasApi = {
  items: DemandaArmazenagemListItemApi[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchDemandasArmazenagem(
  unidadeId: string,
): Promise<ListDemandasApi> {
  const params = new URLSearchParams({ unidadeId });
  return request<ListDemandasApi>(`/armazenagem/demandas?${params.toString()}`);
}

export async function fetchDemandaArmazenagem(
  demandaId: string,
): Promise<DemandaArmazenagemDetalheApi> {
  return request<DemandaArmazenagemDetalheApi>(
    `/armazenagem/demandas/${encodeURIComponent(demandaId)}`,
  );
}

export async function iniciarDemandaArmazenagem(
  demandaId: string,
): Promise<DemandaArmazenagemDetalheApi> {
  return request<DemandaArmazenagemDetalheApi>(
    `/armazenagem/demandas/${encodeURIComponent(demandaId)}/iniciar`,
    { method: 'POST' },
  );
}

export async function confirmarItemArmazenagem(
  demandaId: string,
  itemId: string,
  payload: ConfirmarItemArmazenagemPayload,
): Promise<ItemArmazenagemApi> {
  return request<ItemArmazenagemApi>(
    `/armazenagem/demandas/${encodeURIComponent(demandaId)}/itens/${encodeURIComponent(itemId)}/confirmar`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
}

export async function concluirDemandaArmazenagem(
  demandaId: string,
): Promise<DemandaArmazenagemDetalheApi> {
  return request<DemandaArmazenagemDetalheApi>(
    `/armazenagem/demandas/${encodeURIComponent(demandaId)}/concluir`,
    { method: 'POST' },
  );
}

type EnderecoDisponivelApi = {
  id: string;
  enderecoMascarado: string;
};

export async function resolveEnderecoPorLabel(
  demandaId: string,
  itemId: string,
  label: string,
): Promise<string | null> {
  const params = new URLSearchParams({ search: label.trim(), limit: '5' });
  const result = await request<{ items: EnderecoDisponivelApi[] }>(
    `/armazenagem/demandas/${encodeURIComponent(demandaId)}/itens/${encodeURIComponent(itemId)}/enderecos-disponiveis?${params.toString()}`,
  );
  const normalized = label.trim().toUpperCase();
  const match =
    result.items.find(
      (item) => item.enderecoMascarado.trim().toUpperCase() === normalized,
    ) ?? result.items[0];
  return match?.id ?? null;
}
