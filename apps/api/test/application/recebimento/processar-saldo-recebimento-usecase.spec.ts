import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProcessarSaldoRecebimentoUseCase } from '../../../src/application/usecases/recebimento/processar-saldo-recebimento.usecase.js';
import type { IEstoqueRepository } from '../../../src/domain/repositories/estoque/estoque.repository.js';
import type { IMotivoBloqueioSaldoRepository } from '../../../src/domain/repositories/estoque/motivo-bloqueio-saldo.repository.js';

describe('ProcessarSaldoRecebimentoUseCase', () => {
  const estoqueRepository: Partial<IEstoqueRepository> = {
    findDepositoByCodigo: vi.fn(),
    ensureEnderecoVirtualDeposito: vi.fn(),
    existsMovimentacaoByDocumentoRef: vi.fn(),
    upsertSaldoEndereco: vi.fn(),
    registrarMovimentacaoEstoque: vi.fn(),
  };

  const motivoBloqueioSaldoRepository: Partial<IMotivoBloqueioSaldoRepository> =
    {
      ensureMotivosSistemaUnidade: vi.fn(),
      findByCodigo: vi.fn(),
    };

  let useCase: ProcessarSaldoRecebimentoUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(estoqueRepository.findDepositoByCodigo!).mockResolvedValue({
      id: 'dep-1',
      codigo: 'TRANSF',
    } as never);
    vi.mocked(estoqueRepository.ensureEnderecoVirtualDeposito!).mockResolvedValue({
      id: 'end-virtual',
      enderecoMascarado: 'TRANSF-VIRTUAL',
    });
    vi.mocked(estoqueRepository.existsMovimentacaoByDocumentoRef!).mockResolvedValue(
      false,
    );
    vi.mocked(motivoBloqueioSaldoRepository.ensureMotivosSistemaUnidade!).mockResolvedValue(
      [],
    );
    vi.mocked(motivoBloqueioSaldoRepository.findByCodigo!).mockResolvedValue({
      id: 'motivo-sobra',
      codigo: 'RECEBIMENTO_SOBRA',
    } as never);

    useCase = new ProcessarSaldoRecebimentoUseCase(
      estoqueRepository as IEstoqueRepository,
      motivoBloqueioSaldoRepository as IMotivoBloqueioSaldoRepository,
    );
  });

  it('deve preencher motivoBloqueioId para linha bloqueada por sobra', async () => {
    await useCase.execute({
      recebimentoId: 'rec-1',
      unidadeId: 'ITB',
      userId: 1,
      linhas: [
        {
          produtoId: 'prod-1',
          quantidade: 2,
          unidadeMedida: 'UN',
          lote: null,
          validade: null,
          numeroSerie: null,
          status: 'bloqueado',
          tipoAnomalia: 'sobra',
        },
      ],
    });

    expect(motivoBloqueioSaldoRepository.findByCodigo).toHaveBeenCalledWith(
      'ITB',
      'RECEBIMENTO_SOBRA',
    );
    expect(estoqueRepository.upsertSaldoEndereco).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'bloqueado',
        motivoBloqueioId: 'motivo-sobra',
        bloqueadoPor: 1,
      }),
    );
  });

  it('deve preencher motivoBloqueioId para linha bloqueada por avaria', async () => {
    vi.mocked(motivoBloqueioSaldoRepository.findByCodigo!).mockResolvedValue({
      id: 'motivo-avaria',
      codigo: 'RECEBIMENTO_AVARIA',
    } as never);

    await useCase.execute({
      recebimentoId: 'rec-1',
      unidadeId: 'ITB',
      userId: 1,
      linhas: [
        {
          produtoId: 'prod-1',
          quantidade: 2,
          unidadeMedida: 'UN',
          lote: 'L1',
          validade: null,
          numeroSerie: null,
          status: 'bloqueado',
          tipoAnomalia: 'avaria',
        },
      ],
    });

    expect(motivoBloqueioSaldoRepository.findByCodigo).toHaveBeenCalledWith(
      'ITB',
      'RECEBIMENTO_AVARIA',
    );
    expect(estoqueRepository.upsertSaldoEndereco).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'bloqueado',
        motivoBloqueioId: 'motivo-avaria',
        lote: 'L1',
      }),
    );
  });

  it('não deve preencher motivoBloqueioId para linha liberada', async () => {
    await useCase.execute({
      recebimentoId: 'rec-1',
      unidadeId: 'ITB',
      userId: 1,
      linhas: [
        {
          produtoId: 'prod-1',
          quantidade: 10,
          unidadeMedida: 'UN',
          lote: null,
          validade: null,
          numeroSerie: null,
          status: 'liberado',
          tipoAnomalia: null,
        },
      ],
    });

    expect(motivoBloqueioSaldoRepository.findByCodigo).not.toHaveBeenCalled();
    expect(estoqueRepository.upsertSaldoEndereco).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'liberado',
        motivoBloqueioId: null,
      }),
    );
  });
});
