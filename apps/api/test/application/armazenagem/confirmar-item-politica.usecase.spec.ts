import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmarItemArmazenagemUseCase } from '../../../src/application/usecases/armazenagem/confirmar-item-armazenagem.usecase.js';
import { EnsureDepositosUnidadeUseCase } from '../../../src/application/usecases/estoque/ensure-depositos-unidade.usecase.js';
import { MovimentarEstoqueUseCase } from '../../../src/application/usecases/estoque/movimentar-estoque.usecase.js';
import {
  ARMAZENAGEM_REPOSITORY,
  type IArmazenagemRepository,
} from '../../../src/domain/repositories/armazenagem/armazenagem.repository.js';
import {
  ENDERECO_REPOSITORY,
  type IEnderecoRepository,
} from '../../../src/domain/repositories/endereco/endereco.repository.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../src/domain/repositories/estoque/estoque.repository.js';

const demandaId = '00000000-0000-4000-8000-000000000001';
const itemId = '00000000-0000-4000-8000-000000000002';
const enderecoSugeridoId = '00000000-0000-4000-8000-000000000003';
const enderecoConfirmadoId = '00000000-0000-4000-8000-000000000004';
const unidadeId = 'UN-01';

const itemBase = {
  id: itemId,
  demandaId,
  unitizadorId: '00000000-0000-4000-8000-000000000010',
  produtoId: '00000000-0000-4000-8000-000000000006',
  quantidade: 10,
  unidadeMedida: 'CX',
  lote: null,
  validade: null,
  numeroSerie: null,
  enderecoSugeridoId,
  enderecoConfirmadoId: null,
  status: 'pendente' as const,
  produtoSku: 'SKU-001',
  produtoNome: 'Produto Teste',
  enderecoSugeridoLabel: 'A-01-01',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const demandaBase = {
  id: demandaId,
  unidadeId,
  recebimentoId: '00000000-0000-4000-8000-000000000005',
  modoUnitizacao: 'bipar_palete_no_recebimento',
  status: 'em_andamento' as const,
  responsavelId: 1,
  startedAt: new Date(),
  finishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  itens: [itemBase],
};

const enderecoMock = {
  id: enderecoConfirmadoId,
  centro: { unidadeId },
};

function createUseCase(
  armazenagemOverrides: Partial<IArmazenagemRepository> = {},
): ConfirmarItemArmazenagemUseCase {
  const armazenagemRepository: Partial<IArmazenagemRepository> = {
    findDemandaById: vi.fn().mockResolvedValue(demandaBase),
    getPoliticaArmazenagem: vi.fn().mockResolvedValue({
      enderecoDivergente: 'bloquear',
      quantidadeParcial: 'permitir_livre',
      exigirBipagemProduto: true,
      exigirBipagemEndereco: true,
      permitirOffline: true,
      concluirAutomaticamenteDemanda: false,
    }),
    updateStatusItem: vi.fn().mockResolvedValue({
      ...itemBase,
      status: 'armazenado',
      enderecoConfirmadoId,
    }),
    updateUnitizadorStatus: vi.fn(),
    findUnitizadorByCodigo: vi.fn(),
    criarUnitizador: vi.fn(),
    updateItemQuantidade: vi.fn().mockResolvedValue(itemBase),
    resolveDocumentoRefByRecebimentoId: vi
      .fn()
      .mockResolvedValue('recebimento:00000000-0000-4000-8000-000000000005'),
    ...armazenagemOverrides,
  };

  const estoqueRepository: Partial<IEstoqueRepository> = {
    findDepositoByCodigo: vi.fn().mockImplementation((_unidadeId, codigo) => {
      if (codigo === 'AGUARD_ARM') {
        return Promise.resolve({ id: 'dep-aguard' });
      }
      if (codigo === 'GERAL') {
        return Promise.resolve({ id: 'dep-geral' });
      }
      return Promise.resolve(null);
    }),
    transferirDeposito: vi.fn().mockResolvedValue({ id: 'mov-1' }),
    listSaldos: vi.fn().mockResolvedValue([
      {
        id: 'saldo-1',
        unidadeId,
        produtoId: itemBase.produtoId,
        depositoId: 'dep-aguard',
        lote: itemBase.lote ?? '',
        validade: null,
        numeroSerie: '',
        natureza: 'fisico',
        quantidade: itemBase.quantidade,
        unidadeMedida: itemBase.unidadeMedida,
        documentoRef: 'recebimento:00000000-0000-4000-8000-000000000005',
        updatedAt: new Date(),
      },
    ]),
    ensureDepositosUnidade: vi.fn().mockResolvedValue(undefined),
  };

  const enderecoRepository: Partial<IEnderecoRepository> = {
    findById: vi.fn().mockResolvedValue(enderecoMock),
  };

  const movimentarEstoqueUseCase = new MovimentarEstoqueUseCase(
    estoqueRepository as IEstoqueRepository,
  );
  const ensureDepositosUnidadeUseCase = new EnsureDepositosUnidadeUseCase(
    estoqueRepository as IEstoqueRepository,
  );

  return new ConfirmarItemArmazenagemUseCase(
    armazenagemRepository as IArmazenagemRepository,
    estoqueRepository as IEstoqueRepository,
    enderecoRepository as IEnderecoRepository,
    movimentarEstoqueUseCase,
    ensureDepositosUnidadeUseCase,
  );
}

describe('ConfirmarItemArmazenagemUseCase — política de endereço', () => {
  it('deve lançar BadRequestException quando política=bloquear e endereço diverge', async () => {
    const useCase = createUseCase();

    await expect(
      useCase.execute({
        demandaId,
        itemId,
        data: { enderecoConfirmadoId },
        operatorId: 1,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve lançar BadRequestException quando política=permitir_com_motivo e motivo ausente', async () => {
    const useCase = createUseCase({
      getPoliticaArmazenagem: vi.fn().mockResolvedValue({
        enderecoDivergente: 'permitir_com_motivo',
        quantidadeParcial: 'permitir_livre',
        exigirBipagemProduto: true,
        exigirBipagemEndereco: true,
        permitirOffline: true,
        concluirAutomaticamenteDemanda: false,
      }),
    });

    await expect(
      useCase.execute({
        demandaId,
        itemId,
        data: { enderecoConfirmadoId },
        operatorId: 1,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve confirmar quando política=permitir_com_motivo e motivo fornecido', async () => {
    const useCase = createUseCase({
      getPoliticaArmazenagem: vi.fn().mockResolvedValue({
        enderecoDivergente: 'permitir_com_motivo',
        quantidadeParcial: 'permitir_livre',
        exigirBipagemProduto: true,
        exigirBipagemEndereco: true,
        permitirOffline: true,
        concluirAutomaticamenteDemanda: false,
      }),
    });

    await expect(
      useCase.execute({
        demandaId,
        itemId,
        data: {
          enderecoConfirmadoId,
          motivoDivergencia: 'Endereço cheio',
        },
        operatorId: 1,
      }),
    ).resolves.toBeDefined();
  });

  it('deve reutilizar unitizador existente do mesmo recebimento em retentativa', async () => {
    const unitizadorExistente = {
      id: '00000000-0000-4000-8000-000000000099',
      unidadeId,
      codigo: 'PAL-RETRY',
      tipo: 'palete' as const,
      origem: 'gerado_sistema' as const,
      status: 'armazenado' as const,
      recebimentoId: demandaBase.recebimentoId,
      enderecoAtualId: enderecoSugeridoId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const criarUnitizador = vi.fn();
    const useCase = createUseCase({
      findDemandaById: vi.fn().mockResolvedValue({
        ...demandaBase,
        modoUnitizacao: 'gerar_etiqueta_na_armazenagem',
        itens: [{ ...itemBase, unitizadorId: null, enderecoSugeridoId: enderecoConfirmadoId }],
      }),
      findUnitizadorByCodigo: vi.fn().mockResolvedValue(unitizadorExistente),
      criarUnitizador,
      updateUnitizadorStatus: vi.fn().mockResolvedValue(unitizadorExistente),
    });

    await expect(
      useCase.execute({
        demandaId,
        itemId,
        data: {
          enderecoConfirmadoId,
          unitizadorCodigo: 'PAL-RETRY',
        },
        operatorId: 1,
      }),
    ).resolves.toBeDefined();

    expect(criarUnitizador).not.toHaveBeenCalled();
  });

  it('deve confirmar quando endereço confere com o sugerido', async () => {
    const useCase = createUseCase({
      findDemandaById: vi.fn().mockResolvedValue({
        ...demandaBase,
        itens: [{ ...itemBase, enderecoSugeridoId: enderecoConfirmadoId }],
      }),
    });

    await expect(
      useCase.execute({
        demandaId,
        itemId,
        data: { enderecoConfirmadoId },
        operatorId: 1,
      }),
    ).resolves.toBeDefined();
  });
});
