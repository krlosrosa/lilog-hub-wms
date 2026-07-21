import type { SyncOperationLifecycleStatus, SyncOperationStatus } from '@lilog/contracts';

import type { SyncOperationRecord } from '../local-db/schema';

export function deriveLifecycleFromStatus(
  status: SyncOperationStatus,
): SyncOperationLifecycleStatus {
  switch (status) {
    case 'pending':
      return 'PENDING';
    case 'blocked':
      return 'WAITING_DEPENDENCY';
    case 'syncing':
      return 'SENDING';
    case 'retry':
      return 'RETRYING';
    case 'synced':
      return 'CONFIRMED';
    case 'conflict':
    case 'rejected':
      return 'FAILED';
    default:
      return 'PENDING';
  }
}

export function resolveLifecycleStatus(
  op: Pick<SyncOperationRecord, 'status' | 'lifecycleStatus'>,
): SyncOperationLifecycleStatus {
  return op.lifecycleStatus ?? deriveLifecycleFromStatus(op.status);
}

export function markLifecycleFromStatus(
  patch: { status: SyncOperationStatus },
): { status: SyncOperationStatus; lifecycleStatus: SyncOperationLifecycleStatus } {
  return {
    status: patch.status,
    lifecycleStatus: deriveLifecycleFromStatus(patch.status),
  };
}
