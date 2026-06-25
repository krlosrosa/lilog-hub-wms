import type { ProdutoRecord } from '../../../domain/repositories/produto/produto.repository.js';
import type { produtos } from '../providers/drizzle/config/migrations/schema.js';

type ProdutoRow = typeof produtos.$inferSelect;

export function mapProdutoRow(row: ProdutoRow): ProdutoRecord {
  return {
    id: row.id,
    produtoId: row.produtoId,
    sku: row.sku,
    descricao: row.descricao,
    empresa: row.empresa as ProdutoRecord['empresa'],
    categoria: row.categoria as ProdutoRecord['categoria'],
    tipo: row.tipo as ProdutoRecord['tipo'],
    ean: row.ean,
    dum: row.dum,
    shelfLife: row.shelfLife,
    pesoBrutoUnidade: row.pesoBrutoUnidade,
    pesoBrutoCaixa: row.pesoBrutoCaixa,
    pesoBrutoPalete: row.pesoBrutoPalete,
    pesoLiquidoUnidade: row.pesoLiquidoUnidade,
    pesoLiquidoCaixa: row.pesoLiquidoCaixa,
    pesoLiquidoPalete: row.pesoLiquidoPalete,
    unidadesPorCaixa: row.unidadesPorCaixa,
    caixasPorPalete: row.caixasPorPalete,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function normalizeOptionalString(value?: string | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toProdutoInsertValues(data: {
  produtoId: string;
  sku: string;
  descricao: string;
  empresa: string;
  categoria: string;
  tipo: string;
  ean?: string | null;
  dum?: string | null;
  shelfLife?: number | null;
  pesoBrutoUnidade?: string | null;
  pesoBrutoCaixa?: string | null;
  pesoBrutoPalete?: string | null;
  pesoLiquidoUnidade?: string | null;
  pesoLiquidoCaixa?: string | null;
  pesoLiquidoPalete?: string | null;
  unidadesPorCaixa?: number | null;
  caixasPorPalete?: number | null;
}) {
  return {
    produtoId: data.produtoId.trim(),
    sku: data.sku.trim(),
    descricao: data.descricao.trim(),
    empresa: data.empresa,
    categoria: data.categoria,
    tipo: data.tipo,
    ean: normalizeOptionalString(data.ean),
    dum: normalizeOptionalString(data.dum),
    shelfLife: data.shelfLife ?? null,
    pesoBrutoUnidade: normalizeOptionalString(data.pesoBrutoUnidade),
    pesoBrutoCaixa: normalizeOptionalString(data.pesoBrutoCaixa),
    pesoBrutoPalete: normalizeOptionalString(data.pesoBrutoPalete),
    pesoLiquidoUnidade: normalizeOptionalString(data.pesoLiquidoUnidade),
    pesoLiquidoCaixa: normalizeOptionalString(data.pesoLiquidoCaixa),
    pesoLiquidoPalete: normalizeOptionalString(data.pesoLiquidoPalete),
    unidadesPorCaixa: data.unidadesPorCaixa ?? null,
    caixasPorPalete: data.caixasPorPalete ?? null,
  };
}
