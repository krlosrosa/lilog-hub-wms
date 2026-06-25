import {
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { Layers, Loader2, MapPin, Package } from 'lucide-react';

import { hapticMedium } from '@/lib/haptics';

import type { RessuprimentoSolicitacaoDraft } from '../types/consulta-produto.schema';

interface SolicitarRessuprimentoSheetProps {
  open: boolean;
  draft: RessuprimentoSolicitacaoDraft | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: () => void;
}

export function SolicitarRessuprimentoSheet({
  open,
  draft,
  isSubmitting,
  onOpenChange,
  onConfirmar,
}: SolicitarRessuprimentoSheetProps) {
  if (!draft) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] rounded-t-2xl border-outline-variant bg-surface px-margin-mobile pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-2"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-lg bg-outline-variant" aria-hidden />

        <SheetHeader className="text-left">
          <SheetTitle className="text-headline-md text-on-surface">
            Confirmar ressuprimento
          </SheetTitle>
          <SheetDescription className="text-body-sm text-on-surface-variant">
            Picking · {draft.endereco}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <Package className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-semibold text-on-surface">
                  {draft.produtoNome}
                </p>
                <p className="font-mono text-label-sm text-secondary">{draft.sku}</p>
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-on-surface-variant">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                  Saldo atual no picking:{' '}
                  <span className="font-mono font-bold tabular-nums text-on-surface">
                    {draft.quantidadeAtual} {draft.unidade}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-lg border border-secondary/25 bg-secondary/5 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              <Layers className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-label-sm font-semibold text-on-surface">Palete completo</p>
              <p className="text-[11px] leading-snug text-on-surface-variant">
                O ressuprimento traz o palete inteiro do aéreo para este endereço de picking. Não é
                necessário informar quantidade.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="flex h-11 flex-1 items-center justify-center rounded-lg border border-outline-variant bg-surface-container text-label-md font-semibold text-on-surface-variant touch-manipulation active:scale-[0.98] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                hapticMedium();
                onConfirmar();
              }}
              className={cn(
                'flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-secondary text-label-md font-semibold text-on-secondary touch-manipulation active:scale-[0.98] disabled:opacity-60',
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Enviando…
                </>
              ) : (
                'Confirmar'
              )}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
