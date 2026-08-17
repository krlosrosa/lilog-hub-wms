export type OperationStatus =
  | 'Pending'
  | 'Running'
  | 'WaitingDependency'
  | 'Retrying'
  | 'Failed'
  | 'Cancelled'
  | 'Completed';

export const TERMINAL_OPERATION_STATUSES: ReadonlySet<OperationStatus> = new Set([
  'Completed',
  'Cancelled',
  'Failed',
]);

export type CompactionRule = 'state' | 'event';

export type OperationKind = 'create' | 'update' | 'delete' | 'upload' | 'event';

export interface OperationMetadata {
  origin?: string;
  deviceId?: string;
  userId?: string;
  entityId?: string;
  tags?: Record<string, string>;
  [key: string]: unknown;
}

export interface SyncCheckpoint {
  cursor: string;
  version: number;
  serverTimestamp: number;
}

export interface SnapshotRecord {
  scope: string;
  aggregateId?: string;
  aggregateType?: string;
  state: unknown;
  version: number;
  checkpoint: SyncCheckpoint;
  createdAt: number;
}

export interface SyncSessionRecord {
  sessionId: string;
  startedAt: number;
  finishedAt?: number;
  status: 'running' | 'completed' | 'aborted';
  operationsProcessed: number;
  operationsSucceeded: number;
  operationsFailed: number;
  retries: number;
  durationMs?: number;
  bytesSent: number;
  bytesReceived: number;
  batches: number;
  conflicts: number;
}

export interface RequestDescriptor {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface HttpResponse {
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface BatchDescriptor {
  batchId: string;
  aggregateId: string;
  operationIds: string[];
  operations: import('../operations/Operation.js').Operation[];
  estimatedBytes: number;
}

export interface PullChangesResult {
  checkpoint: SyncCheckpoint;
  snapshot?: SnapshotRecord;
  operations?: unknown[];
  bytesReceived: number;
}

export interface PushBatchResult {
  batchId: string;
  succeeded: string[];
  failed: Array<{ operationId: string; error: string }>;
  conflicts: Array<{ operationId: string; serverState: unknown }>;
  bytesSent: number;
}

export interface ConflictDecision {
  action: 'acceptServer' | 'keepClient' | 'merge' | 'fail';
  mergedPayload?: unknown;
}

export interface SyncContext {
  sessionId: string;
  correlationId: string;
  aggregateId?: string;
  aggregateType?: string;
}

export interface SyncRunContext extends SyncContext {
  now: number;
}

export type MetricTags = Record<string, string | number | boolean>;

export interface OperationQuery {
  status?: OperationStatus | OperationStatus[];
  aggregateId?: string;
  aggregateType?: string;
  readyBefore?: number;
  limit?: number;
  offset?: number;
}

export interface SessionQuery {
  status?: SyncSessionRecord['status'];
  limit?: number;
  offset?: number;
}

export interface UploadDescriptor {
  uploadId: string;
  operationId: string;
  signedUrl: string;
  confirmUrl: string;
  contentType: string;
  bytes: Uint8Array | ArrayBuffer;
}

export interface UploadConfirmResult {
  uploadId: string;
  confirmed: boolean;
  entityId?: string;
}
