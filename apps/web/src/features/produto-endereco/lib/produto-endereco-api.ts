import {
  apiDownloadBlob,
  apiRequest,
  downloadBlobArquivo,
} from '@/lib/api';

import type {
  CreateProdutoEnderecoPayload,
  ExportProdutoEnderecosParams,
  GrupoComEnderecosApi,
  ImportProdutoEnderecosResponse,
  ListProdutoEnderecosApiResponse,
  ListProdutoEnderecosParams,
  ListSlottingProdutoEnderecosApiResponse,
  ListSlottingProdutoEnderecosParams,
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

export async function listSlottingProdutoEnderecos(
  params: ListSlottingProdutoEnderecosParams,
): Promise<ListSlottingProdutoEnderecosApiResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('centroId', params.centroId);

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.unidadeId) {
    searchParams.set('unidadeId', params.unidadeId);
  }

  if (params.tipo) {
    searchParams.set('tipo', params.tipo);
  }

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  if (params.zonas && params.zonas.length > 0) {
    searchParams.set('zonas', params.zonas.join(','));
  }

  if (params.slotting) {
    searchParams.set('slotting', params.slotting);
  }

  if (params.papel) {
    searchParams.set('papel', params.papel);
  }

  if (params.ativo) {
    searchParams.set('ativo', params.ativo);
  }

  if (params.searchProduto?.trim()) {
    searchParams.set('searchProduto', params.searchProduto.trim());
  }

  if (params.sortBy) {
    searchParams.set('sortBy', params.sortBy);
  }

  if (params.sortOrder) {
    searchParams.set('sortOrder', params.sortOrder);
  }

  return apiRequest<ListSlottingProdutoEnderecosApiResponse>(
    `/produto-enderecos/slotting?${searchParams.toString()}`,
  );
}

export function listGruposEnderecos(centroId: string) {
  const searchParams = new URLSearchParams();
  searchParams.set('centroId', centroId);

  return apiRequest<GrupoComEnderecosApi[]>(
    `/produto-enderecos/grupos?${searchParams.toString()}`,
  );
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

export async function exportProdutoEnderecos(
  params: ExportProdutoEnderecosParams,
): Promise<void> {
  const searchParams = new URLSearchParams();
  searchParams.set('centroId', params.centroId);

  if (params.unidadeId) {
    searchParams.set('unidadeId', params.unidadeId);
  }

  if (params.tipo) {
    searchParams.set('tipo', params.tipo);
  }

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  if (params.slotting) {
    searchParams.set('slotting', params.slotting);
  }

  const { blob, filename } = await apiDownloadBlob(
    `/produto-enderecos/export?${searchParams.toString()}`,
  );

  const resolvedFilename = filename.endsWith('.xlsx')
    ? filename
    : `produto-enderecos-${new Date().toISOString().slice(0, 10)}.xlsx`;

  downloadBlobArquivo(blob, resolvedFilename);
}

export function importProdutoEnderecos(
  file: File,
): Promise<ImportProdutoEnderecosResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<ImportProdutoEnderecosResponse>('/produto-enderecos/import', {
    method: 'POST',
    body: formData,
  });
}
