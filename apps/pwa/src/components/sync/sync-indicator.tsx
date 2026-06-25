import { cn } from '@lilog/ui';
import { AlertTriangle, Loader2, Wifi, WifiOff } from 'lucide-react';
import { useState } from 'react';

import { hapticLight } from '@/lib/haptics';
import { useNetworkStatus } from '@/lib/offline/hooks/use-network';
import { useSyncStatus } from '@/lib/offline/hooks/use-sync-status';

import { SyncStatusPanel } from './sync-status-panel';

export function SyncIndicator() {
  const [panelOpen, setPanelOpen] = useState(false);
  const { isOnline } = useNetworkStatus();
  const { pendingCount, errorCount, isSyncing, hasIssues } = useSyncStatus();

  const badgeCount = pendingCount + errorCount;
  const showBadge = badgeCount > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          hapticLight();
          setPanelOpen(true);
        }}
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-full',
          'bg-surface-container text-on-surface-variant',
          'touch-manipulation transition-transform active:scale-90',
          isSyncing && 'ring-2 ring-secondary/30',
        )}
        aria-label="Status de sincronização"
      >
        {isSyncing ? (
          <Loader2 className="h-5 w-5 animate-spin text-secondary" />
        ) : isOnline ? (
          <Wifi
            className={cn(
              'h-5 w-5',
              hasIssues ? 'text-destructive' : 'text-secondary'
            )}
          />
        ) : (
          <WifiOff className="h-5 w-5 text-warning" />
        )}

        {showBadge && (
          <span
            className={cn(
              'absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-on-secondary',
              hasIssues ? 'bg-destructive animate-pulse' : 'bg-secondary'
            )}
          >
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}

        {hasIssues && !showBadge && (
          <AlertTriangle className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 text-destructive" />
        )}
      </button>

      <SyncStatusPanel open={panelOpen} onOpenChange={setPanelOpen} />
    </>
  );
}
