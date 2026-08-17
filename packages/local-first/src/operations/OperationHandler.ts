import type { ConflictDecision, RequestDescriptor, SyncContext } from '../types/index.js';
import type { Operation } from './Operation.js';

export interface OperationHandlerContext extends SyncContext {
  now: number;
}

export interface OperationHandler {
  buildRequest(operation: Operation, ctx: OperationHandlerContext): RequestDescriptor | Promise<RequestDescriptor>;
  applyResult(operation: Operation, response: unknown, ctx: OperationHandlerContext): Promise<void>;
  onConflict(operation: Operation, serverState: unknown, ctx: OperationHandlerContext): ConflictDecision | Promise<ConflictDecision>;
}

export interface UploadOperationHandler extends OperationHandler {
  requestSignedUrl?(operation: Operation, ctx: OperationHandlerContext): Promise<{ signedUrl: string; confirmUrl: string; uploadId: string }>;
  confirmUpload?(operation: Operation, uploadId: string, ctx: OperationHandlerContext): Promise<void>;
}
