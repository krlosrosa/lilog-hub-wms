import { describe, expect, it, vi } from 'vitest';

import {
  consumirReservaDb,
  criarReservaDb,
  getSaldoDisponivelDb,
  liberarReservaDb,
} from '../../../src/infra/db/estoque/reserva-estoque.drizzle.js';

const reservaRow = {
  id: 'res-1',
  unidadeId: 'U1',
  produtoId: 'P1',
  depositoId: 'dep-1',
  enderecoId: null,
  lote: '',
  numeroSerie: '',
  quantidade: '10.0000',
  quantidadeAtendida: '0.0000',
  status: 'ativa' as const,
  origem: 'pedido' as const,
  documentoRef: 'pedido:123',
  motivo: null,
  operatorId: null,
  expiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('getSaldoDisponivelDb', () => {
  it('retorna saldo físico menos reservas pendentes', async () => {
    let call = 0;
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(async () => {
            call += 1;
            if (call === 1) {
              return [{ total: '100.0000' }];
            }
            return [{ total: '30.0000' }];
          }),
        }),
      }),
    };

    const result = await getSaldoDisponivelDb(db as never, {
      unidadeId: 'U1',
      produtoId: 'P1',
      depositoId: 'dep-1',
    });

    expect(result).toBe(70);
  });
});

describe('criarReservaDb', () => {
  it('cria reserva quando há saldo disponível', async () => {
    let call = 0;
    const returning = vi.fn().mockResolvedValue([reservaRow]);

    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(async () => {
            call += 1;
            if (call === 1) {
              return [{ total: '100.0000' }];
            }
            return [{ total: '0' }];
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({ returning }),
      }),
    };

    const result = await criarReservaDb(db as never, {
      unidadeId: 'U1',
      produtoId: 'P1',
      depositoId: 'dep-1',
      quantidade: 10,
      origem: 'pedido',
      documentoRef: 'pedido:123',
    });

    expect(result.id).toBe('res-1');
    expect(result.quantidade).toBe(10);
    expect(db.insert).toHaveBeenCalled();
  });

  it('rejeita reserva acima do saldo disponível', async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ total: '5.0000' }]),
        }),
      }),
      insert: vi.fn(),
    };

    await expect(
      criarReservaDb(db as never, {
        unidadeId: 'U1',
        produtoId: 'P1',
        depositoId: 'dep-1',
        quantidade: 10,
        origem: 'pedido',
        documentoRef: 'pedido:123',
      }),
    ).rejects.toThrow('Quantidade solicitada excede o saldo disponível');

    expect(db.insert).not.toHaveBeenCalled();
  });
});

describe('liberarReservaDb', () => {
  it('cancela reserva ativa', async () => {
    const returning = vi.fn().mockResolvedValue([
      { ...reservaRow, status: 'cancelada' },
    ]);

    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([reservaRow]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({ returning }),
        }),
      }),
    };

    const result = await liberarReservaDb(db as never, {
      reservaId: 'res-1',
    });

    expect(result.status).toBe('cancelada');
  });
});

describe('consumirReservaDb', () => {
  it('marca reserva como atendida quando consome total', async () => {
    const returning = vi.fn().mockResolvedValue([
      {
        ...reservaRow,
        quantidadeAtendida: '10.0000',
        status: 'atendida',
      },
    ]);

    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([reservaRow]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({ returning }),
        }),
      }),
    };

    const result = await consumirReservaDb(db as never, {
      reservaId: 'res-1',
      quantidade: 10,
    });

    expect(result.status).toBe('atendida');
    expect(result.quantidadeAtendida).toBe(10);
  });

  it('marca reserva como parcial quando consome parcialmente', async () => {
    const returning = vi.fn().mockResolvedValue([
      {
        ...reservaRow,
        quantidadeAtendida: '4.0000',
        status: 'parcial',
      },
    ]);

    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([reservaRow]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({ returning }),
        }),
      }),
    };

    const result = await consumirReservaDb(db as never, {
      reservaId: 'res-1',
      quantidade: 4,
    });

    expect(result.status).toBe('parcial');
    expect(result.quantidadeAtendida).toBe(4);
  });

  it('rejeita consumo acima do pendente', async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([reservaRow]),
          }),
        }),
      }),
      update: vi.fn(),
    };

    await expect(
      consumirReservaDb(db as never, {
        reservaId: 'res-1',
        quantidade: 20,
      }),
    ).rejects.toThrow('Quantidade de consumo excede o pendente da reserva');

    expect(db.update).not.toHaveBeenCalled();
  });
});
