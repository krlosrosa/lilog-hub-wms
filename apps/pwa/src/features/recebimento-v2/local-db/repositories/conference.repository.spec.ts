import { beforeEach, describe, expect, it } from 'vitest';

import { RecebimentoV2DB } from '../db';
import type { ConferenceRecord, ProcessRecord } from '../schema';
import { ConferenceRepository } from './conference.repository';

function makeProcess(overrides: Partial<ProcessRecord> = {}): ProcessRecord {
  const now = Date.now();
  return {
    id: 'demand-001',
    unidadeId: 'unit-001',
    adapter: 'recebimento-v2',
    status: 'ready',
    serverRevision: 1,
    baseRevision: 1,
    flowVersion: 'v2',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeConference(overrides: Partial<ConferenceRecord> = {}): ConferenceRecord {
  return {
    id: crypto.randomUUID(),
    demandId: 'demand-001',
    sku: 'SKU-001',
    quantity: 2,
    conferidoAt: new Date().toISOString(),
    syncStatus: 'pending',
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('ConferenceRepository', () => {
  let db: RecebimentoV2DB;
  let repo: ConferenceRepository;

  beforeEach(async () => {
    db = new RecebimentoV2DB();
    repo = new ConferenceRepository(db);
    // Clear tables to keep tests isolated
    await db.conferences.clear();
    await db.processes.clear();
    await db.processes.put(makeProcess());
  });

  describe('getConferences', () => {
    it('returns empty array when no conferences exist', async () => {
      const result = await repo.getConferences('demand-001');
      expect(result).toHaveLength(0);
    });

    it('returns non-deleted conferences for a demand', async () => {
      const c1 = makeConference({ id: 'conf-1' });
      const c2 = makeConference({ id: 'conf-2' });
      const deleted = makeConference({ id: 'conf-3', deletedAt: new Date().toISOString() });

      await db.conferences.bulkPut([c1, c2, deleted]);

      const result = await repo.getConferences('demand-001');

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toEqual(expect.arrayContaining(['conf-1', 'conf-2']));
    });

    it('does not return conferences from other demands', async () => {
      await db.conferences.put(makeConference({ demandId: 'other-demand' }));
      await db.conferences.put(makeConference({ demandId: 'demand-001' }));

      const result = await repo.getConferences('demand-001');
      expect(result).toHaveLength(1);
      expect(result[0]?.demandId).toBe('demand-001');
    });
  });

  describe('upsertConference', () => {
    it('inserts a new conference', async () => {
      const conf = makeConference();
      await repo.upsertConference(conf);

      const stored = await db.conferences.get(conf.id);
      expect(stored).toMatchObject({ id: conf.id, sku: 'SKU-001', quantity: 2 });
    });

    it('updates an existing conference (idempotent)', async () => {
      const conf = makeConference({ quantity: 5 });
      await repo.upsertConference(conf);
      await repo.upsertConference({ ...conf, quantity: 10 });

      const stored = await db.conferences.get(conf.id);
      expect(stored?.quantity).toBe(10);
    });
  });

  describe('softDeleteConferencesBySku', () => {
    it('soft-deletes conferences for a given SKU', async () => {
      const c1 = makeConference({ id: 'c1', sku: 'SKU-A' });
      const c2 = makeConference({ id: 'c2', sku: 'SKU-A' });
      const c3 = makeConference({ id: 'c3', sku: 'SKU-B' });
      await db.conferences.bulkPut([c1, c2, c3]);

      await repo.softDeleteConferencesBySku('demand-001', 'SKU-A');

      const deleted = await db.conferences.where('demandId').equals('demand-001').toArray();
      const skuADeleted = deleted.filter((r) => r.sku === 'SKU-A');
      const skuBDeleted = deleted.filter((r) => r.sku === 'SKU-B');

      expect(skuADeleted.every((r) => r.deletedAt != null)).toBe(true);
      expect(skuADeleted.every((r) => r.syncStatus === 'pending')).toBe(true);
      expect(skuBDeleted.every((r) => !r.deletedAt)).toBe(true);
    });
  });

  describe('getDirty', () => {
    it('returns only unsynchronized conferences', async () => {
      const pending = makeConference({ id: 'dirty', syncStatus: 'pending' });
      const synced = makeConference({ id: 'clean', syncStatus: 'synced' });
      await db.conferences.bulkPut([pending, synced]);

      const dirty = await repo.getDirty('demand-001');
      expect(dirty).toHaveLength(1);
      expect(dirty[0]?.id).toBe('dirty');
    });
  });

  describe('markAllSynced', () => {
    it('marks all conferences as synced', async () => {
      const c1 = makeConference({ id: 'c1', syncStatus: 'pending' });
      const c2 = makeConference({ id: 'c2', syncStatus: 'conflict' });
      await db.conferences.bulkPut([c1, c2]);

      await repo.markAllSynced('demand-001');

      const all = await db.conferences.where('demandId').equals('demand-001').toArray();
      expect(all.every((r) => r.syncStatus === 'synced')).toBe(true);
    });
  });
});
