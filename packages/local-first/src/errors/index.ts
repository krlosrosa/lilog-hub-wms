export class SyncError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly retryable = false,
  ) {
    super(message);
    this.name = 'SyncError';
  }
}

export class TransientSyncError extends SyncError {
  constructor(message: string, code = 'TRANSIENT') {
    super(message, code, true);
    this.name = 'TransientSyncError';
  }
}

export class PermanentSyncError extends SyncError {
  constructor(message: string, code = 'PERMANENT') {
    super(message, code, false);
    this.name = 'PermanentSyncError';
  }
}

export class ConflictSyncError extends SyncError {
  constructor(
    message: string,
    readonly serverState: unknown,
    code = 'CONFLICT',
  ) {
    super(message, code, false);
    this.name = 'ConflictSyncError';
  }
}

export class DependencySyncError extends SyncError {
  constructor(message: string, code = 'DEPENDENCY') {
    super(message, code, false);
    this.name = 'DependencySyncError';
  }
}

export class CancelledSyncError extends SyncError {
  constructor(message = 'Operation cancelled', code = 'CANCELLED') {
    super(message, code, false);
    this.name = 'CancelledSyncError';
  }
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof SyncError) return error.retryable;
  return false;
}

export function classifyError(error: unknown): SyncError {
  if (error instanceof SyncError) return error;
  if (error instanceof Error) {
    return new TransientSyncError(error.message);
  }
  return new TransientSyncError(String(error));
}
