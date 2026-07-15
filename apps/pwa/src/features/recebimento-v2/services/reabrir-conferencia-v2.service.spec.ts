import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recebimentoV2Db } from '../local-db/db';
import { reabrirConferenciaV2 } from './reabrir-conferencia-v2.service';

vi.mock('../api/sync-api', () => ({
  reabrirConferencia: vi.fn(),
}));

vi.mock('./auto-sync-v2.service', () => ({
  resetAutoSyncBackoff: vi.fn(),
  triggerAutoSyncIfPending: vi.fn(),
}));

import { reabrirConferencia } from '../api/sync-api';
import {
  resetAutoSyncBackoff,
  triggerAutoSyncIfPending,
} from './auto-sync-v2.service';

describe('reabrirConferenciaV2', () => {
  const demandId = 'demand-1';
  const recebimentoId = 'recebimento-1';

  beforeEach(async () => {
    vi.clearAllMocks();
    await recebimentoV2Db.syncOperations.clear();
    await recebimentoV2Db.processes.clear();
    await recebimentoV2Db.demands.clear();

    await recebimentoV2Db.processes.put({
      id: demandId,
      unidadeId: 'unit-1',
      adapter: 'recebimento-v2',
      status: 'completed',
      serverRevision: 1,
      baseRevision: 0,
      flowVersion: 'v2',
      recebimentoId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await recebimentoV2Db.demands.put({
      id: demandId,
      unidadeId: 'unit-1',
      routeId: demandId,
      fornecedorCodigo: '',
      fornecedorNome: '',
      status: 'conferido',
      situacao: 'conferido',
      dataPrevisaoEntrega: '',
      dataCriacao: '',
      updatedAt: Date.now(),
    });
  });

  it('reopens on server and resets blocked sync operations', async () => {
    vi.mocked(reabrirConferencia).mockResolvedValue({
      id: recebimentoId,
      situacao: 'em_conferencia',
    });

    const opId = crypto.randomUUID();
    await recebimentoV2Db.syncOperations.put({
      id: opId,
      aggregateId: demandId,
      module: 'recebimento-v2',
      opType: 'recebimento.item.conferir',
      sequence: 1,
      dependsOn: [],
      idempotencyKey: opId,
      payload: {},
      attachmentIds: [],
      status: 'retry',
      attempts: 2,
      errorMessage: 'Conferência só é permitida com recebimento em andamento',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await reabrirConferenciaV2(demandId);

    expect(reabrirConferencia).toHaveBeenCalledWith(recebimentoId);

    const demand = await recebimentoV2Db.demands.get(demandId);
    expect(demand?.situacao).toBe('em_conferencia');

    const process = await recebimentoV2Db.processes.get(demandId);
    expect(process?.status).toBe('working');

    const op = await recebimentoV2Db.syncOperations.get(opId);
    expect(op?.status).toBe('pending');
    expect(op?.attempts).toBe(0);
    expect(op?.errorMessage).toBeUndefined();

    expect(resetAutoSyncBackoff).toHaveBeenCalledWith(demandId);
    expect(triggerAutoSyncIfPending).toHaveBeenCalledWith(demandId);
  });

  it('throws when recebimentoId is missing', async () => {
    await recebimentoV2Db.processes.update(demandId, { recebimentoId: undefined });

    await expect(reabrirConferenciaV2(demandId)).rejects.toThrow(
      'Recebimento ainda não foi iniciado no servidor',
    );
  });
});
