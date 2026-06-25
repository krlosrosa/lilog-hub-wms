import { apiRequest } from '@/lib/api';

import type {
  ClienteEspecialApi,
  ClienteEspecialFormValues,
  ClienteEspecialListaItem,
  ListClientesEspeciaisApiResponse,
} from '@/features/cliente-especial-expedicao/types/cliente-especial.schema';

type ListClientesEspeciaisParams = {
  unidadeId: string;
  page?: number;
  limit?: number;
  search?: string;
  ativo?: boolean;
};

type CreateClienteEspecialPayload = ClienteEspecialFormValues & {
  unidadeId: string;
};

type UpdateClienteEspecialPayload = Partial<ClienteEspecialFormValues>;

export function mapClienteEspecialToListaItem(
  cliente: ClienteEspecialApi,
): ClienteEspecialListaItem {
  return {
    id: cliente.id,
    codCliente: cliente.codCliente,
    nomeCliente: cliente.nomeCliente,
    ativo: cliente.ativo,
    exigeSegregacaoMapa: cliente.exigeSegregacaoMapa,
    exigeSeparacaoEspecial: cliente.exigeSeparacaoEspecial,
    exigeCarregamentoEspecial: cliente.exigeCarregamentoEspecial,
  };
}

export function mapClienteEspecialApiToFormValues(
  cliente: ClienteEspecialApi,
): ClienteEspecialFormValues {
  return {
    codCliente: cliente.codCliente,
    nomeCliente: cliente.nomeCliente,
    ativo: cliente.ativo,
    exigeSegregacaoMapa: cliente.exigeSegregacaoMapa,
    exigeSeparacaoEspecial: cliente.exigeSeparacaoEspecial,
    exigeCarregamentoEspecial: cliente.exigeCarregamentoEspecial,
    observacaoSeparacao: cliente.observacaoSeparacao ?? '',
    observacaoCarregamento: cliente.observacaoCarregamento ?? '',
    observacaoGeral: cliente.observacaoGeral ?? '',
  };
}

function mapFormValuesToPayload(values: ClienteEspecialFormValues) {
  return {
    codCliente: values.codCliente.trim(),
    nomeCliente: values.nomeCliente.trim(),
    ativo: values.ativo,
    exigeSegregacaoMapa: values.exigeSegregacaoMapa,
    exigeSeparacaoEspecial: values.exigeSeparacaoEspecial,
    exigeCarregamentoEspecial: values.exigeCarregamentoEspecial,
    observacaoSeparacao: values.observacaoSeparacao?.trim() || null,
    observacaoCarregamento: values.observacaoCarregamento?.trim() || null,
    observacaoGeral: values.observacaoGeral?.trim() || null,
  };
}

export async function listClientesEspeciais(
  params: ListClientesEspeciaisParams,
): Promise<ListClientesEspeciaisApiResponse> {
  const searchParams = new URLSearchParams({
    unidadeId: params.unidadeId,
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  if (params.ativo !== undefined) {
    searchParams.set('ativo', String(params.ativo));
  }

  return apiRequest<ListClientesEspeciaisApiResponse>(
    `/expedicao/clientes-especiais?${searchParams.toString()}`,
  );
}

export function getClienteEspecial(id: string) {
  return apiRequest<ClienteEspecialApi>(`/expedicao/clientes-especiais/${id}`);
}

export function createClienteEspecial(payload: CreateClienteEspecialPayload) {
  return apiRequest<ClienteEspecialApi>('/expedicao/clientes-especiais', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      unidadeId: payload.unidadeId,
      ...mapFormValuesToPayload(payload),
    }),
  });
}

export function updateClienteEspecial(
  id: string,
  payload: UpdateClienteEspecialPayload,
) {
  return apiRequest<ClienteEspecialApi>(`/expedicao/clientes-especiais/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mapFormValuesToPayload(payload as ClienteEspecialFormValues)),
  });
}

export function deleteClienteEspecial(id: string) {
  return apiRequest<void>(`/expedicao/clientes-especiais/${id}`, {
    method: 'DELETE',
  });
}
