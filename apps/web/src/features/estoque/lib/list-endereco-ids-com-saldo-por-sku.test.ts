import { describe, expect, it, vi } from 'vitest';

import { collectEnderecoIdsFromDisponibilidadePages } from '@/features/estoque/lib/estoque-api';

describe('collectEnderecoIdsFromDisponibilidadePages', () => {
  it('paginates with limit 100 until all results are fetched', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({
        items: Array.from({ length: 100 }, (_, index) => ({
          enderecoId: `end-${index}`,
        })),
        total: 150,
      })
      .mockResolvedValueOnce({
        items: Array.from({ length: 50 }, (_, index) => ({
          enderecoId: `end-${100 + index}`,
        })),
        total: 150,
      });

    const result = await collectEnderecoIdsFromDisponibilidadePages(fetchPage);

    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage).toHaveBeenNthCalledWith(1, 1, 100);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 2, 100);
    expect(result.size).toBe(150);
    expect(result.has('end-0')).toBe(true);
    expect(result.has('end-149')).toBe(true);
  });

  it('deduplicates endereco ids across pages', async () => {
    const fetchPage = vi.fn().mockResolvedValueOnce({
      items: [{ enderecoId: 'end-1' }, { enderecoId: 'end-1' }],
      total: 2,
    });

    const result = await collectEnderecoIdsFromDisponibilidadePages(fetchPage);

    expect(result.size).toBe(1);
    expect(result.has('end-1')).toBe(true);
  });
});
