import { apiRequest } from '@/lib/api';

import type {
  CorteDetalhe,
  CorteListaItem,
  CorteStatus,
  MapaGrupoCorte,
} from '@/features/corte-operacional/types/corte-operacional.schema';

export type ListCortesApiResponse = {
  items: CorteListaItem[];
  total: number;
  page: number;
  limit: number;
};

export type SolicitarCortePayload = {
  unidadeId: string;
  mapaGrupoId: string;
  mapaGrupoMicroUuid: string;
  doca?: string;
  motivo?: string;
  observacao?: string;
  itens: Array<{
    mapaGrupoItemId: string;
    quantidadeCorte: number;
  }>;
};

export function buscarMapaGrupoPorCodigo(unidadeId: string, codigo: string) {
  const params = new URLSearchParams({ unidadeId });
  return apiRequest<MapaGrupoCorte>(
    `/corte-operacional/mapas-grupo/${encodeURIComponent(codigo)}?${params.toString()}`,
  );
}

export function listCortesOperacionais(input: {
  unidadeId: string;
  page?: number;
  limit?: number;
  status?: CorteStatus;
  search?: string;
}) {
  const params = new URLSearchParams({ unidadeId: input.unidadeId });
  if (input.page) params.set('page', String(input.page));
  if (input.limit) params.set('limit', String(input.limit));
  if (input.status) params.set('status', input.status);
  if (input.search?.trim()) params.set('search', input.search.trim());

  return apiRequest<ListCortesApiResponse>(
    `/corte-operacional/cortes?${params.toString()}`,
  );
}

export function getCorteOperacional(unidadeId: string, corteId: string) {
  const params = new URLSearchParams({ unidadeId });
  return apiRequest<CorteDetalhe>(
    `/corte-operacional/cortes/${corteId}?${params.toString()}`,
  );
}

export function solicitarCorteOperacional(payload: SolicitarCortePayload) {
  return apiRequest<CorteDetalhe>('/corte-operacional/cortes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function iniciarCorteOperacional(unidadeId: string, corteId: string) {
  const params = new URLSearchParams({ unidadeId });
  return apiRequest<CorteDetalhe>(
    `/corte-operacional/cortes/${corteId}/iniciar?${params.toString()}`,
    { method: 'POST' },
  );
}

export function realizarCorteOperacional(unidadeId: string, corteId: string) {
  const params = new URLSearchParams({ unidadeId });
  return apiRequest<CorteDetalhe>(
    `/corte-operacional/cortes/${corteId}/realizar?${params.toString()}`,
    { method: 'POST' },
  );
}

export function cancelarCorteOperacional(
  unidadeId: string,
  corteId: string,
  motivoCancelamento: string,
) {
  return apiRequest<CorteDetalhe>(
    `/corte-operacional/cortes/${corteId}/cancelar`,
    {
      method: 'POST',
      body: JSON.stringify({ unidadeId, motivoCancelamento }),
    },
  );
}
