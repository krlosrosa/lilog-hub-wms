import {
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { CheckCircle2, Loader2, RefreshCw, Zap } from 'lucide-react';

import { hapticMedium } from '@/lib/haptics';

import type { PrioridadeRessuprimentoDraft } from '../types/consulta-produto.schema';

interface SolicitarPrioridadeSheetProps {
  open: boolean;
  draft: PrioridadeRessuprimentoDraft | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: () => void;
}

export function SolicitarPrioridadeSheet({
  open,
  draft,
  isSubmitting,
  onOpenChange,
  onConfirmar,
}: SolicitarPrioridadeSheetProps) {
  if (!draft) return null;

  const jaSolicitada = draft.prioridadeJaSolicitada;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] rounded-t-2xl border-outline-variant bg-surface px-margin-mobile pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-2"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-lg bg-outline-variant" aria-hidden />

        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-headline-md text-on-surface">
            {jaSolicitada ? (
              <CheckCircle2 className="h-5 w-5 text-secondary" aria-hidden />
            ) : (
              <Zap className="h-5 w-5 text-secondary" aria-hidden />
            )}
            {jaSolicitada ? 'Prioridade já solicitada' : 'Solicitar prioridade'}
          </SheetTitle>
          <SheetDescription className="text-body-sm text-on-surface-variant">
            Ordem {draft.ordemId} · {draft.endereco}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          <div
            className={cn(
              'rounded-lg border p-3',
              jaSolicitada
                ? 'border-secondary/40 bg-secondary/10'
                : 'border-outline-variant bg-surface-container-low',
            )}
          >
            <p className="truncate text-body-sm font-semibold text-on-surface">
              {draft.produtoNome}
            </p>
            <p className="font-mono text-label-sm text-secondary">{draft.sku}</p>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-on-surface-variant">
              <RefreshCw
                className={cn('h-3 w-3 shrink-0 text-secondary', !jaSolicitada && 'animate-spin')}
                aria-hidden
              />
              Ressuprimento em andamento ·{' '}
              <span className="font-semibold text-secondary">palete completo</span>
            </div>
          </div>

          <p className="text-body-sm text-on-surface-variant">
            {jaSolicitada
              ? 'Esta ordem já está na fila prioritária. O abastecimento será tratado com urgência no picking.'
              : 'A prioridade move esta ordem para o início da fila de ressuprimento do CD, ideal quando o saldo no picking está crítico.'}
          </p>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="flex h-11 flex-1 items-center justify-center rounded-lg border border-outline-variant bg-surface-container text-label-md font-semibold text-on-surface-variant touch-manipulation active:scale-[0.98] disabled:opacity-50"
            >
              {jaSolicitada ? 'Fechar' : 'Cancelar'}
            </button>
            {!jaSolicitada && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  hapticMedium();
                  onConfirmar();
                }}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-secondary text-label-md font-semibold text-on-secondary touch-manipulation active:scale-[0.98] disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Enviando…
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" aria-hidden />
                    Confirmar
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
