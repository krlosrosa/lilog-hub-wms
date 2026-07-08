import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GerarDemandaArmazenagemUseCase } from '../../../src/application/usecases/armazenagem/gerar-demanda-armazenagem.usecase.js';

describe('GerarDemandaArmazenagemUseCase', () => {
  const armazenagemRepository = {
    findDemandaByRecebimentoId: vi.fn(),
    criarDemanda: vi.fn(),
    updateStatusDemanda: vi.fn(),
    updateUnitizadorStatus: vi.fn(),
    findDemandaById: vi.fn(),
  };

  const sugerirEnderecosDemandaArmazenagemUseCase = {
    execute: vi.fn(),
  };

  let useCase: GerarDemandaArmazenagemUseCase;

  const recebimentoId = '00000000-0000-4000-8000-000000000001';
  const demandaId = '00000000-0000-4000-8000-000000000002';
  const unitizadorId = '00000000-0000-4000-8000-000000000003';

  beforeEach(async () => {
    vi.clearAllMocks();

    useCase = new GerarDemandaArmazenagemUseCase(
      armazenagemRepository as never,
      sugerirEnderecosDemandaArmazenagemUseCase as never,
    );

    armazenagemRepository.findDemandaByRecebimentoId.mockResolvedValue(null);
    armazenagemRepository.criarDemanda.mockResolvedValue({
      id: demandaId,
      itens: [],
      tarefas: [],
    });
    armazenagemRepository.updateStatusDemanda.mockResolvedValue({});
    armazenagemRepository.updateUnitizadorStatus.mockResolvedValue({});
    sugerirEnderecosDemandaArmazenagemUseCase.execute.mockResolvedValue({
      id: demandaId,
    });
  });

  it('returns null when no itens or tarefas', async () => {
    const result = await useCase.execute({
      unidadeId: 'UN-1',
      recebimentoId,
      modoUnitizacao: 'bipar_palete_no_recebimento',
    });

    expect(result).toBeNull();
  });

  it('marks demanda as aguardando_validacao and does not promote unitizador for bipar mode with itens', async () => {
    await useCase.execute({
      unidadeId: 'UN-1',
      recebimentoId,
      modoUnitizacao: 'bipar_palete_no_recebimento',
      itens: [
        {
          unitizadorId,
          produtoId: 'PROD-1',
          quantidade: 10,
          unidadeMedida: 'UN',
          lote: null,
          validade: null,
          numeroSerie: null,
        },
      ],
    });

    expect(armazenagemRepository.updateStatusDemanda).toHaveBeenCalledWith(
      demandaId,
      'aguardando_validacao',
    );
    expect(armazenagemRepository.updateUnitizadorStatus).not.toHaveBeenCalled();
    expect(sugerirEnderecosDemandaArmazenagemUseCase.execute).toHaveBeenCalledWith({
      demandaId,
    });
  });

  it('marks demanda as aguardando_validacao for bipar mode with tarefas', async () => {
    await useCase.execute({
      unidadeId: 'UN-1',
      recebimentoId,
      modoUnitizacao: 'bipar_palete_no_recebimento',
      tarefas: [
        {
          unitizadorId,
          sequencia: 1,
          itens: [
            {
              produtoId: 'PROD-1',
              quantidade: 10,
              unidadeMedida: 'UN',
              lote: null,
              validade: null,
              numeroSerie: null,
            },
          ],
        },
      ],
    });

    expect(armazenagemRepository.updateStatusDemanda).toHaveBeenCalledWith(
      demandaId,
      'aguardando_validacao',
    );
    expect(armazenagemRepository.updateUnitizadorStatus).not.toHaveBeenCalled();
  });

  it('promotes unitizador immediately for gerar_etiqueta_na_armazenagem mode', async () => {
    await useCase.execute({
      unidadeId: 'UN-1',
      recebimentoId,
      modoUnitizacao: 'gerar_etiqueta_na_armazenagem',
      itens: [
        {
          unitizadorId,
          produtoId: 'PROD-1',
          quantidade: 10,
          unidadeMedida: 'UN',
          lote: null,
          validade: null,
          numeroSerie: null,
        },
      ],
    });

    expect(armazenagemRepository.updateStatusDemanda).not.toHaveBeenCalled();
    expect(armazenagemRepository.updateUnitizadorStatus).toHaveBeenCalledWith(
      unitizadorId,
      'aguardando_armazenagem',
    );
  });

  it('skips aguardando_validacao when enderecosJaValidados is true', async () => {
    const enderecoId = '00000000-0000-4000-8000-000000000004';

    await useCase.execute({
      unidadeId: 'UN-1',
      recebimentoId,
      modoUnitizacao: 'bipar_palete_no_recebimento',
      userId: 42,
      enderecosJaValidados: true,
      tarefas: [
        {
          unitizadorId,
          sequencia: 1,
          enderecoSugeridoId: enderecoId,
          itens: [
            {
              produtoId: 'PROD-1',
              quantidade: 10,
              unidadeMedida: 'UN',
              lote: null,
              validade: null,
              numeroSerie: null,
            },
          ],
        },
      ],
    });

    expect(armazenagemRepository.updateStatusDemanda).toHaveBeenCalledWith(
      demandaId,
      'aguardando_inicio',
      expect.objectContaining({
        validadoPor: 42,
        validadoEm: expect.any(Date),
      }),
    );
    expect(armazenagemRepository.updateUnitizadorStatus).toHaveBeenCalledWith(
      unitizadorId,
      'aguardando_armazenagem',
    );
    expect(sugerirEnderecosDemandaArmazenagemUseCase.execute).not.toHaveBeenCalled();
  });
});
