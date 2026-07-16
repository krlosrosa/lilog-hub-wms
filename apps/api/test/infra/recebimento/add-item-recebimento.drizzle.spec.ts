import { describe, expect, it, vi } from 'vitest';

import { addItemRecebimentoDb } from '../../../src/infra/db/recebimento/add-item-recebimento.drizzle.js';

const baseExisting = {
  id: 'item-1',
  recebimentoId: 'rec-1',
  unidadeId: 'ITB',
  produtoId: 'prod-1',
  quantidadeRecebida: '48.000',
  unidadeMedida: 'UN',
  loteRecebido: '111111',
  pesoRecebido: null,
  validade: null,
  numeroSerie: null,
  unitizadorId: null,
  createdAt: new Date(),
};

describe('addItemRecebimentoDb', () => {
  it('inserts a new line when conferindo again the same produto and lote', async () => {
    const insertedItem = {
      ...baseExisting,
      id: 'item-2',
      quantidadeRecebida: '48.000',
    };

    const itemReturning = vi.fn().mockResolvedValue([insertedItem]);

    const db = {
      select: vi.fn(),
      update: vi.fn(),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({ returning: itemReturning }),
      }),
    };

    const result = await addItemRecebimentoDb(
      db as never,
      'rec-1',
      'ITB',
      {
        produtoId: 'prod-1',
        quantidadeRecebida: 48,
        unidadeMedida: 'UN',
        loteRecebido: '111111',
      },
    );

    expect(result.item.id).toBe('item-2');
    expect(result.item.quantidadeRecebida).toBe(48);
    expect(result.pesagem).toBeNull();
    expect(db.select).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it('creates pesagem per caixa and syncs item totals from pesagens for PVAR', async () => {
    const insertedItem = {
      ...baseExisting,
      id: 'item-2',
      quantidadeRecebida: '0',
      pesoRecebido: null,
      unidadeMedida: 'CX',
    };

    const syncedItem = {
      ...insertedItem,
      quantidadeRecebida: '1.000',
      pesoRecebido: '12.500',
    };

    const insertedPesagem = {
      id: 'pesagem-1',
      recebimentoItemId: 'item-2',
      unidadeId: 'ITB',
      sequenciaCaixa: 1,
      etiquetaCodigo: 'ETQ-001',
      pesoKg: '12.500',
      clientConferenceId: 'conf-uuid-001',
      createdAt: new Date(),
    };

    const itemReturning = vi.fn().mockResolvedValue([insertedItem]);
    const pesagemReturning = vi.fn().mockResolvedValue([insertedPesagem]);
    const syncReturning = vi.fn().mockResolvedValue([syncedItem]);

    const db = {
      select: vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ maxSeq: null }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { totalPeso: '12.500', totalCaixas: 1 },
            ]),
          }),
        }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: syncReturning,
          }),
        }),
      }),
      insert: vi
        .fn()
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({ returning: itemReturning }),
        })
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            onConflictDoNothing: vi.fn().mockReturnValue({
              returning: pesagemReturning,
            }),
          }),
        }),
    };

    const result = await addItemRecebimentoDb(
      db as never,
      'rec-1',
      'ITB',
      {
        produtoId: 'prod-1',
        quantidadeRecebida: 1,
        unidadeMedida: 'CX',
        pesoRecebido: 12.5,
        etiquetaCodigo: 'ETQ-001',
      },
      { pesoVariavel: true, clientConferenceId: 'conf-uuid-001' },
    );

    expect(result.item.id).toBe('item-2');
    expect(result.item.quantidadeRecebida).toBe(1);
    expect(result.item.pesoRecebido).toBe(12.5);
    expect(result.pesagem?.id).toBe('pesagem-1');
    expect(result.pesagem?.pesoKg).toBe(12.5);
    expect(result.pesagem?.etiquetaCodigo).toBe('ETQ-001');
    expect(db.insert).toHaveBeenCalledTimes(2);
  });
});
