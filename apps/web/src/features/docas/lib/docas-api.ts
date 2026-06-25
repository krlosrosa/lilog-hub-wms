import { apiRequest } from '@/lib/api';

import type {
  CreateDocaPayload,
  CreateOperacaoDocaPayload,
  DocaActionPayload,
  DocaApi,
  ListDocasApiResponse,
  ListOperacoesDocaApiResponse,
  OperacaoDocaApi,
  OperacaoDocaSituacao,
  UpdateDocaPayload,
} from '@/features/docas/types/doca.api';
import type {
  DocaListaItem,
  DocaSituacao,
  DocaTipo,
} from '@/features/docas/types/docas.schema';

type ListDocasParams = {
  page?: number;
  limit?: number;
  unidadeId?: string;
  situacao?: DocaSituacao;
  tipo?: DocaTipo;
  search?: string;
};

type ListOperacoesDocaParams = {
  page?: number;
  limit?: number;
  docaId?: string;
  situacao?: OperacaoDocaSituacao;
  dataPrevistaFrom?: string;
  dataPrevistaTo?: string;
};

export function mapDocaToListaItem(doca: DocaApi): DocaListaItem {
  return {
    id: doca.id,
    unidadeId: doca.unidadeId,
    codigo: doca.codigo,
    nome: doca.nome,
    tipo: doca.tipo,
    situacao: doca.situacao,
    capacidadeVeiculos: doca.capacidadeVeiculos,
    observacao: doca.observacao,
  };
}

export async function listDocas(
  params: ListDocasParams = {},
): Promise<ListDocasApiResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.unidadeId) {
    searchParams.set('unidadeId', params.unidadeId);
  }

  if (params.situacao) {
    searchParams.set('situacao', params.situacao);
  }

  if (params.tipo) {
    searchParams.set('tipo', params.tipo);
  }

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  const query = searchParams.toString();
  const path = query ? `/docas?${query}` : '/docas';

  return apiRequest<ListDocasApiResponse>(path);
}

export function getDoca(id: string) {
  return apiRequest<DocaApi>(`/docas/${encodeURIComponent(id)}`);
}

export function createDoca(payload: CreateDocaPayload) {
  return apiRequest<DocaApi>('/docas', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateDoca(id: string, payload: UpdateDocaPayload) {
  return apiRequest<DocaApi>(`/docas/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteDoca(id: string) {
  return apiRequest<void>(`/docas/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function blockDoca(id: string, payload: DocaActionPayload = {}) {
  return apiRequest<DocaApi>(`/docas/${encodeURIComponent(id)}/bloquear`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function unblockDoca(id: string) {
  return apiRequest<DocaApi>(`/docas/${encodeURIComponent(id)}/desbloquear`, {
    method: 'PATCH',
  });
}

export function setMaintenanceDoca(id: string, payload: DocaActionPayload = {}) {
  return apiRequest<DocaApi>(`/docas/${encodeURIComponent(id)}/manutencao`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function listOperacoesDoca(
  params: ListOperacoesDocaParams = {},
): Promise<ListOperacoesDocaApiResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.docaId) {
    searchParams.set('docaId', params.docaId);
  }

  if (params.situacao) {
    searchParams.set('situacao', params.situacao);
  }

  if (params.dataPrevistaFrom) {
    searchParams.set('dataPrevistaFrom', params.dataPrevistaFrom);
  }

  if (params.dataPrevistaTo) {
    searchParams.set('dataPrevistaTo', params.dataPrevistaTo);
  }

  const query = searchParams.toString();
  const path = query ? `/docas/operacoes?${query}` : '/docas/operacoes';

  return apiRequest<ListOperacoesDocaApiResponse>(path);
}

export function createOperacaoDoca(
  docaId: string,
  payload: CreateOperacaoDocaPayload,
) {
  return apiRequest<OperacaoDocaApi>(
    `/docas/${encodeURIComponent(docaId)}/operacoes`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function iniciarOperacaoDoca(id: string) {
  return apiRequest<OperacaoDocaApi>(
    `/docas/operacoes/${encodeURIComponent(id)}/iniciar`,
    { method: 'PATCH' },
  );
}

export function finalizarOperacaoDoca(id: string) {
  return apiRequest<OperacaoDocaApi>(
    `/docas/operacoes/${encodeURIComponent(id)}/finalizar`,
    { method: 'PATCH' },
  );
}

export function cancelarOperacaoDoca(id: string) {
  return apiRequest<OperacaoDocaApi>(
    `/docas/operacoes/${encodeURIComponent(id)}/cancelar`,
    { method: 'PATCH' },
  );
}
