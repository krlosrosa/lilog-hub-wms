import { Button, cn } from '@lilog/ui';
import { AlertTriangle, CheckCircle, RefreshCw, Server, Smartphone } from 'lucide-react';

import type { SyncConflictRecord } from '../local-db/schema';

interface ConflictResolutionPanelProps {
  conflict: SyncConflictRecord;
  onAcceptServer: (conflictId: string) => Promise<void>;
  onKeepLocal: (conflictId: string) => Promise<void>;
  isResolving?: boolean;
}

function JsonPreview({ data }: { data: unknown }) {
  if (!data) {
    return (
      <div className="rounded-md bg-surface-lowest p-2.5 text-[11px] text-muted-foreground italic">
        Nenhum dado disponível
      </div>
    );
  }
  return (
    <pre className="max-h-32 overflow-auto rounded-md bg-surface-lowest p-2.5 text-[11px] font-mono text-on-surface-variant">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export function ConflictResolutionPanel({
  conflict,
  onAcceptServer,
  onKeepLocal,
  isResolving = false,
}: ConflictResolutionPanelProps) {
  return (
    <article className="rounded-lg border border-destructive/30 bg-surface shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-outline-variant/50 p-4">
        <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-body-md font-semibold text-on-surface">
            Conflito de sincronização
          </p>
          <p className="truncate text-label-sm text-muted-foreground">
            Seções: {conflict.sections.join(', ')} · Rev. servidor: {conflict.serverRevision}
          </p>
        </div>
      </div>

      {/* Show server snapshot if available */}
      {conflict.serverSnapshot && (
        <div className="p-4 pb-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-label-sm font-medium text-on-surface-variant">
              <Server className="h-3.5 w-3.5" aria-hidden />
              Estado do servidor
            </div>
            <JsonPreview data={conflict.serverSnapshot} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-outline-variant/50 p-4">
        <Button
          type="button"
          disabled={isResolving}
          onClick={() => void onAcceptServer(conflict.id)}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-label-sm font-medium text-on-surface',
            'touch-manipulation transition-transform active:scale-[0.98]',
          )}
        >
          <Server className="h-3.5 w-3.5" aria-hidden />
          Usar servidor
        </Button>

        <Button
          type="button"
          disabled={isResolving}
          onClick={() => void onKeepLocal(conflict.id)}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 py-2.5 text-label-sm font-semibold text-on-secondary',
            'touch-manipulation transition-transform active:scale-[0.98]',
          )}
        >
          {isResolving ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <CheckCircle className="h-3.5 w-3.5" aria-hidden />
          )}
          Manter local
        </Button>
      </div>
    </article>
  );
}
