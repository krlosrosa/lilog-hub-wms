import { describe, expect, it, vi } from 'vitest';

import { DistribuirSaldoRecebimentoFinalizadoUseCase } from '../../../src/application/usecases/estoque/distribuir-saldo-recebimento-finalizado.usecase.js';
import { MovimentarEstoqueUseCase } from '../../../src/application/usecases/estoque/movimentar-estoque.usecase.js';
import { ReconciliarSaldoRecebimentoUseCase } from '../../../src/application/usecases/estoque/reconciliar-saldo-recebimento.usecase.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../src/domain/repositories/estoque/estoque.repository.js';
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../src/domain/repositories/produto/produto.repository.js';

const produtoId = '00000000-0000-4000-8000-000000000010';

const itensEsperados = [
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
];

describe('DistribuirSaldoRecebimentoFinalizadoUseCase', () => {
  it('reconciles then splits intact stock to AGUARD_ARM and damage to AVARIA', async () => {
    const depositos = {
      TRANSF: { id: 'dep-transf' },
      AGUARD_ARM: { id: 'dep-arm' },
      AVARIA: { id: 'dep-avaria' },
      DEB_TRANSP: { id: 'dep-deb' },
      QUARENTENA: { id: 'dep-quar' },
    };

    const estoqueRepository: Partial<IEstoqueRepository> = {
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
      findDepositoByCodigo: vi.fn(async (_unidadeId, codigo) => ({
        id: depositos[codigo as keyof typeof depositos].id,
        codigo,
      })),
    };

    const produtoRepository: Partial<IProdutoRepository> = {
      findById: vi.fn().mockResolvedValue({ unidadesPorCaixa: 12 }),
    };

    const transferirDeposito = vi.fn().mockResolvedValue({ id: 'mov' });
    const registrarEntrada = vi.fn().mockResolvedValue({ id: 'mov-deb' });
    const movimentarEstoqueUseCase = {
      transferirDeposito,
      registrarEntrada,
    } as unknown as MovimentarEstoqueUseCase;

    const reconciliarExecute = vi.fn().mockResolvedValue(undefined);
    const reconciliarSaldoRecebimentoUseCase = {
      execute: reconciliarExecute,
    } as unknown as ReconciliarSaldoRecebimentoUseCase;

    const useCase = new DistribuirSaldoRecebimentoFinalizadoUseCase(
      estoqueRepository as IEstoqueRepository,
      produtoRepository as IProdutoRepository,
      movimentarEstoqueUseCase,
      reconciliarSaldoRecebimentoUseCase,
    );
    const result = await useCase.execute({
      unidadeId: 'UN-1',
      preRecebimentoId: '00000000-0000-4000-8000-000000000099',
      itensEsperados,
      itensConferidos: [
        {
          id: 'item-1',
          recebimentoId: 'rec-1',
          produtoId,
          quantidadeRecebida: 10,
          unidadeMedida: 'UN',
          loteRecebido: null,
          pesoRecebido: null,
          validade: null,
          numeroSerie: null,
          createdAt: new Date(),
        },
      ],
      divergencias: [],
      avarias: [
        {
          id: 'av-1',
          recebimentoId: 'rec-1',
          produtoId,
          tipo: 'avaria',
          natureza: 'embalagem',
          causa: 'impacto',
          quantidadeCaixas: 0,
          quantidadeUnidades: 2,
          photoCount: 0,
          replicado: false,
          operatorId: 1,
          createdAt: new Date(),
        },
      ],
      operatorId: 1,
    });

    expect(reconciliarExecute).toHaveBeenCalled();
    expect(transferirDeposito).toHaveBeenCalledTimes(2);
    expect(transferirDeposito).toHaveBeenCalledWith(
      expect.objectContaining({
        depositoDestinoId: 'dep-avaria',
        quantidade: 2,
        motivo: 'recebimento_avaria',
      }),
    );
    expect(transferirDeposito).toHaveBeenCalledWith(
      expect.objectContaining({
        depositoDestinoId: 'dep-arm',
        quantidade: 8,
        motivo: 'recebimento_finalizado',
      }),
    );
    expect(result.itensAguardandoArmazenagem).toHaveLength(1);
    expect(result.itensAguardandoArmazenagem[0]?.quantidade).toBe(8);
  });

  it('converts avaria in CX using unidadesPorCaixa from pre-recebimento', async () => {
    const depositos = {
      TRANSF: { id: 'dep-transf' },
      AGUARD_ARM: { id: 'dep-arm' },
      AVARIA: { id: 'dep-avaria' },
      DEB_TRANSP: { id: 'dep-deb' },
      QUARENTENA: { id: 'dep-quar' },
    };

    const estoqueRepository: Partial<IEstoqueRepository> = {
      getNetSaldoTransfPorDocumento: vi.fn().mockResolvedValue([
        {
          produtoId,
          quantidade: 19,
          unidadeMedida: 'UN',
          lote: '',
          validade: null,
          numeroSerie: '',
        },
      ]),
      findDepositoByCodigo: vi.fn(async (_unidadeId, codigo) => ({
        id: depositos[codigo as keyof typeof depositos].id,
        codigo,
      })),
    };

    const produtoRepository: Partial<IProdutoRepository> = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const transferirDeposito = vi.fn().mockResolvedValue({ id: 'mov' });
    const registrarEntrada = vi.fn().mockResolvedValue({ id: 'mov-deb' });
    const movimentarEstoqueUseCase = {
      transferirDeposito,
      registrarEntrada,
    } as unknown as MovimentarEstoqueUseCase;

    const reconciliarSaldoRecebimentoUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReconciliarSaldoRecebimentoUseCase;

    const useCase = new DistribuirSaldoRecebimentoFinalizadoUseCase(
      estoqueRepository as IEstoqueRepository,
      produtoRepository as IProdutoRepository,
      movimentarEstoqueUseCase,
      reconciliarSaldoRecebimentoUseCase,
    );

    await useCase.execute({
      unidadeId: 'UN-1',
      preRecebimentoId: '00000000-0000-4000-8000-000000000099',
      itensEsperados,
      itensConferidos: [
        {
          id: 'item-1',
          recebimentoId: 'rec-1',
          produtoId,
          quantidadeRecebida: 19,
          unidadeMedida: 'UN',
          loteRecebido: null,
          pesoRecebido: null,
          validade: null,
          numeroSerie: null,
          createdAt: new Date(),
        },
      ],
      divergencias: [],
      avarias: [
        {
          id: 'av-1',
          recebimentoId: 'rec-1',
          produtoId,
          tipo: 'avaria',
          natureza: 'embalagem',
          causa: 'impacto',
          quantidadeCaixas: 1,
          quantidadeUnidades: 0,
          photoCount: 0,
          replicado: false,
          operatorId: 1,
          createdAt: new Date(),
        },
      ],
      operatorId: 1,
    });

    expect(transferirDeposito).toHaveBeenCalledWith(
      expect.objectContaining({
        depositoDestinoId: 'dep-avaria',
        quantidade: 12,
      }),
    );
    expect(transferirDeposito).toHaveBeenCalledWith(
      expect.objectContaining({
        depositoDestinoId: 'dep-arm',
        quantidade: 7,
      }),
    );
  });

  it('aggregates multiple TRANSF buckets and allocates 36 AGUARD_ARM, 12 AVARIA and 12 DEB_TRANSP', async () => {
    const depositos = {
      TRANSF: { id: 'dep-transf' },
      AGUARD_ARM: { id: 'dep-arm' },
      AVARIA: { id: 'dep-avaria' },
      DEB_TRANSP: { id: 'dep-deb' },
      QUARENTENA: { id: 'dep-quar' },
    };

    const estoqueRepository: Partial<IEstoqueRepository> = {
      getNetSaldoTransfPorDocumento: vi.fn().mockResolvedValue([
        {
          produtoId,
          quantidade: 12,
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
      findDepositoByCodigo: vi.fn(async (_unidadeId, codigo) => ({
        id: depositos[codigo as keyof typeof depositos].id,
        codigo,
      })),
    };

    const produtoRepository: Partial<IProdutoRepository> = {
      findById: vi.fn(),
    };

    const transferirDeposito = vi.fn().mockResolvedValue({ id: 'mov' });
    const registrarEntrada = vi.fn().mockResolvedValue({ id: 'mov-deb' });
    const movimentarEstoqueUseCase = {
      transferirDeposito,
      registrarEntrada,
    } as unknown as MovimentarEstoqueUseCase;

    const reconciliarSaldoRecebimentoUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReconciliarSaldoRecebimentoUseCase;

    const useCase = new DistribuirSaldoRecebimentoFinalizadoUseCase(
      estoqueRepository as IEstoqueRepository,
      produtoRepository as IProdutoRepository,
      movimentarEstoqueUseCase,
      reconciliarSaldoRecebimentoUseCase,
    );

    const result = await useCase.execute({
      unidadeId: 'UN-1',
      preRecebimentoId: '00000000-0000-4000-8000-000000000099',
      itensEsperados: [
        {
          ...itensEsperados[0]!,
          quantidadeEsperada: 5,
          unidadeMedida: 'CX',
          unidadesPorCaixa: 12,
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
      divergencias: [
        {
          id: 'div-1',
          recebimentoId: 'rec-1',
          produtoId,
          tipoDivergencia: 'quantidade_menor',
          quantidadeEsperada: 60,
          quantidadeRecebida: 48,
          descricao: 'falta de 1 caixa',
          createdAt: new Date(),
        },
      ],
      avarias: [
        {
          id: 'av-1',
          recebimentoId: 'rec-1',
          produtoId,
          tipo: 'avaria',
          natureza: 'embalagem',
          causa: 'impacto',
          quantidadeCaixas: 1,
          quantidadeUnidades: 0,
          photoCount: 0,
          replicado: false,
          operatorId: 1,
          createdAt: new Date(),
        },
      ],
      operatorId: 1,
    });

    const totalAguardArm = transferirDeposito.mock.calls
      .filter((call) => call[0].depositoDestinoId === 'dep-arm')
      .reduce((sum, call) => sum + call[0].quantidade, 0);
    const totalAvaria = transferirDeposito.mock.calls
      .filter((call) => call[0].depositoDestinoId === 'dep-avaria')
      .reduce((sum, call) => sum + call[0].quantidade, 0);

    expect(totalAvaria).toBe(12);
    expect(totalAguardArm).toBe(36);
    expect(result.itensAguardandoArmazenagem).toHaveLength(1);
    expect(result.itensAguardandoArmazenagem[0]?.quantidade).toBe(36);
    expect(registrarEntrada).toHaveBeenCalledWith(
      expect.objectContaining({
        depositoId: 'dep-deb',
        quantidade: 12,
        motivo: 'recebimento_falta',
      }),
    );
  });

  it('registers shortage in DEB_TRANSP when divergencia quantidade_menor exists', async () => {
    const depositos = {
      TRANSF: { id: 'dep-transf' },
      AGUARD_ARM: { id: 'dep-arm' },
      AVARIA: { id: 'dep-avaria' },
      DEB_TRANSP: { id: 'dep-deb' },
      QUARENTENA: { id: 'dep-quar' },
    };

    const estoqueRepository: Partial<IEstoqueRepository> = {
      getNetSaldoTransfPorDocumento: vi.fn().mockResolvedValue([
        {
          produtoId,
          quantidade: 15,
          unidadeMedida: 'UN',
          lote: '',
          validade: null,
          numeroSerie: '',
        },
      ]),
      findDepositoByCodigo: vi.fn(async (_unidadeId, codigo) => ({
        id: depositos[codigo as keyof typeof depositos].id,
        codigo,
      })),
    };

    const produtoRepository: Partial<IProdutoRepository> = {
      findById: vi.fn(),
    };

    const transferirDeposito = vi.fn().mockResolvedValue({ id: 'mov' });
    const registrarEntrada = vi.fn().mockResolvedValue({ id: 'mov-deb' });
    const movimentarEstoqueUseCase = {
      transferirDeposito,
      registrarEntrada,
    } as unknown as MovimentarEstoqueUseCase;

    const reconciliarSaldoRecebimentoUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReconciliarSaldoRecebimentoUseCase;

    const useCase = new DistribuirSaldoRecebimentoFinalizadoUseCase(
      estoqueRepository as IEstoqueRepository,
      produtoRepository as IProdutoRepository,
      movimentarEstoqueUseCase,
      reconciliarSaldoRecebimentoUseCase,
    );

    await useCase.execute({
      unidadeId: 'UN-1',
      preRecebimentoId: '00000000-0000-4000-8000-000000000099',
      itensEsperados: [
        {
          ...itensEsperados[0]!,
          quantidadeEsperada: 20,
        },
      ],
      itensConferidos: [
        {
          id: 'item-1',
          recebimentoId: 'rec-1',
          produtoId,
          quantidadeRecebida: 15,
          unidadeMedida: 'UN',
          loteRecebido: null,
          pesoRecebido: null,
          validade: null,
          numeroSerie: null,
          createdAt: new Date(),
        },
      ],
      divergencias: [
        {
          id: 'div-1',
          recebimentoId: 'rec-1',
          produtoId,
          tipoDivergencia: 'quantidade_menor',
          quantidadeEsperada: 20,
          quantidadeRecebida: 15,
          descricao: 'falta',
          createdAt: new Date(),
        },
      ],
      avarias: [],
      operatorId: 1,
    });

    expect(registrarEntrada).toHaveBeenCalledWith(
      expect.objectContaining({
        depositoId: 'dep-deb',
        produtoId,
        quantidade: 5,
        unidadeMedida: 'UN',
        motivo: 'recebimento_falta',
        natureza: 'debito',
      }),
    );
  });
});
