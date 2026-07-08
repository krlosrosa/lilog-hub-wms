import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PreviewEnderecosPaletesBipadosRecebimentoUseCase } from '../../../src/application/usecases/recebimento/preview-enderecos-paletes-bipados-recebimento.usecase.js';

describe('PreviewEnderecosPaletesBipadosRecebimentoUseCase', () => {
  const recebimentoId = '00000000-0000-4000-8000-000000000001';
  const unitizadorId = '00000000-0000-4000-8000-000000000010';
  const enderecoId = '00000000-0000-4000-8000-000000000011';

  const recebimentoRepository = {
    findById: vi.fn(),
    findItemsByRecebimento: vi.fn(),
  };
  const preRecebimentoRepository = {
    findById: vi.fn(),
  };
  const produtoRepository = {
    findByProdutoId: vi.fn(),
  };
  const armazenagemRepository = {
    resolveDocumentoRefByRecebimentoId: vi.fn(),
    findUnitizadorById: vi.fn(),
  };
  const sugerirEnderecosPaletesService = {
    execute: vi.fn(),
  };

  let useCase: PreviewEnderecosPaletesBipadosRecebimentoUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    useCase = new PreviewEnderecosPaletesBipadosRecebimentoUseCase(
      recebimentoRepository as never,
      preRecebimentoRepository as never,
      produtoRepository as never,
      armazenagemRepository as never,
      sugerirEnderecosPaletesService as never,
    );
  });

  it('throws when recebimento is not found', async () => {
    recebimentoRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ recebimentoId }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns preview with suggested addresses for bipados paletes', async () => {
    recebimentoRepository.findById.mockResolvedValue({
      id: recebimentoId,
      preRecebimentoId: 'pre-1',
      situacao: 'conferido',
      dataFim: new Date(),
      divergencias: [],
    });
    preRecebimentoRepository.findById.mockResolvedValue({
      id: 'pre-1',
      unidadeId: 'ITB',
      itens: [{ produtoId: 'prod-1', unidadeMedida: 'UN', quantidadeEsperada: 8 }],
    });
    recebimentoRepository.findItemsByRecebimento.mockResolvedValue([
      {
        id: 'item-1',
        recebimentoId,
        produtoId: 'prod-1',
        quantidadeRecebida: 8,
        unidadeMedida: 'UN',
        loteRecebido: null,
        validade: null,
        pesoRecebido: null,
        numeroSerie: null,
        unitizadorId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    armazenagemRepository.resolveDocumentoRefByRecebimentoId.mockResolvedValue(
      'REC-001',
    );
    armazenagemRepository.findUnitizadorById.mockResolvedValue({
      id: unitizadorId,
      codigo: 'PAL-001',
    });
    produtoRepository.findByProdutoId.mockResolvedValue({
      produtoId: 'prod-1',
      sku: 'SKU-1',
      descricao: 'Produto 1',
    });
    sugerirEnderecosPaletesService.execute.mockResolvedValue(
      new Map([
        [
          1,
          {
            enderecoSugeridoId: enderecoId,
            enderecoSugeridoLabel: 'A-01-01',
            disponivel: true,
            alerta: null,
          },
        ],
      ]),
    );

    const result = await useCase.execute({ recebimentoId });

    expect(result.paletes).toHaveLength(1);
    expect(result.paletes[0]).toMatchObject({
      unitizadorId,
      codigoUnitizador: 'PAL-001',
      enderecoSugeridoId: enderecoId,
      enderecoSugeridoLabel: 'A-01-01',
      disponivel: true,
    });
  });

  it('throws when there are no conferidos with unitizador', async () => {
    recebimentoRepository.findById.mockResolvedValue({
      id: recebimentoId,
      preRecebimentoId: 'pre-1',
      situacao: 'conferido',
      dataFim: new Date(),
      divergencias: [],
    });
    preRecebimentoRepository.findById.mockResolvedValue({
      id: 'pre-1',
      unidadeId: 'ITB',
      itens: [],
    });
    recebimentoRepository.findItemsByRecebimento.mockResolvedValue([
      {
        id: 'item-1',
        recebimentoId,
        produtoId: 'prod-1',
        quantidadeRecebida: 8,
        unidadeMedida: 'UN',
        loteRecebido: null,
        validade: null,
        pesoRecebido: null,
        numeroSerie: null,
        unitizadorId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await expect(
      useCase.execute({ recebimentoId }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
