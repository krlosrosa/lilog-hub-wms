import type {
  CompactionRule,
  OperationMetadata,
  OperationStatus,
} from '../types/index.js';

export interface Operation {
  id: string;
  aggregateId: string;
  aggregateType: string;
  operationType: string;
  payload: unknown;
  handler: string;
  status: OperationStatus;
  metadata: OperationMetadata;
  sequence: number;
  dependsOn: string[];
  transactionGroupId?: string;
  idempotencyKey: string;
  priority: number;
  compactionRule: CompactionRule;
  retryCount: number;
  nextAttemptAt?: number;
  createdAt: number;
  updatedAt: number;
  lastError?: string;
  correlationId?: string;
  schemaVersion: number;
}

export interface CreateOperationInput {
  aggregateId: string;
  aggregateType: string;
  operationType: string;
  payload: unknown;
  handler?: string;
  metadata?: OperationMetadata;
  sequence?: number;
  dependsOn?: string[];
  transactionGroupId?: string;
  idempotencyKey?: string;
  priority?: number;
  compactionRule?: CompactionRule;
  correlationId?: string;
  schemaVersion?: number;
}

export function createOperation(
  input: CreateOperationInput,
  id: string,
  now: number,
): Operation {
  return {
    id,
    aggregateId: input.aggregateId,
    aggregateType: input.aggregateType,
    operationType: input.operationType,
    payload: input.payload,
    handler: input.handler ?? input.operationType,
    status: 'Pending',
    metadata: input.metadata ?? {},
    sequence: input.sequence ?? 0,
    dependsOn: input.dependsOn ?? [],
    transactionGroupId: input.transactionGroupId,
    idempotencyKey:
      input.idempotencyKey ??
      `${input.aggregateId}:${input.operationType}:${input.sequence}`,
    priority: input.priority ?? 0,
    compactionRule: input.compactionRule ?? 'state',
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
    correlationId: input.correlationId,
    schemaVersion: input.schemaVersion ?? 1,
  };
}

export function isTerminalStatus(status: OperationStatus): boolean {
  return status === 'Completed' || status === 'Cancelled' || status === 'Failed';
}

export function canTransition(from: OperationStatus, to: OperationStatus): boolean {
  if (from === to) return true;
  switch (from) {
    case 'Pending':
      return ['Running', 'WaitingDependency', 'Cancelled'].includes(to);
    case 'WaitingDependency':
      return ['Pending', 'Cancelled'].includes(to);
    case 'Running':
      return ['Completed', 'Retrying', 'Failed', 'WaitingDependency', 'Cancelled'].includes(to);
    case 'Retrying':
      return ['Pending', 'Failed', 'Cancelled'].includes(to);
    case 'Failed':
      return ['Pending', 'Cancelled'].includes(to);
    default:
      return false;
  }
}

export function transitionOperation(
  operation: Operation,
  to: OperationStatus,
  now: number,
  patch: Partial<Operation> = {},
): Operation {
  if (!canTransition(operation.status, to)) {
    throw new Error(`Invalid transition ${operation.status} -> ${to}`);
  }
  return {
    ...operation,
    ...patch,
    status: to,
    updatedAt: now,
  };
}
