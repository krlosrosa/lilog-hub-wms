import { describe, expect, it } from 'vitest';
import { BatchOptimizer } from '../core/BatchOptimizer.js';
import { JsonSerializer } from '../ports/Serializer.js';
import { createOperation } from '../operations/Operation.js';

function makeOp(id: string, aggregateId: string, sequence: number, group?: string) {
  return createOperation(
    {
      aggregateId,
      aggregateType: 'Test',
      operationType: 'updateItem',
      payload: { id },
      sequence,
      transactionGroupId: group,
    },
    id,
    sequence,
  );
}

describe('BatchOptimizer', () => {
  it('respects batch size and aggregate boundaries', () => {
    const optimizer = new BatchOptimizer(
      { batchSize: 2, maxBatchBytes: 1024 * 1024 },
      new JsonSerializer(),
    );

    const batches = optimizer.buildBatches([
      makeOp('1', 'agg-1', 1),
      makeOp('2', 'agg-1', 2),
      makeOp('3', 'agg-1', 3),
      makeOp('4', 'agg-2', 1),
    ]);

    expect(batches.length).toBeGreaterThanOrEqual(2);
    expect(batches.every((batch) => batch.operations.length <= 2)).toBe(true);
    expect(new Set(batches.map((batch) => batch.batchId)).size).toBe(batches.length);
  });

  it('keeps transaction groups together when possible', () => {
    const optimizer = new BatchOptimizer(
      { batchSize: 10, maxBatchBytes: 1024 * 1024 },
      new JsonSerializer(),
    );
    const batches = optimizer.buildBatches([
      makeOp('1', 'agg-1', 1, 'group-1'),
      makeOp('2', 'agg-1', 2, 'group-1'),
      makeOp('3', 'agg-1', 3, 'group-1'),
    ]);
    expect(batches).toHaveLength(1);
    expect(batches[0]?.operations).toHaveLength(3);
  });
});
