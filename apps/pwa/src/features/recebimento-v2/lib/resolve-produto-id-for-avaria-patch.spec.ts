import { describe, expect, it, vi, beforeEach } from 'vitest';

import { getExpectedItemBySkuDirect } from '@/lib/replicache/queries';

import { resolveProductIdForAvariaPatch } from './resolve-produto-id-for-avaria-patch';
import {
  resolveProdutoIdForSkuV2,
  resolveProductForSkuV2,
} from './resolve-produto-conferencia-v2';

vi.mock('./resolve-produto-conferencia-v2', () => ({
  normalizeSkuParam: (sku: string) => sku.trim(),
  resolveProductForSkuV2: vi.fn(),
  resolveProdutoIdForSkuV2: vi.fn(),
}));

vi.mock('@/lib/replicache/queries', () => ({
  getExpectedItemBySkuDirect: vi.fn(),
}));

describe('resolveProductIdForAvariaPatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns Dexie produtoId when valid', async () => {
    vi.mocked(resolveProductForSkuV2).mockResolvedValue(null);
    vi.mocked(resolveProdutoIdForSkuV2).mockResolvedValue('produto-uuid-1');

    await expect(resolveProductIdForAvariaPatch('demand-1', '610101544')).resolves.toBe(
      'produto-uuid-1',
    );
    expect(getExpectedItemBySkuDirect).not.toHaveBeenCalled();
  });

  it('falls back to Replicache when Dexie returns SKU fallback', async () => {
    vi.mocked(resolveProductForSkuV2).mockResolvedValue(null);
    vi.mocked(resolveProdutoIdForSkuV2).mockResolvedValue('610101544');
    vi.mocked(getExpectedItemBySkuDirect).mockResolvedValue({
      produtoId: 'produto-from-replicache',
    } as never);

    await expect(resolveProductIdForAvariaPatch('demand-1', '610101544')).resolves.toBe(
      'produto-from-replicache',
    );
  });
});
