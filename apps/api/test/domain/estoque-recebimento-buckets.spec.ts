import { describe, expect, it } from 'vitest';

import {
  drainSaldoTransfBuckets,
  groupSaldoTransfBucketsByProduto,
  sumSaldoTransfBuckets,
} from '../../src/domain/services/estoque-recebimento-buckets.js';

const produtoId = 'prod-1';

describe('estoque-recebimento-buckets', () => {
  it('drains buckets in order until quantity is fulfilled', () => {
    const buckets = [
      {
        produtoId,
        quantidade: 48,
        unidadeMedida: 'UN',
        lote: 'A',
        validade: null,
        numeroSerie: '',
      },
      {
        produtoId,
        quantidade: 36,
        unidadeMedida: 'UN',
        lote: 'B',
        validade: null,
        numeroSerie: '',
      },
    ];

    const result = drainSaldoTransfBuckets({
      buckets,
      quantidade: 12,
    });

    expect(result.drains).toEqual([
      expect.objectContaining({ quantidade: 12, bucket: expect.objectContaining({ lote: 'A' }) }),
    ]);
    expect(sumSaldoTransfBuckets(result.buckets)).toBe(72);
  });

  it('groups buckets by produto', () => {
    const grouped = groupSaldoTransfBucketsByProduto([
      {
        produtoId,
        quantidade: 10,
        unidadeMedida: 'UN',
        lote: '',
        validade: null,
        numeroSerie: '',
      },
      {
        produtoId: 'prod-2',
        quantidade: 5,
        unidadeMedida: 'UN',
        lote: '',
        validade: null,
        numeroSerie: '',
      },
    ]);

    expect(grouped.get(produtoId)).toHaveLength(1);
    expect(grouped.get('prod-2')).toHaveLength(1);
  });
});
