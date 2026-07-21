import { describe, expect, it, vi } from 'vitest';

import { ProcessReplicachePullUseCase } from '../../../src/application/usecases/replicache/process-replicache-pull.usecase.js';
import { ProcessReplicachePushUseCase } from '../../../src/application/usecases/replicache/process-replicache-push.usecase.js';
import type { IReplicacheRepository } from '../../../src/domain/repositories/replicache/replicache.repository.js';
import type { IPreRecebimentoRepository } from '../../../src/domain/repositories/recebimento/pre-recebimento.repository.js';
import type { IRecebimentoRepository } from '../../../src/domain/repositories/recebimento/recebimento.repository.js';
import type { IRecebimentoAvariaRepository } from '../../../src/domain/repositories/recebimento/recebimento-avaria.repository.js';
import type { IProdutoRepository } from '../../../src/domain/repositories/produto/produto.repository.js';
import type { IUserRepository } from '../../../src/domain/repositories/user/user.repository.js';
import type { BuildRecebimentoReplicacheSnapshotService } from '../../../src/application/services/replicache/build-recebimento-replicache-snapshot.service.js';
import type { ConferirItemUseCase } from '../../../src/application/usecases/recebimento/conferir-item.usecase.js';
import type { CreateChecklistRecebimentoUseCase } from '../../../src/application/usecases/recebimento/create-checklist-recebimento.usecase.js';
import type { EncerrarConferenciaUseCase } from '../../../src/application/usecases/recebimento/encerrar-conferencia.usecase.js';
import type { IniciarRecebimentoUseCase } from '../../../src/application/usecases/recebimento/iniciar-recebimento.usecase.js';
import type { ListOperadorDemandasUseCase } from '../../../src/application/usecases/recebimento/list-operador-demandas.usecase.js';

const PRE_RECEBIMENTO_ID = '11111111-1111-1111-1111-111111111111';
const RECEBIMENTO_ID = '22222222-2222-2222-2222-222222222222';
const UNIDADE_ID = 'pavuna';
const USER_ID = 42;
const CLIENT_ID = 'client-1';
const CLIENT_DAMAGE_ID = '11111111-1111-4111-8111-111111111111';

function makePushRequest(
  mutations: Array<{
    name: string;
    args: unknown;
    clientID?: string;
  }>,
) {
  return {
    clientGroupID: 'cg-1',
    mutations: mutations.map((mutation, index) => ({
      clientID: mutation.clientID ?? CLIENT_ID,
      id: index + 1,
      name: mutation.name,
      args: mutation.args,
      timestamp: Date.now() + index,
    })),
    profileID: 'profile-1',
    pushVersion: 1 as const,
    schemaVersion: 'recebimento-rc-v7',
  };
}

describe('Replicache offline flow integration (push -> pull)', () => {
  it('reconnects with clear snapshot and no stale keys', async () => {
    const lastMutationIds = new Map<string, number>();
    let spaceVersion = 7;
    const appendedChanges: Array<{ key: string; op: 'put' | 'del'; value?: unknown }> = [];

    const replicacheRepository: IReplicacheRepository = {
      getSpaceVersion: vi.fn(async () => spaceVersion),
      getClientLastMutationId: vi.fn(async (clientId: string) => {
        return lastMutationIds.get(clientId) ?? 0;
      }),
      listClientGroupMutationIds: vi.fn(async () => {
        return Object.fromEntries(lastMutationIds.entries());
      }),
      appendChanges: vi.fn(async (_spaceId, changes) => {
        appendedChanges.push(...changes);
        spaceVersion += Math.max(1, changes.length);
        return spaceVersion;
      }),
      upsertClientMutationId: vi.fn(async ({ clientId, lastMutationId }) => {
        lastMutationIds.set(clientId, lastMutationId);
      }),
      listChangesSinceVersion: vi.fn(async () => []),
      bumpSpaceVersion: vi.fn(async () => {
        spaceVersion += 1;
        return spaceVersion;
      }),
    };

    const state = {
      situacao: 'em_conferencia' as 'em_conferencia' | 'conferido',
      manualExpectedItems: [] as Array<{
        produtoId: string;
        sku: string;
      }>,
      item: null as null | {
        id: string;
        produtoId: string;
        sku: string;
        descricao: string;
        quantidadeRecebida: number;
        unidadeMedida: string;
        clientConferenceId: string | null;
      },
      checklist: null as null | { lacre: string; tempBau: number | null; photoCount: number },
      temperaturaFim: null as null | { etapa: 'fim'; temperatura: number; medidoEm: string },
      avarias: [] as Array<{
        id: string;
        clientDamageId: string | null;
        produtoId: string | null;
        tipo: string;
        natureza: string;
        causa: string;
        quantidadeCaixas: number;
        quantidadeUnidades: number;
        photoCount: number;
      }>,
    };

    const conferirItemUseCase = {
      execute: vi.fn(async ({ data, clientConferenceId }) => {
        state.item = {
          id: 'item-server-1',
          produtoId: data.produtoId,
          sku: 'SKU-1',
          descricao: 'Produto teste',
          quantidadeRecebida: data.quantidadeRecebida,
          unidadeMedida: data.unidadeMedida,
          clientConferenceId: clientConferenceId ?? null,
        };
        return {
          id: state.item.id,
          quantidadeRecebida: state.item.quantidadeRecebida,
          unidadeMedida: state.item.unidadeMedida,
          pesoRecebido: null,
          etiquetaCodigo: null,
          pesagemId: null,
        };
      }),
    };

    const removerLinhaConferenciaRecebimentoUseCase = {
      execute: vi.fn(async () => {
        state.item = null;
      }),
    };

    const createChecklistRecebimentoUseCase = {
      execute: vi.fn(async ({ data }) => {
        state.checklist = {
          lacre: data.lacre,
          tempBau: data.tempBau ?? null,
          photoCount: data.photoCount,
        };
        return {
          id: 'checklist-1',
          lacre: data.lacre,
          tempBau: data.tempBau ?? null,
          conditions: data.conditions,
          observacoes: data.observacoes,
          photoCount: data.photoCount,
          createdAt: new Date('2026-07-19T12:00:00.000Z'),
        };
      }),
    };

    const upsertTemperaturaProdutoRecebimentoUseCase = {
      execute: vi.fn(async ({ data }) => {
        state.temperaturaFim = {
          etapa: 'fim',
          temperatura: data.temperatura,
          medidoEm: '2026-07-19T12:10:00.000Z',
        };
        return {
          recebimentoId: RECEBIMENTO_ID,
          etapa: 'fim',
          temperatura: data.temperatura,
          medidoEm: state.temperaturaFim.medidoEm,
        };
      }),
    };

    const registrarAvariaUseCase = {
      execute: vi.fn(async (input) => {
        const row = {
          id: 'avaria-server-1',
          clientDamageId: input.clientDamageId ?? null,
          produtoId: input.produtoId ?? null,
          tipo: input.tipo,
          natureza: input.natureza,
          causa: input.causa,
          quantidadeCaixas: input.quantidadeCaixas,
          quantidadeUnidades: input.quantidadeUnidades,
          photoCount: input.photoCount,
        };
        state.avarias = [row];
        return {
          items: [
            {
              ...row,
              recebimentoId: RECEBIMENTO_ID,
              lote: null,
              validade: null,
              numeroSerie: null,
              replicado: false,
              operatorId: USER_ID,
              createdAt: '2026-07-19T12:00:00.000Z',
            },
          ],
        };
      }),
    };

    const removerAvariaRecebimentoUseCase = {
      execute: vi.fn(async ({ avariaId }) => {
        state.avarias = state.avarias.filter((row) => row.id !== avariaId);
        return { removed: true };
      }),
    };

    const encerrarConferenciaUseCase = {
      execute: vi.fn(async () => {
        state.situacao = 'conferido';
      }),
    };

    const listOperadorDemandasUseCase = {
      execute: vi.fn(async () => {
        return {
          items:
            state.situacao === 'em_conferencia'
              ? [
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
                ]
              : [],
        };
      }),
    };

    const adicionarItemManualRecebimentoUseCase = {
      execute: vi.fn(async ({ produtoId, sku }) => {
        state.manualExpectedItems = [{ produtoId, sku }];
        return {
          preRecebimentoId: PRE_RECEBIMENTO_ID,
          produtoId,
          sku,
          descricao: 'Produto teste',
          unidadeMedida: 'UN',
          unidadesPorCaixa: 1,
          quantidadeEsperada: 0,
          config: {
            controlaLote: false,
            controlaValidade: false,
            controlaPeso: false,
            pesoVariavel: false,
            exigirEtiquetaPesoVariavel: false,
            controlaNumeroSerie: false,
          },
          isNovo: true,
        };
      }),
      removeManualItem: vi.fn(async ({ produtoId }) => {
        const before = state.manualExpectedItems.length;
        state.manualExpectedItems = state.manualExpectedItems.filter(
          (entry) => entry.produtoId !== produtoId,
        );
        return state.manualExpectedItems.length < before;
      }),
    };

    const pushUseCase = new ProcessReplicachePushUseCase(
      replicacheRepository,
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
        listByRecebimento: vi.fn(async () =>
          state.avarias.map((item) => ({
            id: item.id,
            recebimentoId: RECEBIMENTO_ID,
            produtoId: item.produtoId,
            tipo: item.tipo,
            natureza: item.natureza,
            causa: item.causa,
            quantidadeCaixas: item.quantidadeCaixas,
            quantidadeUnidades: item.quantidadeUnidades,
            lote: null,
            validade: null,
            numeroSerie: null,
            photoCount: item.photoCount,
            replicado: false,
            clientDamageId: item.clientDamageId,
            operatorId: USER_ID,
            createdAt: new Date('2026-07-19T12:00:00.000Z'),
          })),
        ),
      } as unknown as IRecebimentoAvariaRepository,
      {
        findById: vi.fn().mockResolvedValue({ id: USER_ID, funcionarioId: 7 }),
      } as unknown as IUserRepository,
      {} as unknown as IniciarRecebimentoUseCase,
      createChecklistRecebimentoUseCase as unknown as CreateChecklistRecebimentoUseCase,
      listOperadorDemandasUseCase as unknown as ListOperadorDemandasUseCase,
      adicionarItemManualRecebimentoUseCase as never,
      upsertTemperaturaProdutoRecebimentoUseCase as never,
      encerrarConferenciaUseCase as unknown as EncerrarConferenciaUseCase,
      registrarAvariaUseCase as never,
      removerAvariaRecebimentoUseCase as never,
      {} as never,
    );

    await pushUseCase.execute({
      request: makePushRequest([
        {
          name: 'adicionarItemManual',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            produtoId: 'PROD-2',
            sku: 'SKU-2',
          },
        },
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
        {
          name: 'removerConferencia',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            recebimentoItemId: 'item-server-1',
            produtoId: 'PROD-1',
            pesagemId: null,
            isPvar: false,
            conferenciaRecordId: '0f6e154e-9a7b-4d56-b462-8b8a6f9d3f65',
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
            clientDamageId: CLIENT_DAMAGE_ID,
          },
        },
        {
          name: 'removerAvaria',
          args: {
            preRecebimentoId: PRE_RECEBIMENTO_ID,
            avariaId: CLIENT_DAMAGE_ID,
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

    const snapshotService = {
      buildSnapshot: vi.fn(async () => {
        const patch: Array<{ op: 'put'; key: string; value: unknown }> = [
          {
            op: 'put',
            key: `demand/${PRE_RECEBIMENTO_ID}`,
            value: {
              preRecebimentoId: PRE_RECEBIMENTO_ID,
              recebimentoId: RECEBIMENTO_ID,
              unidadeId: UNIDADE_ID,
              placa: 'ABC1D23',
              transportadoraNome: 'Transp',
              situacao: state.situacao,
              dock: 'D1',
              skuCount: 1,
              horarioPrevisto: '2026-07-19T12:00:00.000Z',
              conferenteId: 7,
              conferente: 'João',
              conferenteMatricula: '123',
              alocacaoFuncionarioId: null,
              atribuidoAMim: true,
            },
          },
        ];

        if (state.checklist) {
          patch.push({
            op: 'put',
            key: `checklist/${PRE_RECEBIMENTO_ID}`,
            value: {
              preRecebimentoId: PRE_RECEBIMENTO_ID,
              recebimentoId: RECEBIMENTO_ID,
              dock: 'D1',
              lacre: state.checklist.lacre,
              tempBau: state.checklist.tempBau,
              conditions: {
                limpeza: true,
                odor: true,
                estrutura: true,
                vedacao: true,
              },
              observacoes: null,
              photoCount: state.checklist.photoCount,
              savedAt: '2026-07-19T12:00:00.000Z',
            },
          });
        }

        for (const expectedItem of state.manualExpectedItems) {
          patch.push({
            op: 'put',
            key: `expectedItem/${PRE_RECEBIMENTO_ID}/${expectedItem.produtoId}`,
            value: {
              preRecebimentoId: PRE_RECEBIMENTO_ID,
              produtoId: expectedItem.produtoId,
              sku: expectedItem.sku,
              descricao: 'Produto teste',
              unidadeMedida: 'UN',
              unidadesPorCaixa: 1,
              quantidadeEsperada: 0,
              config: {
                controlaLote: false,
                controlaValidade: false,
                controlaPeso: false,
                pesoVariavel: false,
                exigirEtiquetaPesoVariavel: false,
                controlaNumeroSerie: false,
              },
              isNovo: true,
            },
          });
        }

        if (state.temperaturaFim) {
          patch.push({
            op: 'put',
            key: `temperaturaBau/${PRE_RECEBIMENTO_ID}/fim`,
            value: {
              recebimentoId: RECEBIMENTO_ID,
              etapa: 'fim',
              temperatura: state.temperaturaFim.temperatura,
              medidoEm: state.temperaturaFim.medidoEm,
            },
          });
        }

        if (state.item) {
          patch.push({
            op: 'put',
            key: `itemConferido/${PRE_RECEBIMENTO_ID}/${state.item.produtoId}/${state.item.id}`,
            value: state.item,
          });
        }

        for (const avaria of state.avarias) {
          patch.push({
            op: 'put',
            key: `avaria/${PRE_RECEBIMENTO_ID}/${avaria.id}`,
            value: avaria,
          });
        }

        return patch;
      }),
    };

    const pullUseCase = new ProcessReplicachePullUseCase(
      replicacheRepository,
      snapshotService as unknown as BuildRecebimentoReplicacheSnapshotService,
    );

    const pull = await pullUseCase.execute({
      request: {
        clientGroupID: 'cg-1',
        cookie: null,
        profileID: 'profile-1',
        pullVersion: 1,
        schemaVersion: 'recebimento-rc-v7',
      },
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(pull.patch[0]).toEqual({ op: 'clear' });
    expect(pull.patch).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          op: 'put',
          key: `demand/${PRE_RECEBIMENTO_ID}`,
          value: expect.objectContaining({ situacao: 'conferido' }),
        }),
        expect.objectContaining({
          op: 'put',
          key: `checklist/${PRE_RECEBIMENTO_ID}`,
        }),
        expect.objectContaining({
          op: 'put',
          key: `temperaturaBau/${PRE_RECEBIMENTO_ID}/fim`,
        }),
        expect.objectContaining({
          op: 'put',
          key: `expectedItem/${PRE_RECEBIMENTO_ID}/PROD-2`,
        }),
      ]),
    );
    expect(pull.patch).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: `itemConferido/${PRE_RECEBIMENTO_ID}/PROD-1/item-server-1`,
        }),
        expect.objectContaining({
          key: `avaria/${PRE_RECEBIMENTO_ID}/avaria-server-1`,
        }),
      ]),
    );
    expect(appendedChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          op: 'del',
          key: `avaria/${PRE_RECEBIMENTO_ID}/${CLIENT_DAMAGE_ID}`,
        }),
      ]),
    );
  });
});
