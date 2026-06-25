import { apiRequest } from '@/lib/api';

import type {
  CreateProdutoPayload,
  ImportacaoMassaResponse,
  ListProdutosApiResponse,
  ListProdutosParams,
  ProdutoApi,
  UpdateProdutoPayload,
} from '@/features/produto/types/produto.api';
import {
  getCategoriaLabel,
  normalizeProdutoCategoria,
  type ProdutoListaItem,
} from '@/features/produto/types/produto-lista.schema';
import {
  EMPRESA_OPTIONS,
  type ProdutoFormValues,
} from '@/features/produto/types/produto.schema';

function parseOptionalPositiveInteger(value?: string): number | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseOptionalNumericString(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function mapProdutoToListaItem(produto: ProdutoApi): ProdutoListaItem {
  const empresaLabel =
    EMPRESA_OPTIONS.find((option) => option.value === produto.empresa)?.label ??
    produto.empresa;
  const categoria = normalizeProdutoCategoria(produto.categoria);

  return {
    id: produto.id,
    sku: produto.sku,
    descricao: produto.descricao,
    subtitulo: `${produto.tipo} • ${getCategoriaLabel(categoria)}`,
    ean: produto.ean ?? undefined,
    categoria,
    empresa: empresaLabel,
  };
}

function formatOptionalNumber(value?: number | null): string {
  return value != null ? String(value) : '';
}

export function mapProdutoApiToFormValues(produto: ProdutoApi): ProdutoFormValues {
  return {
    produtoId: produto.produtoId,
    sku: produto.sku,
    descricao: produto.descricao,
    empresa: produto.empresa,
    categoria: produto.categoria,
    shelfLife: formatOptionalNumber(produto.shelfLife),
    ean: produto.ean ?? '',
    dum: produto.dum ?? '',
    tipo: produto.tipo,
    pesoBrutoUnidade: produto.pesoBrutoUnidade ?? '',
    pesoBrutoCaixa: produto.pesoBrutoCaixa ?? '',
    pesoBrutoPalete: produto.pesoBrutoPalete ?? '',
    unidadesPorCaixa: formatOptionalNumber(produto.unidadesPorCaixa),
    caixasPorPalete: formatOptionalNumber(produto.caixasPorPalete),
  };
}

export function mapFormValuesToCreatePayload(
  data: ProdutoFormValues,
): CreateProdutoPayload {
  return {
    produtoId: data.produtoId.trim(),
    sku: data.sku.trim(),
    descricao: data.descricao.trim(),
    empresa: data.empresa as CreateProdutoPayload['empresa'],
    categoria: data.categoria as CreateProdutoPayload['categoria'],
    tipo: data.tipo,
    ean: data.ean?.trim() || undefined,
    dum: data.dum?.trim() || undefined,
    shelfLife: parseOptionalPositiveInteger(data.shelfLife),
    pesoBrutoUnidade: parseOptionalNumericString(data.pesoBrutoUnidade),
    pesoBrutoCaixa: parseOptionalNumericString(data.pesoBrutoCaixa),
    pesoBrutoPalete: parseOptionalNumericString(data.pesoBrutoPalete),
    unidadesPorCaixa: parseOptionalPositiveInteger(data.unidadesPorCaixa),
    caixasPorPalete: parseOptionalPositiveInteger(data.caixasPorPalete),
  };
}

export async function listProdutos(
  params: ListProdutosParams = {},
): Promise<ListProdutosApiResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.categoria && params.categoria !== 'todos') {
    searchParams.set('categoria', params.categoria);
  }

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  if (params.empresa) {
    searchParams.set('empresa', params.empresa);
  }

  if (params.tipo) {
    searchParams.set('tipo', params.tipo);
  }

  if (params.ean) {
    searchParams.set('ean', params.ean);
  }

  if (params.dum) {
    searchParams.set('dum', params.dum);
  }

  const query = searchParams.toString();
  const path = query ? `/produtos?${query}` : '/produtos';

  return apiRequest<ListProdutosApiResponse>(path);
}

export function getProduto(id: string) {
  return apiRequest<ProdutoApi>(`/produtos/${encodeURIComponent(id)}`);
}

export function createProduto(payload: CreateProdutoPayload) {
  return apiRequest<ProdutoApi>('/produtos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateProduto(id: string, payload: UpdateProdutoPayload) {
  return apiRequest<ProdutoApi>(`/produtos/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteProduto(id: string) {
  return apiRequest<void>(`/produtos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function importarProdutosMassa(arquivo: File): Promise<ImportacaoMassaResponse> {
  const formData = new FormData();
  formData.append('arquivo', arquivo);
  return apiRequest<ImportacaoMassaResponse>('/produtos/importar-massa', {
    method: 'POST',
    body: formData,
  });
}
