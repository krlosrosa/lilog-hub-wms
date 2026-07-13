import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { recebimentoV2Db } from '../local-db/db';
import type { ConferenceRecord, SyncOperationRecord } from '../local-db/schema';
import { dismissSyncOperation, repairSyncOperations } from './repair-sync-operations.service';

const DEMAND_ID = '550e8400-e29b-41d4-a716-446655440001';

function makeConference(overrides: Partial<ConferenceRecord> = {}): ConferenceRecord {
  const now = Date.now();
  return {
    id: 'conf-1',
    demandId: DEMAND_ID,
    sku: '600598361',
    lote: '5001251010',
    quantity: 10,
    recebidaUnidade: 10,
    conferidoAt: new Date().toISOString(),
    syncStatus: 'synced',
    serverItemId: 'item-server-001',
    updatedAt: now,
    ...overrides,
  };
}

describe('repairSyncOperations', () => {
  beforeEach(async () => {
    await recebimentoV2Db.conferences.clear();
    await recebimentoV2Db.syncOperations.clear();
    await recebimentoV2Db.processes.put({
      id: DEMAND_ID,
      unidadeId: 'ITB',
      adapter: 'recebimento-v2',
      status: 'working',
      serverRevision: 1,
      baseRevision: 1,
      flowVersion: 'v2',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  it('repairs rejected remove op by resolving itemId from synced conferir', async () => {
    const rejectedRemove: SyncOperationRecord = {
      id: crypto.randomUUID(),
      aggregateId: DEMAND_ID,
      module: 'conference',
      opType: RECEBIMENTO_V2_OP_TYPES.ITEM_LINHA_REMOVE,
      sequence: 2,
      dependsOn: [],
      idempotencyKey: crypto.randomUUID(),
      payload: {
        conferenceId: 'conf-1',
        lote: '5001251010',
        sku: '600598361',
      },
      attachmentIds: [],
      status: 'rejected',
      attempts: 1,
      errorMessage: 'itemId é obrigatório',
      createdAt: 2,
      updatedAt: 2,
    };
    const syncedConferir: SyncOperationRecord = {
      id: crypto.randomUUID(),
      aggregateId: DEMAND_ID,
      module: 'conference',
      opType: RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR,
      sequence: 1,
      dependsOn: [],
      idempotencyKey: crypto.randomUUID(),
      payload: {
        conferenceId: 'conf-1',
        produtoId: 'PROD-1',
        quantidadeRecebida: 10,
        unidadeMedida: 'UN',
        loteRecebido: '5001251010',
        serverItemId: 'item-server-001',
      },
      attachmentIds: [],
      status: 'synced',
      attempts: 0,
      createdAt: 1,
      updatedAt: 1,
    };

    await recebimentoV2Db.syncOperations.bulkPut([rejectedRemove, syncedConferir]);

    const changed = await repairSyncOperations(DEMAND_ID);

    expect(changed).toBe(1);
    const repaired = await recebimentoV2Db.syncOperations.get(rejectedRemove.id);
    expect(repaired?.status).toBe('pending');
    expect(repaired?.payload).toMatchObject({ itemId: 'item-server-001' });
  });

  it('deletes orphan conferir retry when conference no longer exists', async () => {
    const brokenConferir: SyncOperationRecord = {
      id: crypto.randomUUID(),
      aggregateId: DEMAND_ID,
      module: 'conference',
      opType: RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR,
      sequence: 1,
      dependsOn: [],
      idempotencyKey: crypto.randomUUID(),
      payload: { conferenceId: 'missing-conf' },
      attachmentIds: [],
      status: 'retry',
      attempts: 1,
      errorMessage: 'invalid payload',
      createdAt: 1,
      updatedAt: 1,
    };
    await recebimentoV2Db.syncOperations.put(brokenConferir);

    const changed = await repairSyncOperations(DEMAND_ID);

    expect(changed).toBe(1);
    expect(await recebimentoV2Db.syncOperations.get(brokenConferir.id)).toBeUndefined();
  });

  it('rebuilds conferir retry payload from existing conference', async () => {
    await recebimentoV2Db.conferences.put(makeConference());
    await recebimentoV2Db.products.put({
      produtoId: 'PROD-1',
      sku: '600598361',
      description: 'Produto teste',
      unidadeId: 'ITB',
      empresa: '',
      categoria: '',
      tipo: '',
      ean: '',
      dum: '',
      shelfLife: 0,
      pesoBrutoUnidade: 0,
      pesoBrutoCaixa: 0,
      pesoBrutoPalete: 0,
      pesoLiquidoUnidade: 0,
      pesoLiquidoCaixa: 0,
      pesoLiquidoPalete: 0,
      unidadesPorCaixa: 10,
      caixasPorPalete: 0,
      controlaLote: true,
      controlaValidade: true,
      controlaPeso: false,
      pesoVariavel: false,
      serverRevision: 0,
      updatedAt: Date.now(),
      deletedAt: null,
    });
    await recebimentoV2Db.expectedItems.put({
      id: 'exp-1',
      demandId: DEMAND_ID,
      produtoId: 'PROD-1',
      sku: '600598361',
      descricao: 'Produto teste',
      quantidadeEsperada: 10,
      unidadeMedida: 'UN',
      unidadesPorCaixa: 10,
      updatedAt: Date.now(),
    });
    await recebimentoV2Db.unitConfigs.put({
      unidadeId: 'ITB',
      config: {},
      cachedAt: Date.now(),
    });

    const brokenConferir: SyncOperationRecord = {
      id: crypto.randomUUID(),
      aggregateId: DEMAND_ID,
      module: 'conference',
      opType: RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR,
      sequence: 1,
      dependsOn: [],
      idempotencyKey: crypto.randomUUID(),
      payload: { conferenceId: 'conf-1' },
      attachmentIds: [],
      status: 'retry',
      attempts: 1,
      createdAt: 1,
      updatedAt: 1,
    };
    await recebimentoV2Db.syncOperations.put(brokenConferir);

    const changed = await repairSyncOperations(DEMAND_ID);

    expect(changed).toBe(1);
    const repaired = await recebimentoV2Db.syncOperations.get(brokenConferir.id);
    expect(repaired?.status).toBe('pending');
    expect(repaired?.payload).toMatchObject({
      conferenceId: 'conf-1',
      produtoId: 'PROD-1',
      quantidadeRecebida: 10,
      unidadeMedida: 'UN',
    });
  });
});

describe('dismissSyncOperation', () => {
  it('removes sync operation from local queue', async () => {
    const opId = crypto.randomUUID();
    await recebimentoV2Db.syncOperations.put({
      id: opId,
      aggregateId: DEMAND_ID,
      module: 'conference',
      opType: RECEBIMENTO_V2_OP_TYPES.ITEM_LINHA_REMOVE,
      sequence: 1,
      dependsOn: [],
      idempotencyKey: crypto.randomUUID(),
      payload: {},
      attachmentIds: [],
      status: 'rejected',
      attempts: 1,
      createdAt: 1,
      updatedAt: 1,
    });

    await dismissSyncOperation(opId);

    expect(await recebimentoV2Db.syncOperations.get(opId)).toBeUndefined();
  });
});
