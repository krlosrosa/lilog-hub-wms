import { cn } from '@lilog/ui';
import { useNavigate } from '@tanstack/react-router';
import { RefreshCw } from 'lucide-react';

import { hapticLight } from '@/lib/haptics';

import { useForcePullV2 } from '../hooks/use-force-pull-v2';
import { useReabrirV2 } from '../hooks/use-reabrir-v2';
import { useSyncStatusV2 } from '../hooks/use-sync-status-v2';
import { hasVisibleSyncIssues } from '../lib/sync-status-issues';

interface SyncStatusV2ModalButtonProps {
  demandId: string;
}

export function SyncStatusV2ModalButton({ demandId }: SyncStatusV2ModalButtonProps) {
  const navigate = useNavigate();
  const syncStatus = useSyncStatusV2(demandId);
  const { isPulling } = useForcePullV2(demandId);
  const { isReabrindo } = useReabrirV2(demandId, syncStatus);

  const {
    pendingCount,
    pendingPhotoCount,
    conflictCount,
    rejectedCount,
    retryCount,
    blockedCount,
    photoErrorCount,
    isSyncing,
    isAutoSyncPaused,
  } = syncStatus;

  const pendingTotal = pendingCount + pendingPhotoCount;
  const hasIssues = hasVisibleSyncIssues({
    pendingCount,
    pendingPhotoCount,
    conflictCount,
    rejectedCount,
    retryCount,
    blockedCount,
    photoErrorCount,
    isAutoSyncPaused,
  });
  const busy = isSyncing || isPulling || isReabrindo;
  const badgeCount = pendingTotal > 0 ? pendingTotal : hasIssues ? '!' : null;

  function openSyncPage() {
    hapticLight();
    void navigate({
      to: '/recebimento-v2/$id/sync',
      params: { id: demandId },
    });
  }

  return (
    <button
      type="button"
      onClick={openSyncPage}
      className={cn(
        'relative flex h-9 w-9 items-center justify-center rounded-full touch-manipulation transition-transform active:scale-90',
        hasIssues
          ? 'bg-destructive/15 text-destructive'
          : pendingTotal > 0
            ? 'bg-secondary/15 text-secondary'
            : 'bg-surface-container text-on-surface-variant',
      )}
      aria-label="Cache e sincronização"
    >
      <RefreshCw
        className={cn('h-4.5 w-4.5', busy && 'animate-spin')}
        aria-hidden
      />
      {badgeCount != null && !busy && (
        <span
          className={cn(
            'absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold leading-none',
            hasIssues && pendingTotal === 0
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-secondary text-on-secondary',
          )}
        >
          {badgeCount}
        </span>
      )}
    </button>
  );
}
