import { apiRequest } from '@/lib/api';

import type {
  CreateProdutoEnderecoPayload,
  ListProdutoEnderecosApiResponse,
  ListProdutoEnderecosParams,
  ProdutoEnderecoApi,
  UpdateProdutoEnderecoPayload,
} from '@/features/produto-endereco/types/produto-endereco.api';
import type { ProdutoEnderecoListaItem } from '@/features/produto-endereco/types/produto-endereco.schema';

export function mapProdutoEnderecoToListaItem(
  item: ProdutoEnderecoApi,
): ProdutoEnderecoListaItem {
  return {
    id: item.id,
    sku: item.produto.sku,
    descricao: item.produto.descricao,
    enderecoMascarado: item.endereco.enderecoMascarado,
    centroLabel: `${item.centro.centro} — ${item.centro.nome}`,
    papel: item.papel,
    ordem: item.ordem,
    ativo: item.ativo,
  };
}

export async function listProdutoEnderecos(
  params: ListProdutoEnderecosParams = {},
): Promise<ListProdutoEnderecosApiResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.centroId) {
    searchParams.set('centroId', params.centroId);
  }

  if (params.unidadeId) {
    searchParams.set('unidadeId', params.unidadeId);
  }

  if (params.produtoId) {
    searchParams.set('produtoId', params.produtoId);
  }

  if (params.papel) {
    searchParams.set('papel', params.papel);
  }

  if (params.ativo !== undefined) {
    searchParams.set('ativo', params.ativo ? 'true' : 'false');
  }

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  const query = searchParams.toString();
  const path = query ? `/produto-enderecos?${query}` : '/produto-enderecos';

  return apiRequest<ListProdutoEnderecosApiResponse>(path);
}

export function getProdutoEndereco(id: string) {
  return apiRequest<ProdutoEnderecoApi>(
    `/produto-enderecos/${encodeURIComponent(id)}`,
  );
}

export function createProdutoEndereco(payload: CreateProdutoEnderecoPayload) {
  return apiRequest<ProdutoEnderecoApi>('/produto-enderecos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateProdutoEndereco(
  id: string,
  payload: UpdateProdutoEnderecoPayload,
) {
  return apiRequest<ProdutoEnderecoApi>(
    `/produto-enderecos/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export function deleteProdutoEndereco(id: string) {
  return apiRequest<void>(`/produto-enderecos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
