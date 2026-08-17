import { detectOperationKind, topologicalSort } from '../domain/DependencyResolver.js';
import type { Operation } from '../operations/Operation.js';
import type { Serializer } from '../ports/Serializer.js';
import type { BatchDescriptor } from '../types/index.js';

export interface BatchOptimizerConfig {
  batchSize: number;
  maxBatchBytes: number;
}

type BatchUnit = Operation[];

export class BatchOptimizer {
  constructor(
    private readonly config: BatchOptimizerConfig,
    private readonly serializer: Serializer,
  ) {}

  buildBatches(operations: Operation[]): BatchDescriptor[] {
    const sorted = topologicalSort(operations);
    const units = this.buildUnits(sorted);
    const batches: BatchDescriptor[] = [];
    let current: Operation[] = [];
    let currentBytes = 0;
    let currentAggregate: string | undefined;

    const flush = () => {
      if (current.length === 0) return;
      batches.push(this.toBatch(current, currentBytes));
      current = [];
      currentBytes = 0;
      currentAggregate = undefined;
    };

    for (const unit of units) {
      const unitBytes = unit.reduce(
        (sum, op) => sum + this.estimateOperationBytes(op),
        0,
      );
      const aggregateId = unit[0]?.aggregateId;
      const uploadUnit = unit.some(
        (op) => detectOperationKind(op.operationType) === 'upload',
      );

      if (uploadUnit) {
        flush();
        for (const op of unit) {
          batches.push(this.singleBatch(op));
        }
        continue;
      }

      const sameAggregate =
        currentAggregate === undefined || currentAggregate === aggregateId;
      const exceedsCount = current.length + unit.length > this.config.batchSize;
      const exceedsBytes =
        currentBytes + unitBytes > this.config.maxBatchBytes && current.length > 0;

      if (!sameAggregate || exceedsCount || exceedsBytes) {
        flush();
      }

      if (unit.length > this.config.batchSize) {
        flush();
        batches.push(this.toBatch(unit, unitBytes));
        continue;
      }

      current.push(...unit);
      currentAggregate = aggregateId;
      currentBytes += unitBytes;
    }

    flush();
    return batches;
  }

  private buildUnits(sorted: Operation[]): BatchUnit[] {
    const consumed = new Set<string>();
    const units: BatchUnit[] = [];

    for (const op of sorted) {
      if (consumed.has(op.id)) continue;

      if (op.transactionGroupId) {
        const groupOps = sorted.filter(
          (candidate) => candidate.transactionGroupId === op.transactionGroupId,
        );
        for (const groupOp of groupOps) {
          consumed.add(groupOp.id);
        }
        units.push(groupOps);
        continue;
      }

      consumed.add(op.id);
      units.push([op]);
    }

    return units;
  }

  private estimateOperationBytes(op: Operation): number {
    return this.serializer.measureBytes({
      operationType: op.operationType,
      payload: op.payload,
      idempotencyKey: op.idempotencyKey,
    });
  }

  private toBatch(operations: Operation[], estimatedBytes: number): BatchDescriptor {
    return {
      batchId: this.buildBatchId(operations),
      aggregateId: operations[0]?.aggregateId ?? 'unknown',
      operationIds: operations.map((op) => op.id),
      operations: [...operations],
      estimatedBytes,
    };
  }

  private buildBatchId(operations: Operation[]): string {
    const keys = operations.map((op) => op.idempotencyKey).sort().join('|');
    return `batch:${operations[0]?.aggregateId ?? 'unknown'}:${hashString(keys)}`;
  }

  private singleBatch(op: Operation): BatchDescriptor {
    return {
      batchId: `batch:${op.aggregateId}:${op.idempotencyKey}`,
      aggregateId: op.aggregateId,
      operationIds: [op.id],
      operations: [op],
      estimatedBytes: this.estimateOperationBytes(op),
    };
  }
}

function hashString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
