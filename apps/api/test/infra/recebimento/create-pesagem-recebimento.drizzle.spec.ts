import { describe, expect, it, vi } from 'vitest';

import { createPesagemRecebimentoDb } from '../../../src/infra/db/recebimento/create-pesagem-recebimento.drizzle.js';

const CLIENT_CONF_ID = 'conf-uuid-001';

const existingPesagemRow = {
  id: 'pesagem-existing',
  recebimentoItemId: 'item-1',
  unidadeId: 'ITB',
  sequenciaCaixa: 1,
  etiquetaCodigo: 'ETQ-001',
  pesoKg: '12.500',
  conferidoPorId: null,
  clientConferenceId: CLIENT_CONF_ID,
  createdAt: new Date(),
};

describe('createPesagemRecebimentoDb', () => {
  it('returns existing pesagem when clientConferenceId already exists', async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existingPesagemRow]),
          }),
        }),
      }),
      insert: vi.fn(),
    };

    const result = await createPesagemRecebimentoDb(db as never, {
      recebimentoItemId: 'item-1',
      unidadeId: 'ITB',
      pesoKg: 12.5,
      etiquetaCodigo: 'ETQ-001',
      clientConferenceId: CLIENT_CONF_ID,
    });

    expect(result.id).toBe('pesagem-existing');
    expect(result.clientConferenceId).toBe(CLIENT_CONF_ID);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('creates new pesagem when clientConferenceId is not found', async () => {
    const insertedRow = {
      ...existingPesagemRow,
      id: 'pesagem-new',
    };

    const db = {
      select: vi
        .fn()
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
        }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([insertedRow]),
          }),
        }),
      }),
    };

    const result = await createPesagemRecebimentoDb(db as never, {
      recebimentoItemId: 'item-1',
      unidadeId: 'ITB',
      pesoKg: 12.5,
      etiquetaCodigo: 'ETQ-001',
      clientConferenceId: CLIENT_CONF_ID,
    });

    expect(result.id).toBe('pesagem-new');
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it('returns existing pesagem after onConflictDoNothing race', async () => {
    const db = {
      select: vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ maxSeq: 1 }]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([existingPesagemRow]),
            }),
          }),
        }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };

    const result = await createPesagemRecebimentoDb(db as never, {
      recebimentoItemId: 'item-1',
      unidadeId: 'ITB',
      pesoKg: 12.5,
      clientConferenceId: CLIENT_CONF_ID,
    });

    expect(result.id).toBe('pesagem-existing');
    expect(db.insert).toHaveBeenCalledTimes(1);
  });
});
