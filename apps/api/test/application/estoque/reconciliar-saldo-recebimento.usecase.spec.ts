import { describe, expect, it, vi } from 'vitest';

import { MovimentarEstoqueUseCase } from '../../../src/application/usecases/estoque/movimentar-estoque.usecase.js';
import { ReconciliarSaldoRecebimentoUseCase } from '../../../src/application/usecases/estoque/reconciliar-saldo-recebimento.usecase.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../src/domain/repositories/estoque/estoque.repository.js';

const produtoId = '00000000-0000-4000-8000-000000000010';

describe('ReconciliarSaldoRecebimentoUseCase', () => {
  it('adjusts TRANSF balance to match conferido quantity in base units', async () => {
    const estoqueRepository: Partial<IEstoqueRepository> = {
      findDepositoByCodigo: vi.fn().mockResolvedValue({ id: 'dep-transf' }),
      getNetSaldoTransfPorDocumento: vi.fn().mockResolvedValue([
        {
          produtoId,
          quantidade: 20,
          unidadeMedida: 'UN',
          lote: '',
          validade: null,
          numeroSerie: '',
        },
      ]),
    };

    const ajustarSaldo = vi.fn().mockResolvedValue({ id: 'mov' });
    const movimentarEstoqueUseCase = {
      ajustarSaldo,
    } as unknown as MovimentarEstoqueUseCase;

    const useCase = new ReconciliarSaldoRecebimentoUseCase(
      estoqueRepository as IEstoqueRepository,
      movimentarEstoqueUseCase,
    );

    await useCase.execute({
      unidadeId: 'UN-1',
      preRecebimentoId: '00000000-0000-4000-8000-000000000099',
      itensEsperados: [
        {
          id: 'pre-item-1',
          preRecebimentoId: 'pre-1',
          produtoId,
          quantidadeEsperada: 20,
          unidadeMedida: 'UN',
          unidadesPorCaixa: 12,
          loteEsperado: null,
          pesoEsperado: null,
          validadeEsperada: null,
          createdAt: new Date(),
        },
      ],
      itensConferidos: [
        {
          id: 'item-1',
          recebimentoId: 'rec-1',
          produtoId,
          quantidadeRecebida: 15,
          unidadeMedida: 'UN',
          loteRecebido: 'L1',
          pesoRecebido: null,
          validade: null,
          numeroSerie: null,
          createdAt: new Date(),
        },
      ],
      operatorId: 1,
    });

    expect(ajustarSaldo).toHaveBeenCalledWith(
      expect.objectContaining({
        produtoId,
        delta: 15,
        lote: 'L1',
        unidadeMedida: 'UN',
        motivo: 'recebimento_reconciliacao',
      }),
    );
    expect(ajustarSaldo).toHaveBeenCalledWith(
      expect.objectContaining({
        produtoId,
        delta: -20,
        lote: undefined,
        unidadeMedida: 'UN',
        motivo: 'recebimento_reconciliacao',
      }),
    );
  });

  it('relocates saldo to conferido lote when quantity already matches', async () => {
    const estoqueRepository: Partial<IEstoqueRepository> = {
      findDepositoByCodigo: vi.fn().mockResolvedValue({ id: 'dep-transf' }),
      getNetSaldoTransfPorDocumento: vi.fn().mockResolvedValue([
        {
          produtoId,
          quantidade: 10,
          unidadeMedida: 'UN',
          lote: '',
          validade: null,
          numeroSerie: '',
        },
      ]),
    };

    const ajustarSaldo = vi.fn().mockResolvedValue({ id: 'mov' });
    const movimentarEstoqueUseCase = {
      ajustarSaldo,
    } as unknown as MovimentarEstoqueUseCase;

    const useCase = new ReconciliarSaldoRecebimentoUseCase(
      estoqueRepository as IEstoqueRepository,
      movimentarEstoqueUseCase,
    );

    await useCase.execute({
      unidadeId: 'UN-1',
      preRecebimentoId: '00000000-0000-4000-8000-000000000099',
      itensEsperados: [
        {
          id: 'pre-item-1',
          preRecebimentoId: 'pre-1',
          produtoId,
          quantidadeEsperada: 10,
          unidadeMedida: 'UN',
          unidadesPorCaixa: 12,
          loteEsperado: null,
          pesoEsperado: null,
          validadeEsperada: null,
          createdAt: new Date(),
        },
      ],
      itensConferidos: [
        {
          id: 'item-1',
          recebimentoId: 'rec-1',
          produtoId,
          quantidadeRecebida: 10,
          unidadeMedida: 'UN',
          loteRecebido: 'LOTE-2026',
          pesoRecebido: null,
          validade: new Date('2027-12-31'),
          numeroSerie: null,
          createdAt: new Date(),
        },
      ],
      operatorId: 1,
    });

    expect(ajustarSaldo).toHaveBeenCalledWith(
      expect.objectContaining({
        delta: 10,
        lote: 'LOTE-2026',
        validade: new Date('2027-12-31'),
      }),
    );
    expect(ajustarSaldo).toHaveBeenCalledWith(
      expect.objectContaining({
        delta: -10,
        lote: undefined,
      }),
    );
  });

  it('reduces excess across multiple TRANSF buckets before distributing', async () => {
    const estoqueRepository: Partial<IEstoqueRepository> = {
      findDepositoByCodigo: vi.fn().mockResolvedValue({ id: 'dep-transf' }),
      getNetSaldoTransfPorDocumento: vi.fn().mockResolvedValue([
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
      ]),
    };

    const ajustarSaldo = vi.fn().mockResolvedValue({ id: 'mov' });
    const movimentarEstoqueUseCase = {
      ajustarSaldo,
    } as unknown as MovimentarEstoqueUseCase;

    const useCase = new ReconciliarSaldoRecebimentoUseCase(
      estoqueRepository as IEstoqueRepository,
      movimentarEstoqueUseCase,
    );

    await useCase.execute({
      unidadeId: 'UN-1',
      preRecebimentoId: '00000000-0000-4000-8000-000000000099',
      itensEsperados: [
        {
          id: 'pre-item-1',
          preRecebimentoId: 'pre-1',
          produtoId,
          quantidadeEsperada: 5,
          unidadeMedida: 'CX',
          unidadesPorCaixa: 12,
          loteEsperado: null,
          pesoEsperado: null,
          validadeEsperada: null,
          createdAt: new Date(),
        },
      ],
      itensConferidos: [
        {
          id: 'item-1',
          recebimentoId: 'rec-1',
          produtoId,
          quantidadeRecebida: 4,
          unidadeMedida: 'CX',
          loteRecebido: null,
          pesoRecebido: null,
          validade: null,
          numeroSerie: null,
          createdAt: new Date(),
        },
      ],
      operatorId: 1,
    });

    expect(ajustarSaldo).toHaveBeenCalledWith(
      expect.objectContaining({
        delta: 48,
        lote: undefined,
        unidadeMedida: 'UN',
      }),
    );
    expect(ajustarSaldo).toHaveBeenCalledWith(
      expect.objectContaining({
        delta: -48,
        lote: 'A',
        unidadeMedida: 'UN',
      }),
    );
    expect(ajustarSaldo).toHaveBeenCalledWith(
      expect.objectContaining({
        delta: -36,
        lote: 'B',
        unidadeMedida: 'UN',
      }),
    );
  });

  it('converts conferido in CX to base units before reconciling', async () => {
    const estoqueRepository: Partial<IEstoqueRepository> = {
      findDepositoByCodigo: vi.fn().mockResolvedValue({ id: 'dep-transf' }),
      getNetSaldoTransfPorDocumento: vi.fn().mockResolvedValue([
        {
          produtoId,
          quantidade: 24,
          unidadeMedida: 'UN',
          lote: '',
          validade: null,
          numeroSerie: '',
        },
      ]),
    };

    const ajustarSaldo = vi.fn().mockResolvedValue({ id: 'mov' });
    const movimentarEstoqueUseCase = {
      ajustarSaldo,
    } as unknown as MovimentarEstoqueUseCase;

    const useCase = new ReconciliarSaldoRecebimentoUseCase(
      estoqueRepository as IEstoqueRepository,
      movimentarEstoqueUseCase,
    );

    await useCase.execute({
      unidadeId: 'UN-1',
      preRecebimentoId: '00000000-0000-4000-8000-000000000099',
      itensEsperados: [
        {
          id: 'pre-item-1',
          preRecebimentoId: 'pre-1',
          produtoId,
          quantidadeEsperada: 2,
          unidadeMedida: 'CX',
          unidadesPorCaixa: 12,
          loteEsperado: null,
          pesoEsperado: null,
          validadeEsperada: null,
          createdAt: new Date(),
        },
      ],
      itensConferidos: [
        {
          id: 'item-1',
          recebimentoId: 'rec-1',
          produtoId,
          quantidadeRecebida: 1,
          unidadeMedida: 'CX',
          loteRecebido: null,
          pesoRecebido: null,
          validade: null,
          numeroSerie: null,
          createdAt: new Date(),
        },
      ],
      operatorId: 1,
    });

    expect(ajustarSaldo).toHaveBeenCalledWith(
      expect.objectContaining({
        produtoId,
        delta: -12,
        unidadeMedida: 'UN',
      }),
    );
  });
});
