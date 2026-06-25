import type { NetSaldoTransfPorProduto } from '../repositories/estoque/estoque.repository.js';

export type SaldoTransfBucket = NetSaldoTransfPorProduto;

export type SaldoRastreioBucket = {
  produtoId: string;
  lote: string;
  numeroSerie: string;
  validade: Date | null;
  quantidade: number;
  unidadeMedida: string;
};

export function normalizeLoteRastreio(lote?: string | null): string {
  return lote?.trim() ?? '';
}

export function normalizeNumeroSerieRastreio(
  numeroSerie?: string | null,
): string {
  return numeroSerie?.trim() ?? '';
}

export function buildSaldoRastreioKey(parts: {
  produtoId: string;
  lote?: string | null;
  numeroSerie?: string | null;
}): string {
  return [
    parts.produtoId,
    normalizeLoteRastreio(parts.lote),
    normalizeNumeroSerieRastreio(parts.numeroSerie),
  ].join(':');
}

export function groupSaldoBucketsByRastreio(
  buckets: SaldoRastreioBucket[],
): Map<string, SaldoRastreioBucket> {
  const map = new Map<string, SaldoRastreioBucket>();

  for (const bucket of buckets) {
    if (bucket.quantidade <= 0) {
      continue;
    }

    const key = buildSaldoRastreioKey(bucket);
    const current = map.get(key);

    if (!current) {
      map.set(key, { ...bucket });
      continue;
    }

    current.quantidade += bucket.quantidade;
    current.validade = bucket.validade ?? current.validade;
  }

  return map;
}

export function groupSaldoTransfBucketsByProduto(
  buckets: SaldoTransfBucket[],
): Map<string, SaldoTransfBucket[]> {
  const map = new Map<string, SaldoTransfBucket[]>();

  for (const bucket of buckets) {
    if (bucket.quantidade <= 0) {
      continue;
    }

    const current = map.get(bucket.produtoId) ?? [];
    current.push({ ...bucket });
    map.set(bucket.produtoId, current);
  }

  return map;
}

export function sumSaldoTransfBuckets(buckets: SaldoTransfBucket[]): number {
  return buckets.reduce((total, bucket) => total + bucket.quantidade, 0);
}

export type DrainSaldoTransfBucketInput = {
  buckets: SaldoTransfBucket[];
  quantidade: number;
};

export type DrainSaldoTransfBucketResult = {
  drains: Array<{ bucket: SaldoTransfBucket; quantidade: number }>;
  buckets: SaldoTransfBucket[];
};

export function drainSaldoTransfBuckets({
  buckets,
  quantidade,
}: DrainSaldoTransfBucketInput): DrainSaldoTransfBucketResult {
  const nextBuckets = buckets.map((bucket) => ({ ...bucket }));
  const drains: Array<{ bucket: SaldoTransfBucket; quantidade: number }> = [];
  let remaining = quantidade;

  for (const bucket of nextBuckets) {
    if (remaining <= 0) {
      break;
    }

    if (bucket.quantidade <= 0) {
      continue;
    }

    const take = Math.min(bucket.quantidade, remaining);
    drains.push({ bucket: { ...bucket }, quantidade: take });
    bucket.quantidade -= take;
    remaining -= take;
  }

  return {
    drains,
    buckets: nextBuckets.filter((bucket) => bucket.quantidade > 0),
  };
}
