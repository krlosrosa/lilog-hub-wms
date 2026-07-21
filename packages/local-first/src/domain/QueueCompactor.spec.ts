import { describe, expect, it } from 'vitest';
import { compactOperations } from '../domain/QueueCompactor.js';
import { createOperation } from '../operations/Operation.js';

function op(
  id: string,
  operationType: string,
  sequence: number,
  entityId = 'entity-1',
) {
  return createOperation(
    {
      aggregateId: 'agg-1',
      aggregateType: 'Test',
      operationType,
      payload: { value: sequence },
      sequence,
      metadata: { entityId },
    },
    id,
    sequence,
  );
}

describe('QueueCompactor', () => {
  it('removes create + delete pairs', () => {
    const result = compactOperations([op('1', 'createItem', 1), op('2', 'deleteItem', 2)]);
    expect(result.operations).toHaveLength(0);
    expect(result.removedIds).toEqual(['1', '2']);
  });

  it('merges create + update into create', () => {
    const result = compactOperations([op('1', 'createItem', 1), op('2', 'updateItem', 2)]);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]?.operationType).toBe('createItem');
    expect(result.operations[0]?.payload).toEqual({ value: 2 });
  });

  it('keeps only last update', () => {
    const result = compactOperations([
      op('1', 'updateItem', 1),
      op('2', 'updateItem', 2),
      op('3', 'updateItem', 3),
    ]);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]?.id).toBe('1');
    expect(result.operations[0]?.payload).toEqual({ value: 3 });
  });

  it('collapses update + delete to delete', () => {
    const result = compactOperations([op('1', 'updateItem', 1), op('2', 'deleteItem', 2)]);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]?.operationType).toBe('deleteItem');
  });
});
