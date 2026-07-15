import {
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { hapticLight } from '@/lib/haptics';

import { useForcePullV2 } from '../hooks/use-force-pull-v2';
import { useSyncStatusV2 } from '../hooks/use-sync-status-v2';
import { showSyncResultToast } from '../lib/sync-result-toast';
import { syncNowV2 } from '../services/auto-sync-v2.service';
import { SyncStatusV2 } from './sync-status-v2';

interface SyncStatusV2ModalButtonProps {
  demandId: string;
}

export function SyncStatusV2ModalButton({ demandId }: SyncStatusV2ModalButtonProps) {
  const [open, setOpen] = useState(false);
  const syncStatus = useSyncStatusV2(demandId);
  const { forcePull, isPulling, pullDisabled } = useForcePullV2(demandId);

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
  const hasIssues =
    isAutoSyncPaused ||
    conflictCount > 0 ||
    rejectedCount > 0 ||
    retryCount > 0 ||
    blockedCount > 0 ||
    photoErrorCount > 0;
  const busy = isSyncing || isPulling;
  const badgeCount = pendingTotal > 0 ? pendingTotal : hasIssues ? '!' : null;

  function openSheet() {
    hapticLight();
    setOpen(true);
  }

  async function handleSync() {
    const hadPhotos = syncStatus.pendingPhotoCount > 0;
    syncStatus.setIsSyncing(true);
    try {
      const result = await syncNowV2(demandId, { manual: true });
      if (!result) {
        toast.info('Nada para sincronizar');
        return;
      }
      showSyncResultToast(result, { hadPhotos });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao sincronizar');
    } finally {
      syncStatus.setIsSyncing(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-full touch-manipulation transition-transform active:scale-90',
          hasIssues
            ? 'bg-destructive/15 text-destructive'
            : pendingTotal > 0
              ? 'bg-secondary/15 text-secondary'
              : 'bg-surface-container text-on-surface-variant',
        )}
        aria-label="Sincronização"
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

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] rounded-t-2xl border-outline-variant bg-surface px-margin-mobile pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-2"
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-lg bg-outline-variant" aria-hidden />

          <SheetHeader className="text-left">
            <SheetTitle className="text-headline-md text-on-surface">Sincronização</SheetTitle>
            <SheetDescription className="text-body-sm text-on-surface-variant">
              Envie alterações locais ou atualize dados do servidor.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4">
            <SyncStatusV2
              syncStatus={syncStatus}
              onSync={() => void handleSync()}
              onPull={() => void forcePull()}
              isPulling={isPulling}
              pullDisabled={pullDisabled}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
