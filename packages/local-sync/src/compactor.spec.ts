import { describe, it, expect } from 'vitest';
import { compactOperations, type CompactableOperation } from './compactor.js';

function makeOp(
  partial: Partial<CompactableOperation> &
    Pick<CompactableOperation, 'id' | 'opType' | 'entityId'>,
): CompactableOperation {
  return {
    aggregateId: 'agg-1',
    compactionRule: 'state',
    payload: {},
    sequence: 1,
    createdAt: Date.now(),
    ...partial,
  };
}

describe('compactOperations', () => {
  it('CREATE + UPDATE → single CREATE with merged payload', () => {
    const ops: CompactableOperation[] = [
      makeOp({ id: '1', opType: 'item.create', entityId: 'e1', payload: { a: 1 }, sequence: 1 }),
      makeOp({ id: '2', opType: 'item.update', entityId: 'e1', payload: { b: 2 }, sequence: 2 }),
    ];
    const result = compactOperations(ops);
    expect(result).toHaveLength(1);
    expect(result[0]!.opType).toBe('item.create');
    expect(result[0]!.payload).toEqual({ a: 1, b: 2 });
  });

  it('UPDATE + UPDATE → single UPDATE with merged payload', () => {
    const ops: CompactableOperation[] = [
      makeOp({ id: '1', opType: 'item.update', entityId: 'e1', payload: { a: 1 }, sequence: 1 }),
      makeOp({ id: '2', opType: 'item.update', entityId: 'e1', payload: { a: 99, c: 3 }, sequence: 2 }),
    ];
    const result = compactOperations(ops);
    expect(result).toHaveLength(1);
    expect(result[0]!.opType).toBe('item.update');
    expect(result[0]!.payload).toEqual({ a: 99, c: 3 });
  });

  it('CREATE + DELETE → empty (never existed on server)', () => {
    const ops: CompactableOperation[] = [
      makeOp({ id: '1', opType: 'item.create', entityId: 'e1', sequence: 1 }),
      makeOp({ id: '2', opType: 'item.delete', entityId: 'e1', sequence: 2 }),
    ];
    const result = compactOperations(ops);
    expect(result).toHaveLength(0);
  });

  it('UPDATE + DELETE → single DELETE', () => {
    const ops: CompactableOperation[] = [
      makeOp({ id: '1', opType: 'item.update', entityId: 'e1', sequence: 1 }),
      makeOp({ id: '2', opType: 'item.delete', entityId: 'e1', sequence: 2 }),
    ];
    const result = compactOperations(ops);
    expect(result).toHaveLength(1);
    expect(result[0]!.opType).toBe('item.delete');
  });

  it('Events are never compacted', () => {
    const ops: CompactableOperation[] = [
      makeOp({
        id: '1',
        opType: 'item.update',
        entityId: 'e1',
        compactionRule: 'event',
        sequence: 1,
      }),
      makeOp({
        id: '2',
        opType: 'item.update',
        entityId: 'e1',
        compactionRule: 'event',
        sequence: 2,
      }),
    ];
    const result = compactOperations(ops);
    expect(result).toHaveLength(2);
  });

  it('Different entities are compacted independently', () => {
    const ops: CompactableOperation[] = [
      makeOp({ id: '1', opType: 'item.create', entityId: 'e1', sequence: 1 }),
      makeOp({ id: '2', opType: 'item.create', entityId: 'e2', sequence: 2 }),
      makeOp({ id: '3', opType: 'item.delete', entityId: 'e1', sequence: 3 }),
    ];
    const result = compactOperations(ops);
    // e1 create+delete = 0, e2 create stays
    expect(result).toHaveLength(1);
    expect(result[0]!.entityId).toBe('e2');
  });
});
