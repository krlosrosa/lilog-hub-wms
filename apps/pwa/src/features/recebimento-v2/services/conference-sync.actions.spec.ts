import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { recebimentoV2Db } from '../local-db/db';
import type { ConferenceRecord, SyncOperationRecord } from '../local-db/schema';
import { deleteConferenceRecord } from './conference-sync.actions';

const DEMAND_ID = '550e8400-e29b-41d4-a716-446655440001';

function makeConference(overrides: Partial<ConferenceRecord> = {}): ConferenceRecord {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    demandId: DEMAND_ID,
    sku: '600598361',
    quantity: 10,
    conferidoAt: new Date().toISOString(),
    syncStatus: 'pending',
    updatedAt: now,
    ...overrides,
  };
}

function makePendingConferirOp(
  conferenceId: string,
  overrides: Partial<SyncOperationRecord> = {},
): SyncOperationRecord {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    aggregateId: DEMAND_ID,
    module: 'conference',
    opType: RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR,
    sequence: now,
    dependsOn: [],
    idempotencyKey: crypto.randomUUID(),
    payload: { conferenceId, produtoId: 'PROD-1', quantidadeRecebida: 10, unidadeMedida: 'UN' },
    attachmentIds: [],
    status: 'pending',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('deleteConferenceRecord', () => {
  beforeEach(async () => {
    await recebimentoV2Db.conferences.clear();
    await recebimentoV2Db.syncOperations.clear();
  });

  it('removes unsynced conference locally and cancels pending ITEM_CONFERIR op', async () => {
    const conference = makeConference();
    const conferirOp = makePendingConferirOp(conference.id);
    await recebimentoV2Db.conferences.put(conference);
    await recebimentoV2Db.syncOperations.put(conferirOp);

    const enqueued = await deleteConferenceRecord(conference.id);

    expect(enqueued).toBe(false);
    expect(await recebimentoV2Db.conferences.get(conference.id)).toBeUndefined();

    const remainingOps = await recebimentoV2Db.syncOperations.toArray();
    expect(remainingOps).toHaveLength(1);
    expect(remainingOps[0]).toMatchObject({
      id: conferirOp.id,
      opType: RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR,
      status: 'rejected',
      lifecycleStatus: 'CANCELLED',
    });
  });

  it('enqueues ITEM_LINHA_REMOVE with server itemId and removes conference locally', async () => {
    const conference = makeConference({
      serverItemId: 'item-server-001',
      syncStatus: 'synced',
      lote: '1234567890',
    });
    await recebimentoV2Db.conferences.put(conference);

    const enqueued = await deleteConferenceRecord(conference.id);

    expect(enqueued).toBe(true);
    expect(await recebimentoV2Db.conferences.get(conference.id)).toBeUndefined();

    const removeOps = (await recebimentoV2Db.syncOperations.toArray()).filter(
      (op) => op.opType === RECEBIMENTO_V2_OP_TYPES.ITEM_LINHA_REMOVE,
    );

    expect(removeOps).toHaveLength(1);
    expect(removeOps[0]?.payload).toMatchObject({
      itemId: 'item-server-001',
      conferenceId: conference.id,
      sku: '600598361',
      lote: '1234567890',
    });
  });

  it('enqueues PESAGEM_REMOVE for synced PVAR box instead of removing whole item line', async () => {
    const conference = makeConference({
      isPvarBox: true,
      peso: 12.345,
      recebidaCaixa: 1,
      serverItemId: 'item-pvar-001',
      serverPesagemId: 'pesagem-001',
      syncStatus: 'synced',
    });
    const sibling = makeConference({
      isPvarBox: true,
      peso: 11.2,
      recebidaCaixa: 1,
      serverItemId: 'item-pvar-001',
      serverPesagemId: 'pesagem-002',
      syncStatus: 'synced',
    });
    await recebimentoV2Db.conferences.bulkPut([conference, sibling]);

    const enqueued = await deleteConferenceRecord(conference.id);

    expect(enqueued).toBe(true);
    expect(await recebimentoV2Db.conferences.get(conference.id)).toBeUndefined();
    expect(await recebimentoV2Db.conferences.get(sibling.id)).toBeDefined();

    const removeOps = await recebimentoV2Db.syncOperations.toArray();
    expect(removeOps).toHaveLength(1);
    expect(removeOps[0]?.opType).toBe(RECEBIMENTO_V2_OP_TYPES.PESAGEM_REMOVE);
    expect(removeOps[0]?.payload).toMatchObject({
      pesagemId: 'pesagem-001',
      conferenceId: conference.id,
    });
  });

  it('uses ITEM_LINHA_REMOVE only for last remaining PVAR box without pesagemId', async () => {
    const conference = makeConference({
      isPvarBox: true,
      peso: 12.345,
      recebidaCaixa: 1,
      serverItemId: 'item-pvar-001',
      syncStatus: 'synced',
    });
    await recebimentoV2Db.conferences.put(conference);

    const enqueued = await deleteConferenceRecord(conference.id);

    expect(enqueued).toBe(true);
    const removeOps = (await recebimentoV2Db.syncOperations.toArray()).filter(
      (op) => op.opType === RECEBIMENTO_V2_OP_TYPES.ITEM_LINHA_REMOVE,
    );
    expect(removeOps).toHaveLength(1);
    expect(removeOps[0]?.payload).toMatchObject({ itemId: 'item-pvar-001' });
  });

  it('does not enqueue server remove for middle PVAR box without pesagemId', async () => {
    const conference = makeConference({
      isPvarBox: true,
      peso: 12.345,
      recebidaCaixa: 1,
      serverItemId: 'item-pvar-001',
      syncStatus: 'synced',
    });
    const sibling = makeConference({
      isPvarBox: true,
      peso: 11.2,
      recebidaCaixa: 1,
      serverItemId: 'item-pvar-001',
      syncStatus: 'synced',
    });
    await recebimentoV2Db.conferences.bulkPut([conference, sibling]);

    const enqueued = await deleteConferenceRecord(conference.id);

    expect(enqueued).toBe(false);
    expect(await recebimentoV2Db.syncOperations.count()).toBe(0);
  });

  it('resolves server itemId from synced conferir op payload for legacy records', async () => {
    const conference = makeConference({ syncStatus: 'synced' });
    const conferirOp = makePendingConferirOp(conference.id, {
      status: 'synced',
      payload: {
        conferenceId: conference.id,
        produtoId: 'PROD-1',
        serverItemId: 'legacy-item-99',
      },
    });
    await recebimentoV2Db.conferences.put(conference);
    await recebimentoV2Db.syncOperations.put(conferirOp);

    const enqueued = await deleteConferenceRecord(conference.id);

    expect(enqueued).toBe(true);
    const removeOps = (await recebimentoV2Db.syncOperations.toArray()).filter(
      (op) => op.opType === RECEBIMENTO_V2_OP_TYPES.ITEM_LINHA_REMOVE,
    );
    expect(removeOps[0]?.payload).toMatchObject({ itemId: 'legacy-item-99' });
  });

  it('replaces stale rejected remove ops when deleting again', async () => {
    const conference = makeConference({
      serverItemId: 'item-server-001',
      syncStatus: 'synced',
    });
    const staleRejected: SyncOperationRecord = {
      id: crypto.randomUUID(),
      aggregateId: DEMAND_ID,
      module: 'conference',
      opType: RECEBIMENTO_V2_OP_TYPES.ITEM_LINHA_REMOVE,
      sequence: 1,
      dependsOn: [],
      idempotencyKey: crypto.randomUUID(),
      payload: { conferenceId: conference.id },
      attachmentIds: [],
      status: 'rejected',
      attempts: 1,
      errorMessage: 'itemId é obrigatório',
      createdAt: 1,
      updatedAt: 1,
    };
    await recebimentoV2Db.conferences.put(conference);
    await recebimentoV2Db.syncOperations.put(staleRejected);

    await deleteConferenceRecord(conference.id);

    const removeOps = (await recebimentoV2Db.syncOperations.toArray()).filter(
      (op) => op.opType === RECEBIMENTO_V2_OP_TYPES.ITEM_LINHA_REMOVE,
    );
    expect(removeOps).toHaveLength(1);
    expect(removeOps[0]?.status).toBe('pending');
    expect(removeOps[0]?.payload).toMatchObject({ itemId: 'item-server-001' });
  });
});
