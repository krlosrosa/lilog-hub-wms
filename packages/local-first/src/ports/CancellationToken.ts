import { CancelledSyncError } from '../errors/index.js';

export interface CancellationToken {
  readonly isCancelled: boolean;
  throwIfCancelled(): void;
  onCancelled(callback: () => void): () => void;
}

export class AbortCancellationToken implements CancellationToken {
  private cancelled = false;
  private listeners = new Set<() => void>();

  get isCancelled(): boolean {
    return this.cancelled;
  }

  cancel(): void {
    if (this.cancelled) return;
    this.cancelled = true;
    for (const listener of this.listeners) {
      listener();
    }
  }

  throwIfCancelled(): void {
    if (this.cancelled) {
      throw new CancelledSyncError();
    }
  }

  onCancelled(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

export class LinkedCancellationToken implements CancellationToken {
  constructor(private readonly parent: CancellationToken) {}

  get isCancelled(): boolean {
    return this.parent.isCancelled;
  }

  throwIfCancelled(): void {
    this.parent.throwIfCancelled();
  }

  onCancelled(callback: () => void): () => void {
    return this.parent.onCancelled(callback);
  }
}

export function neverCancelled(): CancellationToken {
  return new AbortCancellationToken();
}
