import { toBaseUnits } from '@/features/recebimento/lib/resolve-recebimento-divergencia';
import type { QuantidadeModo } from '@/features/recebimento/types/recebimento.schema';

import type { ConferenceRecord, DamageRecord } from '../local-db/schema';
import { resolveUnidadesPorCaixa } from './resolve-produto-conferencia-v2';
import type { RecebimentoSnapshot } from '../types/recebimento-v2.schema';

type SnapshotConferencia = Record<string, unknown>;
type SnapshotAvaria = Record<string, unknown>;

type SkuLookupSource = {
  produtoId: string;
  sku: string;
};

export function buildSkuByProdutoIdMap(
  expectedItems: SkuLookupSource[],
  products: SkuLookupSource[],
): Map<string, string> {
  const map = new Map<string, string>();

  for (const item of expectedItems) {
    if (item.produtoId && item.sku) {
      map.set(item.produtoId, item.sku);
    }
  }

  for (const product of products) {
    if (product.produtoId && product.sku && !map.has(product.produtoId)) {
      map.set(product.produtoId, product.sku);
    }
  }

  return map;
}

function resolveSkuFromItem(
  item: { sku?: unknown; produtoId?: unknown },
  skuByProdutoId?: Map<string, string>,
): string {
  if (typeof item.sku === 'string' && item.sku.trim()) {
    return item.sku.trim();
  }

  const produtoId = item.produtoId ? String(item.produtoId) : '';
  if (produtoId && skuByProdutoId?.has(produtoId)) {
    return skuByProdutoId.get(produtoId)!;
  }

  return produtoId;
}

function resolveOptionalSkuFromItem(
  item: { sku?: unknown; produtoId?: unknown },
  skuByProdutoId?: Map<string, string>,
): string | undefined {
  const sku = resolveSkuFromItem(item, skuByProdutoId);
  return sku || undefined;
}

function toIsoString(value: unknown, fallbackMs: number): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return new Date(fallbackMs).toISOString();
}

export function resolveSnapshotConferences(
  snapshot: RecebimentoSnapshot,
): SnapshotConferencia[] {
  if (snapshot.conferences?.length) {
    return snapshot.conferences;
  }

  if (snapshot.conferencias?.length) {
    return snapshot.conferencias;
  }

  return [];
}

export function resolveSnapshotAvarias(
  snapshot: RecebimentoSnapshot,
): SnapshotAvaria[] {
  const damages = snapshot.damages ?? snapshot.avarias;
  return Array.isArray(damages) ? damages : [];
}

function resolveValidadeFromSnapshot(item: SnapshotConferencia): string | undefined {
  const validadeRaw = item.validade;
  if (validadeRaw instanceof Date) {
    return validadeRaw.toISOString().slice(0, 10);
  }
  if (typeof validadeRaw === 'string' && validadeRaw) {
    return validadeRaw.slice(0, 10);
  }
  return undefined;
}

export function mapServerConferenciaToRecord(
  item: SnapshotConferencia,
  demandId: string,
  now: number,
  quantidadeModo: QuantidadeModo = 'ambos',
  skuByProdutoId?: Map<string, string>,
): ConferenceRecord {
  const pesagemId =
    typeof item.pesagemId === 'string' && item.pesagemId.trim()
      ? item.pesagemId.trim()
      : undefined;

  if (pesagemId) {
    const recebimentoItemId =
      typeof item.recebimentoItemId === 'string' && item.recebimentoItemId.trim()
        ? item.recebimentoItemId.trim()
        : undefined;
    const etiquetaCodigo =
      typeof item.etiquetaCodigo === 'string' && item.etiquetaCodigo.trim()
        ? item.etiquetaCodigo.trim()
        : undefined;
    const unitizadorCodigo =
      typeof item.unitizadorCodigo === 'string' && item.unitizadorCodigo.trim()
        ? item.unitizadorCodigo.trim()
        : undefined;

    return {
      id: pesagemId,
      demandId,
      sku: resolveSkuFromItem(item, skuByProdutoId),
      lote: item.loteRecebido ? String(item.loteRecebido) : undefined,
      validade: resolveValidadeFromSnapshot(item),
      quantity: 1,
      recebidaCaixa: 1,
      peso:
        item.pesoRecebido != null && Number.isFinite(Number(item.pesoRecebido))
          ? Number(item.pesoRecebido)
          : undefined,
      etiquetaCodigo,
      unitizadorCodigo,
      isPvarBox: true,
      conferidoAt: toIsoString(item.createdAt, now),
      syncStatus: 'synced',
      serverItemId: recebimentoItemId,
      serverPesagemId: pesagemId,
      updatedAt: now,
    };
  }

  const serverItemId = String(item.id ?? '');
  const quantidadeRecebida = Number(item.quantidadeRecebida ?? 0);
  const unidadeMedida = String(item.unidadeMedida ?? 'UN');
  const upc = resolveUnidadesPorCaixa(Number(item.unidadesPorCaixa));
  const quantity = toBaseUnits(quantidadeRecebida, unidadeMedida, upc);

  let recebidaCaixa = 0;
  let recebidaUnidade = 0;

  if (unidadeMedida === 'CX') {
    recebidaCaixa = quantidadeRecebida;
  } else if (quantidadeModo === 'caixa') {
    recebidaCaixa = Math.floor(quantity / upc);
  } else if (quantidadeModo === 'unidade') {
    recebidaUnidade = quantity;
  } else {
    recebidaCaixa = Math.floor(quantity / upc);
    recebidaUnidade = quantity % upc;
  }
  const validade = resolveValidadeFromSnapshot(item);
  const conferidoAt = toIsoString(item.createdAt, now);
  const unitizadorCodigo =
    typeof item.unitizadorCodigo === 'string' && item.unitizadorCodigo.trim()
      ? item.unitizadorCodigo.trim()
      : undefined;

  return {
    id: serverItemId || crypto.randomUUID(),
    demandId,
    sku: resolveSkuFromItem(item, skuByProdutoId),
    lote: item.loteRecebido ? String(item.loteRecebido) : undefined,
    validade,
    quantity,
    recebidaCaixa: recebidaCaixa > 0 ? recebidaCaixa : undefined,
    recebidaUnidade: recebidaUnidade > 0 ? recebidaUnidade : undefined,
    peso:
      item.pesoRecebido != null && Number.isFinite(Number(item.pesoRecebido))
        ? Number(item.pesoRecebido)
        : undefined,
    unitizadorCodigo,
    conferidoAt,
    syncStatus: 'synced',
    serverItemId: serverItemId || undefined,
    updatedAt: now,
  };
}

export function mapServerAvariaToRecord(
  item: SnapshotAvaria,
  demandId: string,
  now: number,
  skuByProdutoId?: Map<string, string>,
): DamageRecord {
  const serverAvariaId = item.id ? String(item.id) : undefined;
  const sku = resolveOptionalSkuFromItem(item, skuByProdutoId);
  const quantidadeCaixas = Number(item.quantidadeCaixas ?? item.quantidadeCaixa ?? 0);
  const quantidadeUnidades = Number(item.quantidadeUnidades ?? item.quantidadeUnidade ?? 0);
  const quantity = quantidadeCaixas + quantidadeUnidades;

  return {
    id: serverAvariaId ?? crypto.randomUUID(),
    demandId,
    sku,
    description: sku ? `Avaria SKU ${sku}` : 'Avaria geral',
    quantity,
    motivo: String(item.tipo ?? ''),
    tipo: String(item.tipo ?? ''),
    natureza: String(item.natureza ?? ''),
    causa: String(item.causa ?? ''),
    lote: item.lote ? String(item.lote) : undefined,
    quantidadeCaixa: quantidadeCaixas > 0 ? quantidadeCaixas : undefined,
    quantidadeUnidade: quantidadeUnidades > 0 ? quantidadeUnidades : undefined,
    registradoAt: toIsoString(item.createdAt ?? item.registradoAt, now),
    syncStatus: 'synced',
    serverAvariaId,
    updatedAt: now,
  };
}
