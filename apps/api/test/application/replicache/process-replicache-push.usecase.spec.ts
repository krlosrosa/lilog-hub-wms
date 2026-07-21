import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProcessReplicachePushUseCase } from '../../../src/application/usecases/replicache/process-replicache-push.usecase.js';
import type { IReplicacheRepository } from '../../../src/domain/repositories/replicache/replicache.repository.js';
import type { IPreRecebimentoRepository } from '../../../src/domain/repositories/recebimento/pre-recebimento.repository.js';
import type { IRecebimentoRepository } from '../../../src/domain/repositories/recebimento/recebimento.repository.js';
import type { IRecebimentoAvariaRepository } from '../../../src/domain/repositories/recebimento/recebimento-avaria.repository.js';
import type { IProdutoRepository } from '../../../src/domain/repositories/produto/produto.repository.js';
import type { IUserRepository } from '../../../src/domain/repositories/user/user.repository.js';
import type { ConferirItemUseCase } from '../../../src/application/usecases/recebimento/conferir-item.usecase.js';
import type { CreateChecklistRecebimentoUseCase } from '../../../src/application/usecases/recebimento/create-checklist-recebimento.usecase.js';
import type { IniciarRecebimentoUseCase } from '../../../src/application/usecases/recebimento/iniciar-recebimento.usecase.js';
import type { EncerrarConferenciaUseCase } from '../../../src/application/usecases/recebimento/encerrar-conferencia.usecase.js';
import type { ListOperadorDemandasUseCase } from '../../../src/application/usecases/recebimento/list-operador-demandas.usecase.js';

const PRE_RECEBIMENTO_ID = '11111111-1111-1111-1111-111111111111';
const RECEBIMENTO_ID = '22222222-2222-2222-2222-222222222222';
const UNIDADE_ID = 'pavuna';
const USER_ID = 42;
const CLIENT_ID = 'client-1';

function makePushRequest(mutations: Array<{ name: string; args: unknown }>) {
  return {
    clientGroupID: 'cg-1',
    mutations: mutations.map((mutation, index) => ({
      clientID: CLIENT_ID,
      id: index + 1,
      name: mutation.name,
      args: mutation.args,
      timestamp: Date.now(),
    })),
    profileID: 'profile-1',
    pushVersion: 1,
    schemaVersion: 'recebimento-rc-v7',
  };
}

function makeMultiClientPushRequest(
  mutations: Array<{
    clientID: string;
    id: number;
    name: string;
    args: unknown;
    timestamp: number;
  }>,
) {
  return {
    clientGroupID: 'cg-1',
    mutations,
    profileID: 'profile-1',
    pushVersion: 1,
    schemaVersion: 'recebimento-rc-v7',
  };
}

const CHECKLIST_ARGS = {
  preRecebimentoId: PRE_RECEBIMENTO_ID,
  dockId: 'Doca 1',
  dockLabel: 'Doca 1',
  lacre: 'L123',
  tempBau: -5,
  conditions: {
    limpeza: true,
    odor: true,
    estrutura: true,
    vedacao: true,
  },
  photoCount: 0,
};

const ENCERRAR_ARGS = {
  preRecebimentoId: PRE_RECEBIMENTO_ID,
  quantidadePaletes: 10,
  teveSobreposicaoCarga: false,
};

describe('ProcessReplicachePushUseCase — resolveRecebimentoId', () => {
  let useCase: ProcessReplicachePushUseCase;
  let replicacheRepository: {
    getClientLastMutationId: ReturnType<typeof vi.fn>;
    appendChanges: ReturnType<typeof vi.fn>;
    bumpSpaceVersion: ReturnType<typeof vi.fn>;
    upsertClientMutationId: ReturnType<typeof vi.fn>;
  };
  let preRecebimentoRepository: { findById: ReturnType<typeof vi.fn> };
  let recebimentoRepository: {
    findByPreRecebimentoId: ReturnType<typeof vi.fn>;
  };
  let userRepository: { findById: ReturnType<typeof vi.fn> };
  let conferirItemUseCase: { execute: ReturnType<typeof vi.fn> };
  let iniciarRecebimentoUseCase: { execute: ReturnType<typeof vi.fn> };
  let createChecklistRecebimentoUseCase: { execute: ReturnType<typeof vi.fn> };
  let listOperadorDemandasUseCase: { execute: ReturnType<typeof vi.fn> };
  let encerrarConferenciaUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const lastMutationIds = new Map<string, number>();

    replicacheRepository = {
      getClientLastMutationId: vi.fn(async (clientId: string) => {
        return lastMutationIds.get(clientId) ?? 0;
      }),
      appendChanges: vi.fn().mockResolvedValue(undefined),
      bumpSpaceVersion: vi.fn().mockResolvedValue(undefined),
      upsertClientMutationId: vi.fn(async ({ clientId, lastMutationId }) => {
        lastMutationIds.set(clientId, lastMutationId);
      }),
    };

    preRecebimentoRepository = {
      findById: vi.fn().mockResolvedValue({
        id: PRE_RECEBIMENTO_ID,
        situacao: 'em_conferencia',
        unidadeId: UNIDADE_ID,
        docaId: null,
      }),
    };

    recebimentoRepository = {
      findByPreRecebimentoId: vi.fn().mockResolvedValue(null),
    };

    userRepository = {
      findById: vi.fn().mockResolvedValue({ id: USER_ID, funcionarioId: 7 }),
    };

    conferirItemUseCase = {
      execute: vi.fn().mockResolvedValue({
        id: 'item-1',
        quantidadeRecebida: 10,
        unidadeMedida: 'CX',
        pesoRecebido: null,
        etiquetaCodigo: null,
        pesagemId: null,
      }),
    };

    iniciarRecebimentoUseCase = {
      execute: vi.fn().mockResolvedValue({ id: RECEBIMENTO_ID }),
    };

    createChecklistRecebimentoUseCase = {
      execute: vi.fn().mockResolvedValue({
        id: 'checklist-1',
        lacre: 'L123',
        tempBau: -5,
        conditions: {
          limpeza: true,
          odor: true,
          estrutura: true,
          vedacao: true,
        },
        observacoes: undefined,
        photoCount: 0,
        createdAt: new Date('2026-07-19T12:00:00.000Z'),
      }),
    };

    listOperadorDemandasUseCase = {
      execute: vi.fn().mockResolvedValue({
        items: [
          {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            recebimentoId: RECEBIMENTO_ID,
            unidadeId: UNIDADE_ID,
            placa: 'ABC1D23',
            transportadoraNome: 'Transp',
            situacao: 'em_conferencia',
            dock: 'D1',
            skuCount: 1,
            horarioPrevisto: '2026-07-19T12:00:00.000Z',
            conferenteId: 7,
            conferente: 'João',
            conferenteMatricula: '123',
            alocacaoFuncionarioId: null,
            atribuidoAMim: true,
          },
        ],
      }),
    };

    encerrarConferenciaUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    };

    const noop = {} as never;

    useCase = new ProcessReplicachePushUseCase(
      replicacheRepository as unknown as IReplicacheRepository,
      conferirItemUseCase as unknown as ConferirItemUseCase,
      noop,
      noop,
      { findByProdutoId: vi.fn().mockResolvedValue({ sku: 'SKU-1', descricao: 'Produto' }) } as unknown as IProdutoRepository,
      preRecebimentoRepository as unknown as IPreRecebimentoRepository,
      recebimentoRepository as unknown as IRecebimentoRepository,
      { listByRecebimento: vi.fn() } as unknown as IRecebimentoAvariaRepository,
      userRepository as unknown as IUserRepository,
      iniciarRecebimentoUseCase as unknown as IniciarRecebimentoUseCase,
      createChecklistRecebimentoUseCase as unknown as CreateChecklistRecebimentoUseCase,
      listOperadorDemandasUseCase as unknown as ListOperadorDemandasUseCase,
      noop,
      noop,
      encerrarConferenciaUseCase as unknown as EncerrarConferenciaUseCase,
      noop,
      noop,
      noop,
    );
  });

  it('reuses existing recebimentoId without calling iniciarRecebimento', async () => {
    recebimentoRepository.findByPreRecebimentoId.mockResolvedValue({
      id: RECEBIMENTO_ID,
    });

    await useCase.execute({
      request: makePushRequest([
        {
          name: 'conferirItem',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            produtoId: 'PROD-1',
            quantidadeRecebida: 10,
            unidadeMedida: 'CX',
            clientRecordId: '0f6e154e-9a7b-4d56-b462-8b8a6f9d3f65',
          },
        },
      ]),
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(iniciarRecebimentoUseCase.execute).not.toHaveBeenCalled();
    expect(conferirItemUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        recebimentoId: RECEBIMENTO_ID,
        clientConferenceId: '0f6e154e-9a7b-4d56-b462-8b8a6f9d3f65',
      }),
    );
    expect(replicacheRepository.appendChanges).toHaveBeenCalledWith(
      UNIDADE_ID,
      expect.arrayContaining([
        expect.objectContaining({
          key: `itemConferido/${PRE_RECEBIMENTO_ID}/PROD-1/item-1`,
        }),
      ]),
    );
  });

  it('creates recebimento when missing and caches id within same push batch', async () => {
    await useCase.execute({
      request: makePushRequest([
        {
          name: 'conferirItem',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            produtoId: 'PROD-1',
            quantidadeRecebida: 10,
            unidadeMedida: 'CX',
          },
        },
        {
          name: 'conferirItem',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            produtoId: 'PROD-2',
            quantidadeRecebida: 5,
            unidadeMedida: 'CX',
          },
        },
      ]),
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(iniciarRecebimentoUseCase.execute).toHaveBeenCalledTimes(1);
    expect(conferirItemUseCase.execute).toHaveBeenCalledTimes(2);
  });

  it('falls back to existing recebimento on iniciar conflict', async () => {
    iniciarRecebimentoUseCase.execute.mockRejectedValue(
      new ConflictException('Recebimento já iniciado'),
    );
    recebimentoRepository.findByPreRecebimentoId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: RECEBIMENTO_ID });

    await useCase.execute({
      request: makePushRequest([
        {
          name: 'conferirItem',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            produtoId: 'PROD-1',
            quantidadeRecebida: 10,
            unidadeMedida: 'CX',
          },
        },
      ]),
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(conferirItemUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ recebimentoId: RECEBIMENTO_ID }),
    );
  });

  it('ignores invalid dockId and falls back to pre-recebimento docaId', async () => {
    const DOCA_ID = '33333333-3333-4333-8333-333333333333';
    preRecebimentoRepository.findById.mockResolvedValue({
      id: PRE_RECEBIMENTO_ID,
      situacao: 'em_conferencia',
      unidadeId: UNIDADE_ID,
      docaId: DOCA_ID,
    });

    await useCase.execute({
      request: makePushRequest([
        {
          name: 'upsertChecklist',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            dockId: 'Doca 1',
            dockLabel: 'Doca 1',
            lacre: 'L123',
            tempBau: -5,
            conditions: {
              limpeza: true,
              odor: true,
              estrutura: true,
              vedacao: true,
            },
            photoCount: 0,
          },
        },
      ]),
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(iniciarRecebimentoUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          preRecebimentoId: PRE_RECEBIMENTO_ID,
          docaId: DOCA_ID,
        }),
      }),
    );
  });

  it('rejects mutations when pre-recebimento is impedido', async () => {
    preRecebimentoRepository.findById.mockResolvedValue({
      id: PRE_RECEBIMENTO_ID,
      situacao: 'impedido',
      unidadeId: UNIDADE_ID,
    });

    await expect(
      useCase.execute({
        request: makePushRequest([
          {
            name: 'conferirItem',
            args: {
              preRecebimentoId: PRE_RECEBIMENTO_ID,
              produtoId: 'PROD-1',
              quantidadeRecebida: 10,
              unidadeMedida: 'CX',
            },
          },
        ]),
        unidadeId: UNIDADE_ID,
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('ProcessReplicachePushUseCase — encerrarConferencia', () => {
  let useCase: ProcessReplicachePushUseCase;
  let replicacheRepository: {
    getClientLastMutationId: ReturnType<typeof vi.fn>;
    appendChanges: ReturnType<typeof vi.fn>;
    bumpSpaceVersion: ReturnType<typeof vi.fn>;
    upsertClientMutationId: ReturnType<typeof vi.fn>;
  };
  let preRecebimentoRepository: { findById: ReturnType<typeof vi.fn> };
  let recebimentoRepository: {
    findByPreRecebimentoId: ReturnType<typeof vi.fn>;
  };
  let userRepository: { findById: ReturnType<typeof vi.fn> };
  let encerrarConferenciaUseCase: { execute: ReturnType<typeof vi.fn> };
  let listOperadorDemandasUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const lastMutationIds = new Map<string, number>();

    replicacheRepository = {
      getClientLastMutationId: vi.fn(async (clientId: string) => {
        return lastMutationIds.get(clientId) ?? 0;
      }),
      appendChanges: vi.fn().mockResolvedValue(undefined),
      bumpSpaceVersion: vi.fn().mockResolvedValue(undefined),
      upsertClientMutationId: vi.fn(async ({ clientId, lastMutationId }) => {
        lastMutationIds.set(clientId, lastMutationId);
      }),
    };

    preRecebimentoRepository = {
      findById: vi.fn().mockResolvedValue({
        id: PRE_RECEBIMENTO_ID,
        situacao: 'em_conferencia',
        unidadeId: UNIDADE_ID,
        docaId: null,
      }),
    };

    recebimentoRepository = {
      findByPreRecebimentoId: vi.fn().mockResolvedValue({ id: RECEBIMENTO_ID }),
    };

    userRepository = {
      findById: vi.fn().mockResolvedValue({ id: USER_ID, funcionarioId: 7 }),
    };

    encerrarConferenciaUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    };

    listOperadorDemandasUseCase = {
      execute: vi.fn().mockResolvedValue({
        items: [
          {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            recebimentoId: RECEBIMENTO_ID,
            unidadeId: UNIDADE_ID,
            placa: 'ABC1D23',
            transportadoraNome: 'Transp',
            situacao: 'conferido',
            dock: 'D1',
            skuCount: 1,
            horarioPrevisto: '2026-07-19T12:00:00.000Z',
            conferenteId: 7,
            conferente: 'João',
            conferenteMatricula: '123',
            alocacaoFuncionarioId: null,
            atribuidoAMim: true,
          },
        ],
      }),
    };

    const noop = {} as never;

    useCase = new ProcessReplicachePushUseCase(
      replicacheRepository as unknown as IReplicacheRepository,
      noop,
      noop,
      noop,
      { findByProdutoId: vi.fn() } as unknown as IProdutoRepository,
      preRecebimentoRepository as unknown as IPreRecebimentoRepository,
      recebimentoRepository as unknown as IRecebimentoRepository,
      { listByRecebimento: vi.fn() } as unknown as IRecebimentoAvariaRepository,
      userRepository as unknown as IUserRepository,
      noop,
      noop,
      listOperadorDemandasUseCase as unknown as ListOperadorDemandasUseCase,
      noop,
      noop,
      encerrarConferenciaUseCase as unknown as EncerrarConferenciaUseCase,
      noop,
      noop,
      noop,
    );
  });

  it('writes conferido demand change after successful encerrarConferencia', async () => {
    await useCase.execute({
      request: makePushRequest([
        {
          name: 'encerrarConferencia',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            quantidadePaletes: 10,
            teveSobreposicaoCarga: false,
          },
        },
      ]),
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(encerrarConferenciaUseCase.execute).toHaveBeenCalledWith({
      recebimentoId: RECEBIMENTO_ID,
      userId: USER_ID,
      quantidadePaletes: 10,
      teveSobreposicaoCarga: false,
    });
    expect(replicacheRepository.appendChanges).toHaveBeenCalledWith(
      UNIDADE_ID,
      expect.arrayContaining([
        expect.objectContaining({
          key: `demand/${PRE_RECEBIMENTO_ID}`,
          value: expect.objectContaining({ situacao: 'conferido' }),
        }),
      ]),
    );
  });

  it('writes conferido demand change when encerrarConferencia is idempotent on server', async () => {
    encerrarConferenciaUseCase.execute.mockResolvedValue({
      id: RECEBIMENTO_ID,
      situacao: 'conferido',
    });

    await useCase.execute({
      request: makePushRequest([
        {
          name: 'encerrarConferencia',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            quantidadePaletes: 10,
            teveSobreposicaoCarga: false,
          },
        },
      ]),
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(replicacheRepository.appendChanges).toHaveBeenCalledWith(
      UNIDADE_ID,
      expect.arrayContaining([
        expect.objectContaining({
          key: `demand/${PRE_RECEBIMENTO_ID}`,
          value: expect.objectContaining({ situacao: 'conferido' }),
        }),
      ]),
    );
  });

  it('writes fallback conferido demand change when demand is absent from operador list', async () => {
    listOperadorDemandasUseCase.execute.mockResolvedValue({ items: [] });
    preRecebimentoRepository.findById.mockResolvedValue({
      id: PRE_RECEBIMENTO_ID,
      situacao: 'conferido',
      unidadeId: UNIDADE_ID,
      placa: 'XYZ1A23',
      transportadoraNome: 'Transp fallback',
      horarioPrevisto: new Date('2026-07-19T12:00:00.000Z'),
      itens: [{ id: 'i-1' }],
      docaId: null,
    });

    await useCase.execute({
      request: makePushRequest([
        {
          name: 'encerrarConferencia',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            quantidadePaletes: 10,
            teveSobreposicaoCarga: false,
          },
        },
      ]),
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(replicacheRepository.appendChanges).toHaveBeenCalledWith(
      UNIDADE_ID,
      expect.arrayContaining([
        expect.objectContaining({
          key: `demand/${PRE_RECEBIMENTO_ID}`,
          value: expect.objectContaining({
            situacao: 'conferido',
            placa: 'XYZ1A23',
            transportadoraNome: 'Transp fallback',
          }),
        }),
      ]),
    );
  });

  it('does not write demand change when encerrarConferencia validation fails', async () => {
    encerrarConferenciaUseCase.execute.mockRejectedValue(
      new BadRequestException('Informe as temperaturas de início, meio e fim do baú'),
    );

    await expect(
      useCase.execute({
        request: makePushRequest([
          {
            name: 'encerrarConferencia',
            args: {
              preRecebimentoId: PRE_RECEBIMENTO_ID,
              quantidadePaletes: 10,
              teveSobreposicaoCarga: false,
            },
          },
        ]),
        unidadeId: UNIDADE_ID,
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(replicacheRepository.appendChanges).not.toHaveBeenCalled();
  });
});

describe('ProcessReplicachePushUseCase — avaria offline sync', () => {
  const CLIENT_DAMAGE_A = '11111111-1111-4111-8111-111111111111';
  const CLIENT_DAMAGE_B = '22222222-2222-4222-8222-222222222222';
  const AVARIA_A_ID = 'avaria-a-server-id';
  const AVARIA_B_ID = 'avaria-b-server-id';

  let useCase: ProcessReplicachePushUseCase;
  let replicacheRepository: {
    getClientLastMutationId: ReturnType<typeof vi.fn>;
    appendChanges: ReturnType<typeof vi.fn>;
    bumpSpaceVersion: ReturnType<typeof vi.fn>;
    upsertClientMutationId: ReturnType<typeof vi.fn>;
  };
  let preRecebimentoRepository: { findById: ReturnType<typeof vi.fn> };
  let recebimentoRepository: {
    findByPreRecebimentoId: ReturnType<typeof vi.fn>;
  };
  let userRepository: { findById: ReturnType<typeof vi.fn> };
  let iniciarRecebimentoUseCase: { execute: ReturnType<typeof vi.fn> };
  let listOperadorDemandasUseCase: { execute: ReturnType<typeof vi.fn> };
  let registrarAvariaUseCase: { execute: ReturnType<typeof vi.fn> };
  let removerAvariaRecebimentoUseCase: { execute: ReturnType<typeof vi.fn> };

  const baseRegistrarArgs = {
    preRecebimentoId: PRE_RECEBIMENTO_ID,
    produtoId: 'PROD-1',
    tipo: 'embalagem',
    natureza: 'avaria',
    causa: 'transporte',
    quantidadeCaixas: 1,
    quantidadeUnidades: 0,
    photoCount: 0,
  };

  beforeEach(() => {
    const lastMutationIds = new Map<string, number>();

    replicacheRepository = {
      getClientLastMutationId: vi.fn(async (clientId: string) => {
        return lastMutationIds.get(clientId) ?? 0;
      }),
      appendChanges: vi.fn().mockResolvedValue(undefined),
      bumpSpaceVersion: vi.fn().mockResolvedValue(undefined),
      upsertClientMutationId: vi.fn(async ({ clientId, lastMutationId }) => {
        lastMutationIds.set(clientId, lastMutationId);
      }),
    };

    preRecebimentoRepository = {
      findById: vi.fn().mockResolvedValue({
        id: PRE_RECEBIMENTO_ID,
        situacao: 'liberado_para_conferencia',
        unidadeId: UNIDADE_ID,
        docaId: null,
      }),
    };

    recebimentoRepository = {
      findByPreRecebimentoId: vi.fn().mockResolvedValue(null),
    };

    userRepository = {
      findById: vi.fn().mockResolvedValue({ id: USER_ID, funcionarioId: 7 }),
    };

    iniciarRecebimentoUseCase = {
      execute: vi.fn().mockResolvedValue({ id: RECEBIMENTO_ID }),
    };

    listOperadorDemandasUseCase = {
      execute: vi.fn().mockResolvedValue({
        items: [
          {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            recebimentoId: RECEBIMENTO_ID,
            unidadeId: UNIDADE_ID,
            placa: 'ABC1D23',
            transportadoraNome: 'Transp',
            situacao: 'em_conferencia',
            dock: 'D1',
            skuCount: 1,
            horarioPrevisto: '2026-07-19T12:00:00.000Z',
            conferenteId: 7,
            conferente: 'João',
            conferenteMatricula: '123',
            alocacaoFuncionarioId: null,
            atribuidoAMim: true,
          },
        ],
      }),
    };

    registrarAvariaUseCase = {
      execute: vi
        .fn()
        .mockResolvedValueOnce({
          items: [
            {
              id: AVARIA_A_ID,
              recebimentoId: RECEBIMENTO_ID,
              produtoId: 'PROD-1',
              tipo: 'embalagem',
              natureza: 'avaria',
              causa: 'transporte',
              quantidadeCaixas: 1,
              quantidadeUnidades: 0,
              lote: null,
              validade: null,
              numeroSerie: null,
              photoCount: 0,
              replicado: false,
              clientDamageId: CLIENT_DAMAGE_A,
              operatorId: USER_ID,
              createdAt: '2026-07-19T12:00:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({
          items: [
            {
              id: AVARIA_B_ID,
              recebimentoId: RECEBIMENTO_ID,
              produtoId: 'PROD-1',
              tipo: 'embalagem',
              natureza: 'avaria',
              causa: 'transporte',
              quantidadeCaixas: 2,
              quantidadeUnidades: 0,
              lote: null,
              validade: null,
              numeroSerie: null,
              photoCount: 0,
              replicado: false,
              clientDamageId: CLIENT_DAMAGE_B,
              operatorId: USER_ID,
              createdAt: '2026-07-19T12:01:00.000Z',
            },
          ],
        }),
    };

    removerAvariaRecebimentoUseCase = {
      execute: vi.fn().mockRejectedValue(
        new BadRequestException('Avarias só podem ser removidas durante a conferência'),
      ),
    };

    const noop = {} as never;

    useCase = new ProcessReplicachePushUseCase(
      replicacheRepository as unknown as IReplicacheRepository,
      noop,
      noop,
      noop,
      {
        findByProdutoId: vi.fn().mockResolvedValue({
          sku: 'SKU-1',
          descricao: 'Produto teste',
        }),
      } as unknown as IProdutoRepository,
      preRecebimentoRepository as unknown as IPreRecebimentoRepository,
      recebimentoRepository as unknown as IRecebimentoRepository,
      { listByRecebimento: vi.fn().mockResolvedValue([]) } as unknown as IRecebimentoAvariaRepository,
      userRepository as unknown as IUserRepository,
      iniciarRecebimentoUseCase as unknown as IniciarRecebimentoUseCase,
      noop,
      listOperadorDemandasUseCase as unknown as ListOperadorDemandasUseCase,
      noop,
      noop,
      noop,
      registrarAvariaUseCase as never,
      removerAvariaRecebimentoUseCase as never,
      noop,
    );
  });

  it('completes push when offline batch is registrar → remover → registrar', async () => {
    await useCase.execute({
      request: makePushRequest([
        {
          name: 'registrarAvaria',
          args: {
            ...baseRegistrarArgs,
            clientDamageId: CLIENT_DAMAGE_A,
          },
        },
        {
          name: 'removerAvaria',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            avariaId: CLIENT_DAMAGE_A,
          },
        },
        {
          name: 'registrarAvaria',
          args: {
            ...baseRegistrarArgs,
            quantidadeCaixas: 2,
            clientDamageId: CLIENT_DAMAGE_B,
          },
        },
      ]),
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(registrarAvariaUseCase.execute).toHaveBeenCalledTimes(2);
    expect(removerAvariaRecebimentoUseCase.execute).toHaveBeenCalledWith({
      recebimentoId: RECEBIMENTO_ID,
      avariaId: CLIENT_DAMAGE_A,
    });
    expect(replicacheRepository.bumpSpaceVersion).toHaveBeenCalledWith(UNIDADE_ID);
    expect(replicacheRepository.appendChanges).toHaveBeenCalledTimes(2);
    expect(replicacheRepository.appendChanges).toHaveBeenNthCalledWith(
      1,
      UNIDADE_ID,
      expect.arrayContaining([
        expect.objectContaining({
          op: 'put',
          key: `avaria/${PRE_RECEBIMENTO_ID}/${AVARIA_A_ID}`,
        }),
      ]),
    );
    expect(replicacheRepository.appendChanges).toHaveBeenNthCalledWith(
      2,
      UNIDADE_ID,
      expect.arrayContaining([
        expect.objectContaining({
          op: 'put',
          key: `avaria/${PRE_RECEBIMENTO_ID}/${AVARIA_B_ID}`,
        }),
      ]),
    );
  });

  it('treats limparAvarias BadRequest as idempotent when recebimento is not em_conferencia', async () => {
    const removerAvariasRecebimentoUseCase = {
      execute: vi.fn().mockRejectedValue(
        new BadRequestException('Avarias só podem ser removidas durante a conferência'),
      ),
    };

    const noop = {} as never;
    const avariaRepository = {
      listByRecebimento: vi.fn().mockResolvedValue([
        {
          id: AVARIA_A_ID,
          clientDamageId: CLIENT_DAMAGE_A,
        },
      ]),
    };

    const limparUseCase = new ProcessReplicachePushUseCase(
      replicacheRepository as unknown as IReplicacheRepository,
      noop,
      noop,
      noop,
      { findByProdutoId: vi.fn() } as unknown as IProdutoRepository,
      preRecebimentoRepository as unknown as IPreRecebimentoRepository,
      {
        findByPreRecebimentoId: vi.fn().mockResolvedValue({ id: RECEBIMENTO_ID }),
      } as unknown as IRecebimentoRepository,
      avariaRepository as unknown as IRecebimentoAvariaRepository,
      userRepository as unknown as IUserRepository,
      noop,
      noop,
      listOperadorDemandasUseCase as unknown as ListOperadorDemandasUseCase,
      noop,
      noop,
      noop,
      noop,
      noop,
      removerAvariasRecebimentoUseCase as never,
    );

    await limparUseCase.execute({
      request: makePushRequest([
        {
          name: 'limparAvarias',
          args: { preRecebimentoId: PRE_RECEBIMENTO_ID },
        },
      ]),
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(removerAvariasRecebimentoUseCase.execute).toHaveBeenCalledWith({
      recebimentoId: RECEBIMENTO_ID,
    });
    expect(replicacheRepository.bumpSpaceVersion).toHaveBeenCalledWith(UNIDADE_ID);
  });

  it('removes avaria by server id when mutation sends clientDamageId', async () => {
    const localAvariaRepo = {
      listByRecebimento: vi.fn().mockResolvedValue([
        {
          id: AVARIA_A_ID,
          clientDamageId: CLIENT_DAMAGE_A,
        },
      ]),
    };
    const removeUseCase = {
      execute: vi.fn().mockResolvedValue({ removed: true }),
    };
    const noop = {} as never;

    const removerUseCase = new ProcessReplicachePushUseCase(
      replicacheRepository as unknown as IReplicacheRepository,
      noop,
      noop,
      noop,
      { findByProdutoId: vi.fn() } as unknown as IProdutoRepository,
      preRecebimentoRepository as unknown as IPreRecebimentoRepository,
      {
        findByPreRecebimentoId: vi.fn().mockResolvedValue({ id: RECEBIMENTO_ID }),
      } as unknown as IRecebimentoRepository,
      localAvariaRepo as unknown as IRecebimentoAvariaRepository,
      userRepository as unknown as IUserRepository,
      noop,
      noop,
      listOperadorDemandasUseCase as unknown as ListOperadorDemandasUseCase,
      noop,
      noop,
      noop,
      noop,
      removeUseCase as never,
      noop,
    );

    await removerUseCase.execute({
      request: makePushRequest([
        {
          name: 'removerAvaria',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            avariaId: CLIENT_DAMAGE_A,
          },
        },
      ]),
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(removeUseCase.execute).toHaveBeenCalledWith({
      recebimentoId: RECEBIMENTO_ID,
      avariaId: AVARIA_A_ID,
    });
    expect(replicacheRepository.appendChanges).toHaveBeenCalledWith(
      UNIDADE_ID,
      expect.arrayContaining([
        { op: 'del', key: `avaria/${PRE_RECEBIMENTO_ID}/${CLIENT_DAMAGE_A}` },
        { op: 'del', key: `avaria/${PRE_RECEBIMENTO_ID}/${AVARIA_A_ID}` },
      ]),
    );
  });
});

describe('ProcessReplicachePushUseCase — offline multi-client ordering', () => {
  const CLIENT_A = 'client-a';
  const CLIENT_B = 'client-b';
  const CHECKLIST_TIMESTAMP = 1_000;
  const ENCERRAR_TIMESTAMP = 2_000;

  let useCase: ProcessReplicachePushUseCase;
  let replicacheRepository: {
    getClientLastMutationId: ReturnType<typeof vi.fn>;
    appendChanges: ReturnType<typeof vi.fn>;
    bumpSpaceVersion: ReturnType<typeof vi.fn>;
    upsertClientMutationId: ReturnType<typeof vi.fn>;
  };
  let preRecebimentoRepository: { findById: ReturnType<typeof vi.fn> };
  let recebimentoRepository: {
    findByPreRecebimentoId: ReturnType<typeof vi.fn>;
  };
  let userRepository: { findById: ReturnType<typeof vi.fn> };
  let createChecklistRecebimentoUseCase: { execute: ReturnType<typeof vi.fn> };
  let encerrarConferenciaUseCase: { execute: ReturnType<typeof vi.fn> };
  let listOperadorDemandasUseCase: { execute: ReturnType<typeof vi.fn> };
  let callOrder: string[];

  beforeEach(() => {
    const lastMutationIds = new Map<string, number>();
    callOrder = [];

    replicacheRepository = {
      getClientLastMutationId: vi.fn(async (clientId: string) => {
        return lastMutationIds.get(clientId) ?? 0;
      }),
      appendChanges: vi.fn().mockResolvedValue(undefined),
      bumpSpaceVersion: vi.fn().mockResolvedValue(undefined),
      upsertClientMutationId: vi.fn(async ({ clientId, lastMutationId }) => {
        lastMutationIds.set(clientId, lastMutationId);
      }),
    };

    preRecebimentoRepository = {
      findById: vi.fn().mockResolvedValue({
        id: PRE_RECEBIMENTO_ID,
        situacao: 'em_conferencia',
        unidadeId: UNIDADE_ID,
        docaId: null,
      }),
    };

    recebimentoRepository = {
      findByPreRecebimentoId: vi.fn().mockResolvedValue({ id: RECEBIMENTO_ID }),
    };

    userRepository = {
      findById: vi.fn().mockResolvedValue({ id: USER_ID, funcionarioId: 7 }),
    };

    createChecklistRecebimentoUseCase = {
      execute: vi.fn().mockImplementation(async () => {
        callOrder.push('upsertChecklist');
        return {
          id: 'checklist-1',
          lacre: 'L123',
          tempBau: -5,
          conditions: {
            limpeza: true,
            odor: true,
            estrutura: true,
            vedacao: true,
          },
          condicaoLimpeza: true,
          condicaoOdor: true,
          condicaoEstrutura: true,
          condicaoVedacao: true,
          observacoes: undefined,
          photoCount: 0,
          createdAt: new Date('2026-07-19T12:00:00.000Z'),
        };
      }),
    };

    encerrarConferenciaUseCase = {
      execute: vi.fn().mockImplementation(async () => {
        callOrder.push('encerrarConferencia');
      }),
    };

    listOperadorDemandasUseCase = {
      execute: vi.fn().mockResolvedValue({
        items: [
          {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            recebimentoId: RECEBIMENTO_ID,
            unidadeId: UNIDADE_ID,
            placa: 'ABC1D23',
            transportadoraNome: 'Transp',
            situacao: 'em_conferencia',
            dock: 'D1',
            skuCount: 1,
            horarioPrevisto: '2026-07-19T12:00:00.000Z',
            conferenteId: 7,
            conferente: 'João',
            conferenteMatricula: '123',
            alocacaoFuncionarioId: null,
            atribuidoAMim: true,
          },
        ],
      }),
    };

    const noop = {} as never;

    useCase = new ProcessReplicachePushUseCase(
      replicacheRepository as unknown as IReplicacheRepository,
      noop,
      noop,
      noop,
      { findByProdutoId: vi.fn() } as unknown as IProdutoRepository,
      preRecebimentoRepository as unknown as IPreRecebimentoRepository,
      recebimentoRepository as unknown as IRecebimentoRepository,
      { listByRecebimento: vi.fn() } as unknown as IRecebimentoAvariaRepository,
      userRepository as unknown as IUserRepository,
      noop,
      createChecklistRecebimentoUseCase as unknown as CreateChecklistRecebimentoUseCase,
      listOperadorDemandasUseCase as unknown as ListOperadorDemandasUseCase,
      noop,
      noop,
      encerrarConferenciaUseCase as unknown as EncerrarConferenciaUseCase,
      noop,
      noop,
      noop,
    );
  });

  it('applies upsertChecklist before encerrarConferencia when sorted by timestamp across clients', async () => {
    await useCase.execute({
      request: makeMultiClientPushRequest([
        {
          clientID: CLIENT_A,
          id: 1,
          name: 'encerrarConferencia',
          args: ENCERRAR_ARGS,
          timestamp: ENCERRAR_TIMESTAMP,
        },
        {
          clientID: CLIENT_B,
          id: 1,
          name: 'upsertChecklist',
          args: CHECKLIST_ARGS,
          timestamp: CHECKLIST_TIMESTAMP,
        },
      ]),
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(callOrder).toEqual(['upsertChecklist', 'encerrarConferencia']);
    expect(createChecklistRecebimentoUseCase.execute).toHaveBeenCalledTimes(1);
    expect(encerrarConferenciaUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('ignores upsertChecklist when recebimento is no longer em_conferencia', async () => {
    createChecklistRecebimentoUseCase.execute.mockRejectedValue(
      new BadRequestException(
        'Checklist só pode ser registrado para recebimentos em andamento',
      ),
    );

    await useCase.execute({
      request: makePushRequest([
        {
          name: 'upsertChecklist',
          args: CHECKLIST_ARGS,
        },
      ]),
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(createChecklistRecebimentoUseCase.execute).toHaveBeenCalledTimes(1);
    expect(replicacheRepository.appendChanges).not.toHaveBeenCalled();
    expect(replicacheRepository.bumpSpaceVersion).toHaveBeenCalledWith(UNIDADE_ID);
  });
});

describe('ProcessReplicachePushUseCase — estado inválido idempotência', () => {
  let useCase: ProcessReplicachePushUseCase;
  let replicacheRepository: {
    getClientLastMutationId: ReturnType<typeof vi.fn>;
    appendChanges: ReturnType<typeof vi.fn>;
    bumpSpaceVersion: ReturnType<typeof vi.fn>;
    upsertClientMutationId: ReturnType<typeof vi.fn>;
  };
  let preRecebimentoRepository: { findById: ReturnType<typeof vi.fn> };
  let recebimentoRepository: {
    findByPreRecebimentoId: ReturnType<typeof vi.fn>;
  };
  let userRepository: { findById: ReturnType<typeof vi.fn> };
  let conferirItemUseCase: { execute: ReturnType<typeof vi.fn> };
  let removerLinhaConferenciaRecebimentoUseCase: { execute: ReturnType<typeof vi.fn> };
  let registrarAvariaUseCase: { execute: ReturnType<typeof vi.fn> };
  let listOperadorDemandasUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const lastMutationIds = new Map<string, number>();

    replicacheRepository = {
      getClientLastMutationId: vi.fn(async (clientId: string) => {
        return lastMutationIds.get(clientId) ?? 0;
      }),
      appendChanges: vi.fn().mockResolvedValue(undefined),
      bumpSpaceVersion: vi.fn().mockResolvedValue(undefined),
      upsertClientMutationId: vi.fn(async ({ clientId, lastMutationId }) => {
        lastMutationIds.set(clientId, lastMutationId);
      }),
    };

    preRecebimentoRepository = {
      findById: vi.fn().mockResolvedValue({
        id: PRE_RECEBIMENTO_ID,
        situacao: 'conferido',
        unidadeId: UNIDADE_ID,
        docaId: null,
      }),
    };

    recebimentoRepository = {
      findByPreRecebimentoId: vi.fn().mockResolvedValue({ id: RECEBIMENTO_ID }),
    };

    userRepository = {
      findById: vi.fn().mockResolvedValue({ id: USER_ID, funcionarioId: 7 }),
    };

    conferirItemUseCase = {
      execute: vi.fn().mockRejectedValue(
        new BadRequestException(
          'Conferência só é permitida com recebimento em andamento',
        ),
      ),
    };

    removerLinhaConferenciaRecebimentoUseCase = {
      execute: vi.fn().mockRejectedValue(
        new BadRequestException(
          'Remoção de conferência só é permitida com recebimento em andamento',
        ),
      ),
    };

    registrarAvariaUseCase = {
      execute: vi.fn().mockRejectedValue(
        new BadRequestException(
          'Avarias só podem ser registradas durante a conferência',
        ),
      ),
    };

    listOperadorDemandasUseCase = {
      execute: vi.fn().mockResolvedValue({ items: [] }),
    };

    const noop = {} as never;

    useCase = new ProcessReplicachePushUseCase(
      replicacheRepository as unknown as IReplicacheRepository,
      conferirItemUseCase as unknown as ConferirItemUseCase,
      removerLinhaConferenciaRecebimentoUseCase as never,
      noop,
      { findByProdutoId: vi.fn() } as unknown as IProdutoRepository,
      preRecebimentoRepository as unknown as IPreRecebimentoRepository,
      recebimentoRepository as unknown as IRecebimentoRepository,
      { listByRecebimento: vi.fn() } as unknown as IRecebimentoAvariaRepository,
      userRepository as unknown as IUserRepository,
      noop,
      noop,
      listOperadorDemandasUseCase as unknown as ListOperadorDemandasUseCase,
      noop,
      noop,
      noop,
      registrarAvariaUseCase as never,
      noop,
      noop,
    );
  });

  it('ignores conferirItem when recebimento is no longer em_conferencia', async () => {
    await useCase.execute({
      request: makePushRequest([
        {
          name: 'conferirItem',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            produtoId: 'PROD-1',
            quantidadeRecebida: 10,
            unidadeMedida: 'CX',
          },
        },
      ]),
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(conferirItemUseCase.execute).toHaveBeenCalledTimes(1);
    expect(replicacheRepository.appendChanges).not.toHaveBeenCalled();
    expect(replicacheRepository.bumpSpaceVersion).toHaveBeenCalledWith(UNIDADE_ID);
  });

  it('ignores registrarAvaria when recebimento is no longer em_conferencia', async () => {
    await useCase.execute({
      request: makePushRequest([
        {
          name: 'registrarAvaria',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            produtoId: 'PROD-1',
            tipo: 'embalagem',
            natureza: 'avaria',
            causa: 'transporte',
            quantidadeCaixas: 1,
            quantidadeUnidades: 0,
            photoCount: 0,
          },
        },
      ]),
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(registrarAvariaUseCase.execute).toHaveBeenCalledTimes(1);
    expect(replicacheRepository.appendChanges).not.toHaveBeenCalled();
    expect(replicacheRepository.bumpSpaceVersion).toHaveBeenCalledWith(UNIDADE_ID);
  });

  it('does not emit del change when removerConferencia fails because recebimento is no longer em_conferencia', async () => {
    await useCase.execute({
      request: makePushRequest([
        {
          name: 'removerConferencia',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            recebimentoItemId: 'item-1',
            produtoId: 'PROD-1',
            pesagemId: null,
            isPvar: false,
            conferenciaRecordId: 'conf-1',
          },
        },
      ]),
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(removerLinhaConferenciaRecebimentoUseCase.execute).toHaveBeenCalledTimes(1);
    expect(replicacheRepository.appendChanges).not.toHaveBeenCalled();
    expect(replicacheRepository.bumpSpaceVersion).toHaveBeenCalledWith(UNIDADE_ID);
  });
});

describe('ProcessReplicachePushUseCase — descarta avaria inválida sem travar fila', () => {
  it('advances lastMutationId when registrarAvaria fails with lote validation', async () => {
    const lastMutationIds = new Map<string, number>();
    const replicacheRepository = {
      getClientLastMutationId: vi.fn(async (clientId: string) => {
        return lastMutationIds.get(clientId) ?? 0;
      }),
      appendChanges: vi.fn().mockResolvedValue(undefined),
      bumpSpaceVersion: vi.fn().mockResolvedValue(undefined),
      upsertClientMutationId: vi.fn(async ({ clientId, lastMutationId }) => {
        lastMutationIds.set(clientId, lastMutationId);
      }),
    };

    const registrarAvariaUseCase = {
      execute: vi
        .fn()
        .mockRejectedValue(
          new BadRequestException(
            'Selecione o lote conferido para associar a avaria',
          ),
        ),
    };

    const useCase = new ProcessReplicachePushUseCase(
      replicacheRepository as unknown as IReplicacheRepository,
      {} as never,
      {} as never,
      {} as never,
      { findByProdutoId: vi.fn() } as unknown as IProdutoRepository,
      {
        findById: vi.fn().mockResolvedValue({
          id: PRE_RECEBIMENTO_ID,
          situacao: 'em_conferencia',
          unidadeId: UNIDADE_ID,
          docaId: null,
        }),
      } as unknown as IPreRecebimentoRepository,
      {
        findByPreRecebimentoId: vi.fn().mockResolvedValue({ id: RECEBIMENTO_ID }),
      } as unknown as IRecebimentoRepository,
      { listByRecebimento: vi.fn().mockResolvedValue([]) } as unknown as IRecebimentoAvariaRepository,
      {
        findById: vi.fn().mockResolvedValue({ id: USER_ID, funcionarioId: 7 }),
      } as unknown as IUserRepository,
      {} as never,
      {} as never,
      { execute: vi.fn().mockResolvedValue({ items: [] }) } as unknown as ListOperadorDemandasUseCase,
      {} as never,
      {} as never,
      {} as never,
      registrarAvariaUseCase as never,
      {} as never,
      {} as never,
    );

    await expect(
      useCase.execute({
        request: makePushRequest([
          {
            name: 'registrarAvaria',
            args: {
              preRecebimentoId: PRE_RECEBIMENTO_ID,
              produtoId: 'PROD-1',
              tipo: 'embalagem',
              natureza: 'avaria',
              causa: 'transporte',
              quantidadeCaixas: 1,
              quantidadeUnidades: 0,
              photoCount: 0,
            },
          },
          {
            name: 'syncDemandaFromServer',
            args: {
              preRecebimentoId: PRE_RECEBIMENTO_ID,
              situacao: 'em_conferencia',
            },
          },
        ]),
        unidadeId: UNIDADE_ID,
        userId: USER_ID,
      }),
    ).resolves.toBeUndefined();

    expect(registrarAvariaUseCase.execute).toHaveBeenCalledTimes(1);
    expect(replicacheRepository.upsertClientMutationId).toHaveBeenCalledTimes(2);
    expect(replicacheRepository.upsertClientMutationId).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        clientId: CLIENT_ID,
        lastMutationId: 1,
      }),
    );
    expect(replicacheRepository.upsertClientMutationId).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        clientId: CLIENT_ID,
        lastMutationId: 2,
      }),
    );
  });
});

describe('ProcessReplicachePushUseCase — fluxo offline ponta a ponta', () => {
  it('replays offline mutations in order and keeps ids/deletes consistent', async () => {
    const lastMutationIds = new Map<string, number>();
    const clientConferenceId = '0f6e154e-9a7b-4d56-b462-8b8a6f9d3f65';
    const clientDamageId = '11111111-1111-4111-8111-111111111111';
    const serverDamageId = 'avaria-server-1';

    const replicacheRepository = {
      getClientLastMutationId: vi.fn(async (clientId: string) => {
        return lastMutationIds.get(clientId) ?? 0;
      }),
      appendChanges: vi.fn().mockResolvedValue(undefined),
      bumpSpaceVersion: vi.fn().mockResolvedValue(undefined),
      upsertClientMutationId: vi.fn(async ({ clientId, lastMutationId }) => {
        lastMutationIds.set(clientId, lastMutationId);
      }),
    };

    const conferirItemUseCase = {
      execute: vi.fn().mockResolvedValue({
        id: 'item-server-1',
        quantidadeRecebida: 10,
        unidadeMedida: 'CX',
        pesoRecebido: null,
        etiquetaCodigo: null,
        pesagemId: null,
      }),
    };

    const removerLinhaConferenciaRecebimentoUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    };

    const createChecklistRecebimentoUseCase = {
      execute: vi.fn().mockResolvedValue({
        id: 'checklist-1',
        lacre: 'L123',
        tempBau: -5,
        conditions: {
          limpeza: true,
          odor: true,
          estrutura: true,
          vedacao: true,
        },
        observacoes: undefined,
        photoCount: 1,
        createdAt: new Date('2026-07-19T12:00:00.000Z'),
      }),
    };

    const upsertTemperaturaProdutoRecebimentoUseCase = {
      execute: vi.fn().mockResolvedValue({
        recebimentoId: RECEBIMENTO_ID,
        etapa: 'fim',
        temperatura: -8.3,
        medidoEm: '2026-07-19T12:10:00.000Z',
      }),
    };

    const encerrarConferenciaUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    };

    const registrarAvariaUseCase = {
      execute: vi.fn().mockResolvedValue({
        items: [
          {
            id: serverDamageId,
            recebimentoId: RECEBIMENTO_ID,
            produtoId: 'PROD-1',
            tipo: 'embalagem',
            natureza: 'avaria',
            causa: 'transporte',
            quantidadeCaixas: 1,
            quantidadeUnidades: 0,
            lote: null,
            validade: null,
            numeroSerie: null,
            photoCount: 1,
            replicado: false,
            clientDamageId,
            operatorId: USER_ID,
            createdAt: '2026-07-19T12:00:00.000Z',
          },
        ],
      }),
    };

    const removerAvariaRecebimentoUseCase = {
      execute: vi.fn().mockResolvedValue({ removed: true }),
    };

    const listOperadorDemandasUseCase = {
      execute: vi.fn().mockResolvedValue({
        items: [
          {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            recebimentoId: RECEBIMENTO_ID,
            unidadeId: UNIDADE_ID,
            placa: 'ABC1D23',
            transportadoraNome: 'Transp',
            situacao: 'conferido',
            dock: 'D1',
            skuCount: 1,
            horarioPrevisto: '2026-07-19T12:00:00.000Z',
            conferenteId: 7,
            conferente: 'João',
            conferenteMatricula: '123',
            alocacaoFuncionarioId: null,
            atribuidoAMim: true,
          },
        ],
      }),
    };

    const useCase = new ProcessReplicachePushUseCase(
      replicacheRepository as unknown as IReplicacheRepository,
      conferirItemUseCase as unknown as ConferirItemUseCase,
      removerLinhaConferenciaRecebimentoUseCase as never,
      {} as never,
      {
        findByProdutoId: vi.fn().mockResolvedValue({
          sku: 'SKU-1',
          descricao: 'Produto teste',
        }),
      } as unknown as IProdutoRepository,
      {
        findById: vi.fn().mockResolvedValue({
          id: PRE_RECEBIMENTO_ID,
          situacao: 'conferido',
          unidadeId: UNIDADE_ID,
          docaId: null,
          itens: [{ id: 'i-1' }],
          horarioPrevisto: new Date('2026-07-19T12:00:00.000Z'),
          placa: 'ABC1D23',
          transportadoraNome: 'Transp',
        }),
      } as unknown as IPreRecebimentoRepository,
      {
        findByPreRecebimentoId: vi.fn().mockResolvedValue({ id: RECEBIMENTO_ID }),
      } as unknown as IRecebimentoRepository,
      {
        listByRecebimento: vi.fn().mockResolvedValue([
          { id: serverDamageId, clientDamageId },
        ]),
      } as unknown as IRecebimentoAvariaRepository,
      {
        findById: vi.fn().mockResolvedValue({ id: USER_ID, funcionarioId: 7 }),
      } as unknown as IUserRepository,
      {} as never,
      createChecklistRecebimentoUseCase as unknown as CreateChecklistRecebimentoUseCase,
      listOperadorDemandasUseCase as unknown as ListOperadorDemandasUseCase,
      {} as never,
      upsertTemperaturaProdutoRecebimentoUseCase as never,
      encerrarConferenciaUseCase as unknown as EncerrarConferenciaUseCase,
      registrarAvariaUseCase as never,
      removerAvariaRecebimentoUseCase as never,
      {} as never,
    );

    await useCase.execute({
      request: makePushRequest([
        {
          name: 'conferirItem',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            produtoId: 'PROD-1',
            quantidadeRecebida: 10,
            unidadeMedida: 'CX',
            clientRecordId: clientConferenceId,
          },
        },
        {
          name: 'removerConferencia',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            recebimentoItemId: 'item-server-1',
            produtoId: 'PROD-1',
            pesagemId: null,
            isPvar: false,
            conferenciaRecordId: clientConferenceId,
          },
        },
        {
          name: 'registrarAvaria',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            produtoId: 'PROD-1',
            tipo: 'embalagem',
            natureza: 'avaria',
            causa: 'transporte',
            quantidadeCaixas: 1,
            quantidadeUnidades: 0,
            photoCount: 1,
            clientDamageId,
          },
        },
        {
          name: 'removerAvaria',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            avariaId: clientDamageId,
          },
        },
        {
          name: 'upsertChecklist',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            dockId: 'Doca 1',
            dockLabel: 'Doca 1',
            lacre: 'L123',
            tempBau: -5,
            conditions: {
              limpeza: true,
              odor: true,
              estrutura: true,
              vedacao: true,
            },
            photoCount: 1,
          },
        },
        {
          name: 'upsertTemperaturaBau',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            etapa: 'fim',
            temperatura: -8.3,
          },
        },
        {
          name: 'encerrarConferencia',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            quantidadePaletes: 10,
            teveSobreposicaoCarga: false,
          },
        },
      ]),
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(conferirItemUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ clientConferenceId }),
    );
    expect(removerLinhaConferenciaRecebimentoUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        recebimentoId: RECEBIMENTO_ID,
        itemId: 'item-server-1',
      }),
    );
    expect(removerAvariaRecebimentoUseCase.execute).toHaveBeenCalledWith({
      recebimentoId: RECEBIMENTO_ID,
      avariaId: serverDamageId,
    });
    expect(replicacheRepository.appendChanges).toHaveBeenCalledWith(
      UNIDADE_ID,
      expect.arrayContaining([
        { op: 'del', key: `avaria/${PRE_RECEBIMENTO_ID}/${clientDamageId}` },
        { op: 'del', key: `avaria/${PRE_RECEBIMENTO_ID}/${serverDamageId}` },
      ]),
    );
    expect(replicacheRepository.appendChanges).toHaveBeenCalledWith(
      UNIDADE_ID,
      expect.arrayContaining([
        expect.objectContaining({
          key: `demand/${PRE_RECEBIMENTO_ID}`,
          value: expect.objectContaining({ situacao: 'conferido' }),
        }),
      ]),
    );
  });
});

describe('ProcessReplicachePushUseCase — removerConferencia por clientConferenceId', () => {
  it('resolves server item id when delete arrives with optimistic record id in a later push', async () => {
    const lastMutationIds = new Map<string, number>();
    const clientConferenceId = '0f6e154e-9a7b-4d56-b462-8b8a6f9d3f65';
    const serverItemId = 'item-server-42';

    const replicacheRepository = {
      getClientLastMutationId: vi.fn(async (clientId: string) => {
        return lastMutationIds.get(clientId) ?? 0;
      }),
      appendChanges: vi.fn().mockResolvedValue(undefined),
      bumpSpaceVersion: vi.fn().mockResolvedValue(undefined),
      upsertClientMutationId: vi.fn(async ({ clientId, lastMutationId }) => {
        lastMutationIds.set(clientId, lastMutationId);
      }),
    };

    const removerLinhaConferenciaRecebimentoUseCase = {
      execute: vi
        .fn()
        .mockRejectedValueOnce(new NotFoundException('Item não encontrado'))
        .mockResolvedValueOnce(undefined),
    };

    const conferenciaRepository = {
      getConferenciaContext: vi.fn().mockResolvedValue({
        preRecebimentoId: PRE_RECEBIMENTO_ID,
        recebimentoId: RECEBIMENTO_ID,
        unidadeId: UNIDADE_ID,
        placa: null,
        transportadoraNome: null,
        situacao: 'em_conferencia',
        recebimentoSituacao: 'em_conferencia',
        dock: null,
        checklistPreenchido: false,
        conferenteId: null,
        conferente: null,
        conferenteMatricula: null,
        modoUnitizacao: 'gerar_etiqueta_na_armazenagem',
        itens: [],
        resumoConferido: [],
        conferidos: [
          {
            id: serverItemId,
            produtoId: 'PROD-1',
            sku: 'SKU-1',
            descricao: 'Produto 1',
            unidadesPorCaixa: 1,
            config: {
              controlaLote: false,
              controlaValidade: false,
              controlaPeso: false,
              pesoVariavel: false,
              exigirEtiquetaPesoVariavel: false,
              controlaNumeroSerie: false,
            },
            quantidadeRecebida: 1,
            unidadeMedida: 'UN',
            loteRecebido: null,
            validade: null,
            pesoRecebido: null,
            etiquetaCodigo: null,
            pesagemId: null,
            recebimentoItemId: serverItemId,
            unitizadorCodigo: null,
            unitizadorId: null,
            clientConferenceId,
          },
        ],
      }),
    };

    const useCase = new ProcessReplicachePushUseCase(
      replicacheRepository as unknown as IReplicacheRepository,
      {} as never,
      removerLinhaConferenciaRecebimentoUseCase as never,
      {} as never,
      { findByProdutoId: vi.fn() } as unknown as IProdutoRepository,
      {
        findById: vi.fn().mockResolvedValue({
          id: PRE_RECEBIMENTO_ID,
          situacao: 'em_conferencia',
          unidadeId: UNIDADE_ID,
          docaId: null,
        }),
      } as unknown as IPreRecebimentoRepository,
      {
        findByPreRecebimentoId: vi.fn().mockResolvedValue({ id: RECEBIMENTO_ID }),
      } as unknown as IRecebimentoRepository,
      { listByRecebimento: vi.fn().mockResolvedValue([]) } as unknown as IRecebimentoAvariaRepository,
      {
        findById: vi.fn().mockResolvedValue({ id: USER_ID, funcionarioId: 7 }),
      } as unknown as IUserRepository,
      {} as never,
      {} as never,
      { execute: vi.fn().mockResolvedValue({ items: [] }) } as unknown as ListOperadorDemandasUseCase,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      conferenciaRepository as never,
    );

    await useCase.execute({
      request: makePushRequest([
        {
          name: 'removerConferencia',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            recebimentoItemId: clientConferenceId,
            produtoId: 'PROD-1',
            pesagemId: null,
            isPvar: false,
            conferenciaRecordId: clientConferenceId,
          },
        },
      ]),
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(removerLinhaConferenciaRecebimentoUseCase.execute).toHaveBeenCalledTimes(2);
    expect(removerLinhaConferenciaRecebimentoUseCase.execute).toHaveBeenNthCalledWith(1, {
      recebimentoId: RECEBIMENTO_ID,
      itemId: clientConferenceId,
      userId: USER_ID,
    });
    expect(removerLinhaConferenciaRecebimentoUseCase.execute).toHaveBeenNthCalledWith(2, {
      recebimentoId: RECEBIMENTO_ID,
      itemId: serverItemId,
      userId: USER_ID,
    });
    expect(conferenciaRepository.getConferenciaContext).toHaveBeenCalledWith(
      PRE_RECEBIMENTO_ID,
    );
    expect(replicacheRepository.appendChanges).toHaveBeenCalledWith(
      UNIDADE_ID,
      expect.arrayContaining([
        {
          op: 'del',
          key: `itemConferido/${PRE_RECEBIMENTO_ID}/PROD-1/${clientConferenceId}`,
        },
      ]),
    );
  });
});

describe('ProcessReplicachePushUseCase — removerExpectedItem', () => {
  it('emits del when manual expected item is removed on server', async () => {
    const lastMutationIds = new Map<string, number>();
    const replicacheRepository = {
      getClientLastMutationId: vi.fn(async (clientId: string) => {
        return lastMutationIds.get(clientId) ?? 0;
      }),
      appendChanges: vi.fn().mockResolvedValue(undefined),
      bumpSpaceVersion: vi.fn().mockResolvedValue(undefined),
      upsertClientMutationId: vi.fn(async ({ clientId, lastMutationId }) => {
        lastMutationIds.set(clientId, lastMutationId);
      }),
    };
    const adicionarItemManualRecebimentoUseCase = {
      removeManualItem: vi.fn().mockResolvedValue(true),
    };

    const useCase = new ProcessReplicachePushUseCase(
      replicacheRepository as unknown as IReplicacheRepository,
      {} as never,
      {} as never,
      {} as never,
      { findByProdutoId: vi.fn() } as unknown as IProdutoRepository,
      {} as unknown as IPreRecebimentoRepository,
      {} as unknown as IRecebimentoRepository,
      { listByRecebimento: vi.fn() } as unknown as IRecebimentoAvariaRepository,
      {} as unknown as IUserRepository,
      {} as never,
      {} as never,
      { execute: vi.fn().mockResolvedValue({ items: [] }) } as unknown as ListOperadorDemandasUseCase,
      adicionarItemManualRecebimentoUseCase as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await useCase.execute({
      request: makePushRequest([
        {
          name: 'removerExpectedItem',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            produtoId: 'PROD-1',
          },
        },
      ]),
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(adicionarItemManualRecebimentoUseCase.removeManualItem).toHaveBeenCalledWith({
      preRecebimentoId: PRE_RECEBIMENTO_ID,
      produtoId: 'PROD-1',
    });
    expect(replicacheRepository.appendChanges).toHaveBeenCalledWith(UNIDADE_ID, [
      {
        op: 'del',
        key: `expectedItem/${PRE_RECEBIMENTO_ID}/PROD-1`,
      },
    ]);
  });

  it('returns no-op when manual expected item is already absent', async () => {
    const lastMutationIds = new Map<string, number>();
    const replicacheRepository = {
      getClientLastMutationId: vi.fn(async (clientId: string) => {
        return lastMutationIds.get(clientId) ?? 0;
      }),
      appendChanges: vi.fn().mockResolvedValue(undefined),
      bumpSpaceVersion: vi.fn().mockResolvedValue(undefined),
      upsertClientMutationId: vi.fn(async ({ clientId, lastMutationId }) => {
        lastMutationIds.set(clientId, lastMutationId);
      }),
    };
    const adicionarItemManualRecebimentoUseCase = {
      removeManualItem: vi.fn().mockResolvedValue(false),
    };

    const useCase = new ProcessReplicachePushUseCase(
      replicacheRepository as unknown as IReplicacheRepository,
      {} as never,
      {} as never,
      {} as never,
      { findByProdutoId: vi.fn() } as unknown as IProdutoRepository,
      {} as unknown as IPreRecebimentoRepository,
      {} as unknown as IRecebimentoRepository,
      { listByRecebimento: vi.fn() } as unknown as IRecebimentoAvariaRepository,
      {} as unknown as IUserRepository,
      {} as never,
      {} as never,
      { execute: vi.fn().mockResolvedValue({ items: [] }) } as unknown as ListOperadorDemandasUseCase,
      adicionarItemManualRecebimentoUseCase as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await useCase.execute({
      request: makePushRequest([
        {
          name: 'removerExpectedItem',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            produtoId: 'PROD-1',
          },
        },
      ]),
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(replicacheRepository.appendChanges).not.toHaveBeenCalled();
    expect(replicacheRepository.bumpSpaceVersion).toHaveBeenCalledWith(UNIDADE_ID);
  });
});
