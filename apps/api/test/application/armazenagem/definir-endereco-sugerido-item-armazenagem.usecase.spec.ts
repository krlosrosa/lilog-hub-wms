import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { DefinirEnderecoSugeridoItemArmazenagemUseCase } from '../../../src/application/usecases/armazenagem/definir-endereco-sugerido-item-armazenagem.usecase.js';
import {
  ARMAZENAGEM_REPOSITORY,
  type IArmazenagemRepository,
} from '../../../src/domain/repositories/armazenagem/armazenagem.repository.js';
import {
  ENDERECO_REPOSITORY,
  type IEnderecoRepository,
} from '../../../src/domain/repositories/endereco/endereco.repository.js';

const demandaId = '00000000-0000-4000-8000-000000000001';
const itemId = '00000000-0000-4000-8000-000000000002';
const enderecoId = '00000000-0000-4000-8000-000000000003';
const unidadeId = '00000000-0000-4000-8000-000000000004';

const demandaMock = {
  id: demandaId,
  unidadeId,
  recebimentoId: '00000000-0000-4000-8000-000000000005',
  modoUnitizacao: 'gerar_etiqueta_na_armazenagem',
  status: 'aguardando_inicio' as const,
  responsavelId: null,
  startedAt: null,
  finishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  itens: [
    {
      id: itemId,
      demandaId,
      unitizadorId: null,
      produtoId: '00000000-0000-4000-8000-000000000006',
      quantidade: 1,
      unidadeMedida: 'UN',
      lote: null,
      validade: null,
      numeroSerie: null,
      enderecoSugeridoId: null,
      enderecoConfirmadoId: null,
      status: 'pendente' as const,
      produtoSku: null,
      produtoNome: null,
      enderecoSugeridoLabel: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};

const enderecoMock = {
  id: enderecoId,
  enderecoMascarado: 'A-01-01',
  centroId: '00000000-0000-4000-8000-000000000007',
  centro: {
    id: '00000000-0000-4000-8000-000000000007',
    unidadeId,
    centro: '01',
    empresa: '01',
    nome: 'Centro 01',
  },
  zona: 'A',
  rua: '01',
  posicao: '01',
  nivel: '01',
  tipo: 'pulmao' as const,
  status: 'disponivel' as const,
  tipoEstrutura: 'porta_palete' as const,
  larguraMm: 1000,
  alturaMm: 1000,
  profundidadeMm: 1000,
  cargaMaxKg: '1000',
  capacidadeVolume: null,
  prioridadePicking: 1,
  coordenadaX: null,
  coordenadaY: null,
  coordenadaZ: null,
  observacao: null,
  vinculoSkuFixo: false,
  regraLoteUnico: false,
  permiteMisturaValidade: false,
  permiteFracionado: false,
  curvaAbc: 'A' as const,
  ocupacaoPercent: '0',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createModule(
  armazenagemRepository: Partial<IArmazenagemRepository>,
  enderecoRepository: Partial<IEnderecoRepository>,
) {
  return Test.createTestingModule({
    providers: [
      DefinirEnderecoSugeridoItemArmazenagemUseCase,
      { provide: ARMAZENAGEM_REPOSITORY, useValue: armazenagemRepository },
      { provide: ENDERECO_REPOSITORY, useValue: enderecoRepository },
    ],
  }).compile();
}

describe('DefinirEnderecoSugeridoItemArmazenagemUseCase', () => {
  it('rejects when address is already reserved by another item', async () => {
    const armazenagemRepository: Partial<IArmazenagemRepository> = {
      findDemandaById: vi.fn().mockResolvedValue(demandaMock),
      listEnderecosSugeridosReservados: vi
        .fn()
        .mockResolvedValue([enderecoId]),
      updateEnderecoSugeridoItem: vi.fn(),
    };

    const enderecoRepository: Partial<IEnderecoRepository> = {
      findById: vi.fn().mockResolvedValue(enderecoMock),
    };

    const moduleRef = await createModule(
      armazenagemRepository,
      enderecoRepository,
    );
    const useCase = moduleRef.get(DefinirEnderecoSugeridoItemArmazenagemUseCase);

    await expect(
      useCase.execute({ demandaId, itemId, enderecoSugeridoId: enderecoId }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(armazenagemRepository.updateEnderecoSugeridoItem).not.toHaveBeenCalled();
  });

  it('allows keeping the same address for the current item', async () => {
    const updatedItem = {
      ...demandaMock.itens[0],
      enderecoSugeridoId: enderecoId,
    };

    const armazenagemRepository: Partial<IArmazenagemRepository> = {
      findDemandaById: vi.fn().mockResolvedValue(demandaMock),
      listEnderecosSugeridosReservados: vi.fn().mockResolvedValue([]),
      updateEnderecoSugeridoItem: vi.fn().mockResolvedValue(updatedItem),
    };

    const enderecoRepository: Partial<IEnderecoRepository> = {
      findById: vi.fn().mockResolvedValue(enderecoMock),
    };

    const moduleRef = await createModule(
      armazenagemRepository,
      enderecoRepository,
    );
    const useCase = moduleRef.get(DefinirEnderecoSugeridoItemArmazenagemUseCase);

    const result = await useCase.execute({
      demandaId,
      itemId,
      enderecoSugeridoId: enderecoId,
    });

    expect(result).toEqual(updatedItem);
    expect(armazenagemRepository.listEnderecosSugeridosReservados).toHaveBeenCalledWith({
      unidadeId,
      excludeItemId: itemId,
    });
    expect(armazenagemRepository.updateEnderecoSugeridoItem).toHaveBeenCalledWith(
      itemId,
      enderecoId,
    );
  });
});
