import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { RecebimentoV2DB } from '../db';
import type { SyncOperationRecord } from '../schema';
import { SyncOperationRepository } from './sync-operation.repository';

function makeOp(overrides: Partial<SyncOperationRecord> = {}): Omit<SyncOperationRecord, 'id' | 'attempts' | 'status' | 'createdAt' | 'updatedAt'> {
  return {
    aggregateId: 'demand-001',
    module: 'conference',
    opType: RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR,
    sequence: Date.now(),
    dependsOn: [],
    idempotencyKey: crypto.randomUUID(),
    payload: { quantity: 3 },
    attachmentIds: [],
    ...overrides,
  };
}

describe('SyncOperationRepository', () => {
  let db: RecebimentoV2DB;
  let repo: SyncOperationRepository;

  beforeEach(async () => {
    db = new RecebimentoV2DB();
    repo = new SyncOperationRepository(db);
    await db.syncOperations.clear();
  });

  describe('enqueue', () => {
    it('creates a new operation with default status and attempts', async () => {
      const id = await repo.enqueue(makeOp());

      const stored = await db.syncOperations.get(id);
      expect(stored).toBeDefined();
      expect(stored?.status).toBe('pending');
      expect(stored?.attempts).toBe(0);
      expect(stored?.aggregateId).toBe('demand-001');
    });

    it('assigns a unique UUID to each operation', async () => {
      const id1 = await repo.enqueue(makeOp());
      const id2 = await repo.enqueue(makeOp());

      expect(id1).not.toBe(id2);
    });
  });

  describe('getPendingByAggregate', () => {
    it('returns pending, retry, blocked, and syncing operations', async () => {
      await db.syncOperations.bulkPut([
        { id: 'op-1', aggregateId: 'demand-001', module: 'conference', opType: 'x', sequence: 1, dependsOn: [], idempotencyKey: 'k1', payload: {}, attachmentIds: [], status: 'pending', attempts: 0, createdAt: 1, updatedAt: 1 },
        { id: 'op-2', aggregateId: 'demand-001', module: 'conference', opType: 'x', sequence: 2, dependsOn: [], idempotencyKey: 'k2', payload: {}, attachmentIds: [], status: 'synced', attempts: 1, createdAt: 2, updatedAt: 2 },
        { id: 'op-3', aggregateId: 'demand-001', module: 'conference', opType: 'x', sequence: 3, dependsOn: [], idempotencyKey: 'k3', payload: {}, attachmentIds: [], status: 'retry', attempts: 1, createdAt: 3, updatedAt: 3 },
        { id: 'op-4', aggregateId: 'demand-001', module: 'conference', opType: 'x', sequence: 4, dependsOn: [], idempotencyKey: 'k4', payload: {}, attachmentIds: [], status: 'rejected', attempts: 3, createdAt: 4, updatedAt: 4 },
        { id: 'op-5', aggregateId: 'other-demand', module: 'conference', opType: 'x', sequence: 5, dependsOn: [], idempotencyKey: 'k5', payload: {}, attachmentIds: [], status: 'pending', attempts: 0, createdAt: 5, updatedAt: 5 },
      ]);

      const pending = await repo.getPendingByAggregate('demand-001');

      const ids = pending.map((op) => op.id);
      expect(ids).toContain('op-1');
      expect(ids).toContain('op-3');
      expect(ids).not.toContain('op-2'); // synced
      expect(ids).not.toContain('op-4'); // rejected
      expect(ids).not.toContain('op-5'); // other demand
    });

    it('returns operations sorted by createdAt', async () => {
      await db.syncOperations.bulkPut([
        { id: 'late', aggregateId: 'demand-001', module: 'x', opType: 'x', sequence: 1, dependsOn: [], idempotencyKey: 'k1', payload: {}, attachmentIds: [], status: 'pending', attempts: 0, createdAt: 200, updatedAt: 200 },
        { id: 'early', aggregateId: 'demand-001', module: 'x', opType: 'x', sequence: 1, dependsOn: [], idempotencyKey: 'k2', payload: {}, attachmentIds: [], status: 'pending', attempts: 0, createdAt: 100, updatedAt: 100 },
      ]);

      const pending = await repo.getPendingByAggregate('demand-001');
      expect(pending[0]?.id).toBe('early');
      expect(pending[1]?.id).toBe('late');
    });
  });

  describe('resetOrphaned', () => {
    it('resets syncing operations back to pending', async () => {
      await db.syncOperations.bulkPut([
        { id: 'syncing-1', aggregateId: 'demand-001', module: 'x', opType: 'x', sequence: 1, dependsOn: [], idempotencyKey: 'k1', payload: {}, attachmentIds: [], status: 'syncing', attempts: 0, createdAt: 100, updatedAt: 100 },
        { id: 'pending-1', aggregateId: 'demand-001', module: 'x', opType: 'x', sequence: 2, dependsOn: [], idempotencyKey: 'k2', payload: {}, attachmentIds: [], status: 'pending', attempts: 0, createdAt: 200, updatedAt: 200 },
      ]);

      const count = await repo.resetOrphaned();
      expect(count).toBe(1);

      const syncing = await db.syncOperations.get('syncing-1');
      expect(syncing?.status).toBe('pending');

      const pending = await db.syncOperations.get('pending-1');
      expect(pending?.status).toBe('pending'); // unchanged
    });
  });

  describe('markRetry', () => {
    it('sets status to retry and increments attempts', async () => {
      const id = await repo.enqueue(makeOp());
      await repo.markRetry(id, 'Network error', Date.now() + 5000);

      const stored = await db.syncOperations.get(id);
      expect(stored?.status).toBe('retry');
      expect(stored?.errorMessage).toBe('Network error');
      expect(stored?.attempts).toBeGreaterThan(0);
    });
  });
});
