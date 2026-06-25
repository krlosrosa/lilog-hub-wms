import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { CheckCircle, Loader2 } from 'lucide-react';

import { hapticMedium } from '@/lib/haptics';

interface RecuperacaoConfirmarFinalizacaoSheetProps {
  open: boolean;
  sku: string;
  nome: string;
  qtyAvariada: number;
  qtyRecuperada: number;
  observacao?: string;
  fotosCount: number;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: () => void;
}

export function RecuperacaoConfirmarFinalizacaoSheet({
  open,
  sku,
  nome,
  qtyAvariada,
  qtyRecuperada,
  observacao,
  fotosCount,
  isSubmitting,
  onOpenChange,
  onConfirmar,
}: RecuperacaoConfirmarFinalizacaoSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-outline-variant bg-surface px-margin-mobile pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-2"
      >
        <div
          className="mx-auto mb-3 h-1 w-10 rounded-lg bg-outline-variant"
          aria-hidden
        />

        <SheetHeader className="text-left">
          <SheetTitle className="text-headline-md text-on-surface">
            Confirmar finalização
          </SheetTitle>
          <SheetDescription className="text-body-sm text-on-surface-variant">
            Revise os dados antes de concluir a recuperação.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-3 space-y-3">
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
            <p className="font-mono text-label-md font-bold text-secondary">
              {sku}
            </p>
            <p className="line-clamp-2 text-body-sm text-on-surface">{nome}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
              <p className="text-[11px] text-on-surface-variant">Qtd avariada</p>
              <p className="font-mono text-body-md font-bold tabular-nums text-destructive">
                {qtyAvariada} un
              </p>
            </div>
            <div className="rounded-lg border border-secondary/20 bg-secondary/5 px-3 py-2">
              <p className="text-[11px] text-on-surface-variant">Qtd recuperada</p>
              <p className="font-mono text-body-md font-bold tabular-nums text-secondary">
                {qtyRecuperada} un
              </p>
            </div>
          </div>

          {observacao && (
            <div className="rounded-lg border border-outline-variant bg-surface px-3 py-2">
              <p className="text-[11px] text-on-surface-variant">Observações</p>
              <p className="line-clamp-2 text-body-sm text-on-surface">
                {observacao}
              </p>
            </div>
          )}

          <p className="text-label-sm text-on-surface-variant">
            {fotosCount > 0
              ? `${fotosCount} foto${fotosCount > 1 ? 's' : ''} anexada${fotosCount > 1 ? 's' : ''}`
              : 'Nenhuma foto anexada'}
          </p>

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
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-secondary text-label-md font-semibold text-on-secondary touch-manipulation active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Finalizando…
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" aria-hidden />
                  Confirmar
                </>
              )}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
