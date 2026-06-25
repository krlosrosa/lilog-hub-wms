import { describe, expect, it, vi } from 'vitest';

import { addItemRecebimentoDb } from '../../../src/infra/db/recebimento/add-item-recebimento.drizzle.js';

describe('addItemRecebimentoDb', () => {
  it('returns existing row when the same conferencia is submitted again', async () => {
    const existing = {
      id: 'item-1',
      recebimentoId: 'rec-1',
      produtoId: 'prod-1',
      quantidadeRecebida: '48.000',
      unidadeMedida: 'UN',
      loteRecebido: '111111',
      pesoRecebido: null,
      validade: null,
      numeroSerie: null,
      createdAt: new Date(),
    };

    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existing]),
        }),
      }),
      update: vi.fn(),
      insert: vi.fn(),
    };

    const result = await addItemRecebimentoDb(
      db as never,
      'rec-1',
      {
        produtoId: 'prod-1',
        quantidadeRecebida: 48,
        unidadeMedida: 'UN',
        loteRecebido: '111111',
      },
    );

    expect(result.id).toBe('item-1');
    expect(db.update).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('replaces quantity when conferindo novamente o mesmo produto e lote', async () => {
    const existing = {
      id: 'item-1',
      recebimentoId: 'rec-1',
      produtoId: 'prod-1',
      quantidadeRecebida: '24.000',
      unidadeMedida: 'UN',
      loteRecebido: '111111',
      pesoRecebido: null,
      validade: null,
      numeroSerie: null,
      createdAt: new Date(),
    };

    const returning = vi.fn().mockResolvedValue([
      {
        ...existing,
        quantidadeRecebida: '48.000',
      },
    ]);

    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existing]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning,
          }),
        }),
      }),
      insert: vi.fn(),
    };

    const result = await addItemRecebimentoDb(
      db as never,
      'rec-1',
      {
        produtoId: 'prod-1',
        quantidadeRecebida: 48,
        unidadeMedida: 'UN',
        loteRecebido: '111111',
      },
    );

    expect(result.quantidadeRecebida).toBe(48);
    expect(db.insert).not.toHaveBeenCalled();
  });
});
