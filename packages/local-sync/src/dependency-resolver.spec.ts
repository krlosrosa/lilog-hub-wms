import { describe, it, expect } from 'vitest';
import { getExecutableOperations, topologicalSort } from './dependency-resolver.js';
import type { LocalSyncOperation } from '@lilog/contracts';

function makeOp(
  partial: Partial<LocalSyncOperation> & Pick<LocalSyncOperation, 'id'>,
): LocalSyncOperation {
  return {
    aggregateId: 'agg-1',
    module: 'recebimento',
    opType: 'item.conferir',
    sequence: 1,
    dependsOn: [],
    idempotencyKey: partial.id,
    payload: {},
    attachmentIds: [],
    status: 'pending',
    attempts: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...partial,
  };
}

describe('getExecutableOperations', () => {
  it('Operations with no deps are all executable', () => {
    const ops = [makeOp({ id: 'a' }), makeOp({ id: 'b' })];
    const result = getExecutableOperations(ops, new Set());
    expect(result.map((o) => o.id)).toEqual(['a', 'b']);
  });

  it('Op with pending dep is blocked', () => {
    const ops = [
      makeOp({ id: 'a', status: 'pending' }),
      makeOp({ id: 'b', dependsOn: ['a'] }),
    ];
    const result = getExecutableOperations(ops, new Set());
    expect(result.map((o) => o.id)).toEqual(['a']);
  });

  it('Op with synced dep (not in pending list) is executable', () => {
    const ops = [
      // 'a' is not in the list (already synced)
      makeOp({ id: 'b', dependsOn: ['a'] }),
    ];
    const result = getExecutableOperations(ops, new Set());
    expect(result.map((o) => o.id)).toEqual(['b']);
  });

  it('Op with conflict dep is blocked', () => {
    const ops = [
      makeOp({ id: 'a', status: 'conflict' }),
      makeOp({ id: 'b', dependsOn: ['a'] }),
    ];
    const result = getExecutableOperations(ops, new Set());
    // 'a' is conflict so blocked, 'b' depends on 'a' so also blocked
    expect(result).toHaveLength(0);
  });

  it('In-flight ops are excluded', () => {
    const ops = [makeOp({ id: 'a' }), makeOp({ id: 'b' })];
    const result = getExecutableOperations(ops, new Set(['a']));
    expect(result.map((o) => o.id)).toEqual(['b']);
  });
});

describe('topologicalSort', () => {
  it('Respects sequence within same aggregate', () => {
    const ops = [
      makeOp({ id: 'c', sequence: 3 }),
      makeOp({ id: 'a', sequence: 1 }),
      makeOp({ id: 'b', sequence: 2 }),
    ];
    const sorted = topologicalSort(ops);
    expect(sorted.map((o) => o.id)).toEqual(['a', 'b', 'c']);
  });

  it('Dependency comes before dependent', () => {
    const ops = [
      makeOp({ id: 'b', sequence: 2, dependsOn: ['a'] }),
      makeOp({ id: 'a', sequence: 1 }),
    ];
    const sorted = topologicalSort(ops);
    const aIdx = sorted.findIndex((o) => o.id === 'a');
    const bIdx = sorted.findIndex((o) => o.id === 'b');
    expect(aIdx).toBeLessThan(bIdx);
  });
});
