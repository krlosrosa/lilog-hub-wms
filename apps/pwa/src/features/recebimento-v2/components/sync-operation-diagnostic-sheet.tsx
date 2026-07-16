import {
  Button,
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { useLiveQuery } from 'dexie-react-hooks';
import { Copy, Loader2, Share2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { formatSyncIssueErrorMessage } from '../lib/sync-conferencia-bloqueada';
import {
  buildOperationDiagnostic,
  copyDiagnosticToClipboard,
  serializeDiagnostic,
  shareDiagnostic,
  type SyncOperationDiagnosticPayload,
} from '../lib/sync-diagnostic';
import { RECEBIMENTO_V2_RETRY_POLICY } from '../lib/sync-retry-policy';
import {
  getSyncOpLabel,
  getSyncOperationStatusLabel,
} from '../lib/sync-operation-labels';
import { dismissSyncOperation } from '../services/repair-sync-operations.service';

interface SyncOperationDiagnosticSheetProps {
  operationId: string | null;
  demandId: string;
  onClose: () => void;
}

function formatNextAttempt(nextAttemptAt: number | undefined, attempts: number): string {
  if (attempts >= RECEBIMENTO_V2_RETRY_POLICY.maxAttempts) {
    return 'Esgotada';
  }

  if (!nextAttemptAt) {
    return '—';
  }

  const diff = nextAttemptAt - Date.now();
  if (diff <= 0) {
    return 'Pronta para nova tentativa';
  }

  const seconds = Math.ceil(diff / 1000);
  if (seconds < 60) {
    return `Em ${seconds}s`;
  }

  const minutes = Math.ceil(seconds / 60);
  return `Em ${minutes} min`;
}

export function SyncOperationDiagnosticSheet({
  operationId,
  demandId,
  onClose,
}: SyncOperationDiagnosticSheetProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const diagnostic = useLiveQuery(async (): Promise<SyncOperationDiagnosticPayload | null> => {
    if (!operationId) {
      return null;
    }

    return buildOperationDiagnostic(operationId, demandId);
  }, [operationId, demandId]);

  const operation = diagnostic?.operation ?? null;
  const label = operation ? getSyncOpLabel(operation.opType) : 'Operação';
  const statusLabel = operation ? getSyncOperationStatusLabel(operation.status) : '—';
  const jsonText = useMemo(
    () => (diagnostic ? serializeDiagnostic(diagnostic) : ''),
    [diagnostic],
  );

  async function handleCopy() {
    if (!diagnostic) {
      return;
    }

    setIsCopying(true);
    try {
      await copyDiagnosticToClipboard(diagnostic);
      toast.success('JSON copiado');
    } catch {
      toast.error('Não foi possível copiar o JSON');
    } finally {
      setIsCopying(false);
    }
  }

  async function handleShare() {
    if (!diagnostic) {
      return;
    }

    setIsSharing(true);
    try {
      const shared = await shareDiagnostic(diagnostic, `Diagnóstico sync — ${label}`);
      if (shared) {
        toast.success('Diagnóstico compartilhado');
      } else {
        toast.success('JSON copiado para a área de transferência');
      }
    } catch {
      toast.error('Não foi possível compartilhar o diagnóstico');
    } finally {
      setIsSharing(false);
    }
  }

  async function handleDismiss() {
    if (!operationId) {
      return;
    }

    setIsDismissing(true);
    try {
      await dismissSyncOperation(operationId);
      toast.success('Operação descartada');
      onClose();
    } catch {
      toast.error('Não foi possível descartar a operação');
    } finally {
      setIsDismissing(false);
    }
  }

  const canDismiss =
    operation?.status === 'retry' ||
    operation?.status === 'rejected' ||
    operation?.status === 'blocked' ||
    operation?.status === 'conflict';

  return (
    <Sheet open={operationId != null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl px-4 pb-safe-offset-4">
        <SheetHeader className="text-left">
          <SheetTitle className="text-headline-sm">Diagnóstico da operação</SheetTitle>
          <SheetDescription>
            {operation
              ? `#${operation.sequence} · ${label} · ${statusLabel}`
              : 'Carregando detalhes da operação...'}
          </SheetDescription>
        </SheetHeader>

        {!diagnostic ? (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span className="text-body-sm">Carregando...</span>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {operation ? (
              <div className="rounded-md border border-outline-variant/60 bg-surface-container/40 px-3 py-2.5 text-[11px]">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium text-on-surface">{statusLabel}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tentativas</p>
                    <p className="font-medium text-on-surface">
                      {operation.attempts} / {RECEBIMENTO_V2_RETRY_POLICY.maxAttempts}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Próxima tentativa</p>
                    <p className="font-medium text-on-surface">
                      {formatNextAttempt(operation.nextAttemptAt, operation.attempts)}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {operation?.errorMessage ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-destructive">
                  Último erro
                </p>
                <p className="mt-1 text-body-sm leading-relaxed text-destructive">
                  {formatSyncIssueErrorMessage(operation.errorMessage)}
                </p>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                JSON completo
              </p>
              <pre
                className={cn(
                  'max-h-52 overflow-auto rounded-md border border-outline-variant/60',
                  'bg-surface-lowest p-2.5 text-[10px] font-mono leading-relaxed text-on-surface-variant',
                )}
              >
                {jsonText}
              </pre>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isCopying}
                onClick={() => void handleCopy()}
                className="h-10"
              >
                {isCopying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Copy className="mr-2 h-4 w-4" aria-hidden />
                )}
                Copiar JSON
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSharing}
                onClick={() => void handleShare()}
                className="h-10"
              >
                {isSharing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Share2 className="mr-2 h-4 w-4" aria-hidden />
                )}
                Compartilhar
              </Button>
            </div>

            {canDismiss ? (
              <Button
                type="button"
                variant="outline"
                disabled={isDismissing}
                onClick={() => void handleDismiss()}
                className="h-10 w-full border-destructive/30 text-destructive"
              >
                {isDismissing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                Descartar operação
              </Button>
            ) : null}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
