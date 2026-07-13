import { apiRequest } from '@/lib/api';

import type {
  CentroOptionApi,
  CreateEnderecoPayload,
  EnderecoActionPayload,
  EnderecoApi,
  EnderecoKpiApi,
  ImportEnderecosResponse,
  ListEnderecosApiResponse,
  UpdateEnderecoPayload,
} from '@/features/enderecos/types/endereco.api';
import type { GetMapaCdResponse } from '@/features/enderecos/types/mapa-cd.schema';
import type {
  EnderecoKpi,
  EnderecoListaItem,
  EnderecoStatus,
  EnderecoTipo,
} from '@/features/enderecos/types/enderecos-gestao.schema';

type ListEnderecosParams = {
  page?: number;
  limit?: number;
  status?: EnderecoStatus;
  tipo?: EnderecoTipo;
  unidadeId?: string;
  search?: string;
};

export function mapEnderecoToListaItem(endereco: EnderecoApi): EnderecoListaItem {
  return {
    id: endereco.id,
    enderecoId: endereco.enderecoMascarado,
    zona: endereco.zona,
    rua: endereco.rua,
    posicao: endereco.posicao,
    nivel: endereco.nivel,
    tipo: endereco.tipo,
    status: endereco.status,
    capacidadeKg: Number(endereco.cargaMaxKg),
    ocupacaoPercent: Number(endereco.ocupacaoPercent),
    curvaAbc: endereco.curvaAbc,
  };
}

export function mapKpiApiToKpi(kpi: EnderecoKpiApi): EnderecoKpi {
  return {
    totalEnderecos: kpi.totalEnderecos,
    totalEnderecosTrendPercent: kpi.totalEnderecosTrendPercent,
    ocupacaoGlobalPercent: kpi.ocupacaoGlobalPercent,
    posicoesBloqueadas: kpi.posicoesBloqueadas,
    crossDockingAtivos: kpi.crossDockingAtivos,
    enderecosDisponiveis: kpi.enderecosDisponiveis,
    enderecosOcupados: kpi.enderecosOcupados,
    taxaOcupacaoGeral: kpi.taxaOcupacaoGeral,
  };
}

export async function listEnderecos(
  params: ListEnderecosParams = {},
): Promise<ListEnderecosApiResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.status) {
    searchParams.set('status', params.status);
  }

  if (params.tipo) {
    searchParams.set('tipo', params.tipo);
  }

  if (params.unidadeId) {
    searchParams.set('unidadeId', params.unidadeId);
  }

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  const query = searchParams.toString();
  const path = query ? `/enderecos?${query}` : '/enderecos';

  return apiRequest<ListEnderecosApiResponse>(path);
}

export function getEnderecoKpi(params?: {
  unidadeId?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params?.unidadeId) {
    searchParams.set('unidadeId', params.unidadeId);
  }

  const query = searchParams.toString();
  const path = query ? `/enderecos/kpi?${query}` : '/enderecos/kpi';

  return apiRequest<EnderecoKpiApi>(path);
}

export function getEndereco(id: string) {
  return apiRequest<EnderecoApi>(`/enderecos/${encodeURIComponent(id)}`);
}

export function createEndereco(payload: CreateEnderecoPayload) {
  return apiRequest<EnderecoApi>('/enderecos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateEndereco(id: string, payload: UpdateEnderecoPayload) {
  return apiRequest<EnderecoApi>(`/enderecos/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteEndereco(id: string) {
  return apiRequest<void>(`/enderecos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function blockEndereco(id: string, payload: EnderecoActionPayload = {}) {
  return apiRequest<EnderecoApi>(`/enderecos/${encodeURIComponent(id)}/block`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function unblockEndereco(id: string, payload: EnderecoActionPayload = {}) {
  return apiRequest<EnderecoApi>(
    `/enderecos/${encodeURIComponent(id)}/unblock`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function inactivateEndereco(
  id: string,
  payload: EnderecoActionPayload = {},
) {
  return apiRequest<EnderecoApi>(
    `/enderecos/${encodeURIComponent(id)}/inactivate`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function startEnderecoInventory(
  id: string,
  payload: EnderecoActionPayload = {},
) {
  return apiRequest<EnderecoApi>(
    `/enderecos/${encodeURIComponent(id)}/inventory/start`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function finishEnderecoInventory(
  id: string,
  payload: EnderecoActionPayload = {},
) {
  return apiRequest<EnderecoApi>(
    `/enderecos/${encodeURIComponent(id)}/inventory/finish`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function listCentros(unidadeId?: string) {
  const path = unidadeId
    ? `/centros?unidadeId=${encodeURIComponent(unidadeId)}`
    : '/centros';

  return apiRequest<CentroOptionApi[]>(path);
}

export function formatCentroLabel(centro: CentroOptionApi) {
  return `${centro.centro} — ${centro.nome} (${centro.unidadeFilial})`;
}

export function importEnderecos(file: File): Promise<ImportEnderecosResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<ImportEnderecosResponse>('/enderecos/import', {
    method: 'POST',
    body: formData,
  });
}

export function criarEnderecosLote(items: CreateEnderecoPayload[]) {
  return apiRequest<ImportEnderecosResponse>('/enderecos/lote', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export function getMapaCd(unidadeId?: string) {
  const path = unidadeId
    ? `/enderecos/mapa-cd?unidadeId=${encodeURIComponent(unidadeId)}`
    : '/enderecos/mapa-cd';

  return apiRequest<GetMapaCdResponse>(path);
}

export { downloadEnderecoTemplate } from '@/features/enderecos/lib/endereco-import-template';
