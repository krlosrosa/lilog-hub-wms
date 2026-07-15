import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/sync-api.js', () => ({
  fetchProcesses: vi.fn(),
}));

vi.mock('./auto-sync-v2.service.js', () => ({
  hasPendingSyncWork: vi.fn().mockResolvedValue(false),
}));

vi.mock('./sync-photo.helpers.js', () => ({
  hasPendingPhotoUploads: vi.fn().mockResolvedValue(false),
}));

vi.mock('../lib/reconcile-remote-situacao.js', () => ({
  reconcileRemoteSituacao: vi.fn().mockResolvedValue({ situacao: 'liberado_para_conferencia', reconciled: false }),
}));

import { fetchProcesses } from '../api/sync-api.js';
import { recebimentoV2Db } from '../local-db/db';
import { hasPendingSyncWork } from './auto-sync-v2.service.js';
import { syncProcessList } from './sync-process-list.service.js';

const UNIDADE_ID = 'ITB';
const DEMAND_ACTIVE = 'demand-active';
const DEMAND_STALE = 'demand-stale';

const mockFetchProcesses = vi.mocked(fetchProcesses);
const mockHasPendingSyncWork = vi.mocked(hasPendingSyncWork);

describe('syncProcessList', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await recebimentoV2Db.processes.clear();
    await recebimentoV2Db.demands.clear();
  });

  afterEach(async () => {
    await recebimentoV2Db.processes.clear();
    await recebimentoV2Db.demands.clear();
  });

  it('removes local headers that are no longer returned by the server', async () => {
    await recebimentoV2Db.processes.bulkPut([
      {
        id: DEMAND_STALE,
        unidadeId: UNIDADE_ID,
        adapter: 'recebimento-v2',
        status: 'ready',
        serverRevision: 1,
        baseRevision: 0,
        flowVersion: 'v2',
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: DEMAND_ACTIVE,
        unidadeId: UNIDADE_ID,
        adapter: 'recebimento-v2',
        status: 'working',
        serverRevision: 2,
        baseRevision: 0,
        flowVersion: 'v2',
        createdAt: 2,
        updatedAt: 2,
      },
    ]);
    await recebimentoV2Db.demands.bulkPut([
      {
        id: DEMAND_STALE,
        unidadeId: UNIDADE_ID,
        routeId: DEMAND_STALE,
        fornecedorCodigo: '',
        fornecedorNome: 'Fornecedor antigo',
        status: 'liberado_para_conferencia',
        situacao: 'liberado_para_conferencia',
        dataPrevisaoEntrega: '',
        dataCriacao: '',
        serverRevision: 1,
        updatedAt: 1,
      },
    ]);

    mockFetchProcesses.mockResolvedValue({
      items: [
        {
          demandId: DEMAND_ACTIVE,
          unidadeId: UNIDADE_ID,
          situacao: 'em_conferencia',
          preRecebimentoSituacao: 'em_conferencia',
          serverRevision: 3,
          updatedAt: new Date().toISOString(),
          tombstone: false,
          supplier: 'Transportadora',
        },
      ],
      nextCursor: null,
      hasMore: false,
    });

    const result = await syncProcessList(UNIDADE_ID);

    expect(result.removedCount).toBe(1);
    expect(await recebimentoV2Db.processes.get(DEMAND_STALE)).toBeUndefined();
    expect(await recebimentoV2Db.demands.get(DEMAND_STALE)).toBeUndefined();
    expect(await recebimentoV2Db.processes.get(DEMAND_ACTIVE)).toBeDefined();
  });

  it('keeps local headers with pending sync work even when absent from server', async () => {
    await recebimentoV2Db.processes.put({
      id: DEMAND_STALE,
      unidadeId: UNIDADE_ID,
      adapter: 'recebimento-v2',
      status: 'working',
      serverRevision: 1,
      baseRevision: 0,
      flowVersion: 'v2',
      createdAt: 1,
      updatedAt: 1,
    });

    mockHasPendingSyncWork.mockResolvedValueOnce(true);
    mockFetchProcesses.mockResolvedValue({
      items: [],
      nextCursor: null,
      hasMore: false,
    });

    const result = await syncProcessList(UNIDADE_ID);

    expect(result.removedCount).toBe(0);
    expect(await recebimentoV2Db.processes.get(DEMAND_STALE)).toBeDefined();
  });

  it('persiste capabilities de apoio derivadas do header quando ainda não baixou', async () => {
    mockFetchProcesses.mockResolvedValue({
      items: [
        {
          demandId: DEMAND_ACTIVE,
          unidadeId: UNIDADE_ID,
          situacao: 'em_conferencia',
          preRecebimentoSituacao: 'em_conferencia',
          serverRevision: 1,
          updatedAt: new Date().toISOString(),
          tombstone: false,
          supplier: 'Transportadora',
          souApoio: true,
          papel: 'apoio',
        },
      ],
      nextCursor: null,
      hasMore: false,
    });

    await syncProcessList(UNIDADE_ID);

    const process = await recebimentoV2Db.processes.get(DEMAND_ACTIVE);
    expect(process?.souApoio).toBe(true);
    expect(process?.papelDoUsuario).toBe('apoio');
    expect(process?.capabilities).toEqual({
      canEditChecklist: false,
      canRegistrarTemperatura: false,
      canFinalizar: false,
      canGerenciarPaletes: true,
      canConferirItens: true,
    });
  });

  it('atualiza capabilities restritivas quando header indica demanda disponível', async () => {
    await recebimentoV2Db.processes.put({
      id: DEMAND_ACTIVE,
      unidadeId: UNIDADE_ID,
      adapter: 'recebimento-v2',
      status: 'ready',
      serverRevision: 1,
      baseRevision: 0,
      flowVersion: 'v2',
      papelDoUsuario: null,
      capabilities: {
        canEditChecklist: false,
        canRegistrarTemperatura: false,
        canFinalizar: false,
        canGerenciarPaletes: false,
        canConferirItens: false,
      },
      createdAt: 1,
      updatedAt: 1,
    });

    mockFetchProcesses.mockResolvedValue({
      items: [
        {
          demandId: DEMAND_ACTIVE,
          unidadeId: UNIDADE_ID,
          situacao: 'liberado_para_conferencia',
          preRecebimentoSituacao: 'liberado_para_conferencia',
          serverRevision: 2,
          updatedAt: new Date().toISOString(),
          tombstone: false,
          supplier: 'Transportadora',
        },
      ],
      nextCursor: null,
      hasMore: false,
    });

    await syncProcessList(UNIDADE_ID);

    const process = await recebimentoV2Db.processes.get(DEMAND_ACTIVE);
    expect(process?.capabilities?.canEditChecklist).toBe(true);
  });
});
