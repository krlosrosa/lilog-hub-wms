import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PreviewPaletesArmazenagemRecebimentoUseCase } from '../../../src/application/usecases/recebimento/preview-paletes-armazenagem-recebimento.usecase.js';
import { MontarItensAguardandoArmazenagemRecebimentoService } from '../../../src/application/services/recebimento/montar-itens-aguardando-armazenagem-recebimento.service.js';
import { MontarPaletesArmazenagemService } from '../../../src/application/services/armazenagem/montar-paletes-armazenagem.service.js';
import { SugerirEnderecosPaletesService } from '../../../src/application/services/armazenagem/sugerir-enderecos-paletes.service.js';
import { RECEBIMENTO_REPOSITORY } from '../../../src/domain/repositories/recebimento/recebimento.repository.js';
import { PRE_RECEBIMENTO_REPOSITORY } from '../../../src/domain/repositories/recebimento/pre-recebimento.repository.js';
import { RECEBIMENTO_AVARIA_REPOSITORY } from '../../../src/domain/repositories/recebimento/recebimento-avaria.repository.js';
import { PRODUTO_REPOSITORY } from '../../../src/domain/repositories/produto/produto.repository.js';
import { ARMAZENAGEM_REPOSITORY } from '../../../src/domain/repositories/armazenagem/armazenagem.repository.js';

describe('PreviewPaletesArmazenagemRecebimentoUseCase', () => {
  const recebimentoRepository = {
    findById: vi.fn(),
    findItemsByRecebimento: vi.fn(),
  };
  const preRecebimentoRepository = {
    findById: vi.fn(),
  };
  const avariaRepository = {
    listByRecebimento: vi.fn(),
  };
  const produtoRepository = {
    findByProdutoId: vi.fn(),
  };
  const armazenagemRepository = {
    resolveDocumentoRefByRecebimentoId: vi.fn(),
  };
  const montarItensService = {
    execute: vi.fn(),
  };
  const montarPaletesService = {
    execute: vi.fn(),
  };
  const sugerirEnderecosPaletesService = {
    execute: vi.fn(),
  };

  let useCase: PreviewPaletesArmazenagemRecebimentoUseCase;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [PreviewPaletesArmazenagemRecebimentoUseCase],
    })
      .useMocker((token) => {
        if (token === RECEBIMENTO_REPOSITORY) return recebimentoRepository;
        if (token === PRE_RECEBIMENTO_REPOSITORY) return preRecebimentoRepository;
        if (token === RECEBIMENTO_AVARIA_REPOSITORY) return avariaRepository;
        if (token === PRODUTO_REPOSITORY) return produtoRepository;
        if (token === ARMAZENAGEM_REPOSITORY) return armazenagemRepository;
        if (token === MontarItensAguardandoArmazenagemRecebimentoService) {
          return montarItensService;
        }
        if (token === MontarPaletesArmazenagemService) return montarPaletesService;
        if (token === SugerirEnderecosPaletesService) {
          return sugerirEnderecosPaletesService;
        }
      })
      .compile();

    useCase = moduleRef.get(PreviewPaletesArmazenagemRecebimentoUseCase);
  });

  it('throws when recebimento is not found', async () => {
    recebimentoRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        recebimentoId: '00000000-0000-4000-8000-000000000001',
        paletes: [{ produtoId: 'SKU-1', qtdPaletes: 2 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
