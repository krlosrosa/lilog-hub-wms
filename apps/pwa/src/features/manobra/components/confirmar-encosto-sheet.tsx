import {
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { CheckCircle2, MapPin, Truck } from 'lucide-react';

import { hapticMedium } from '@/lib/haptics';

import type { Veiculo } from '../types/manobra.schema';

interface ConfirmarEncostoSheetProps {
  open: boolean;
  veiculo: Veiculo | null;
  onOpenChange: (open: boolean) => void;
  onConfirmar: () => void;
}

export function ConfirmarEncostoSheet({
  open,
  veiculo,
  onOpenChange,
  onConfirmar,
}: ConfirmarEncostoSheetProps) {
  if (!veiculo) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] rounded-t-2xl border-outline-variant bg-surface px-margin-mobile pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-2"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-lg bg-outline-variant" aria-hidden />

        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-headline-md text-on-surface">
            <Truck className="h-5 w-5 text-secondary" aria-hidden />
            Confirmar encosto
          </SheetTitle>
          <SheetDescription className="text-body-sm text-on-surface-variant">
            Verifique placa e doca antes de confirmar
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-outline-variant bg-surface-container p-5 text-center">
            <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">Placa</p>
            <p className="mt-1 font-mono text-headline-xl font-bold tracking-wider text-on-surface">
              {veiculo.placa}
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-secondary/40 bg-secondary/10 p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-on-secondary">
              <MapPin className="h-7 w-7" aria-hidden />
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">Encostar na</p>
              <p className="text-headline-lg font-bold text-secondary">{veiculo.doca}</p>
              <p className="mt-0.5 text-body-sm text-on-surface-variant">
                {veiculo.transportadora} · {veiculo.motorista}
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-14 flex-1 items-center justify-center rounded-lg border border-outline-variant bg-surface-container text-label-md font-semibold text-on-surface-variant touch-manipulation active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                hapticMedium();
                onConfirmar();
              }}
              className={cn(
                'flex h-16 flex-[1.4] items-center justify-center gap-2 rounded-lg bg-emerald-600 text-label-lg font-bold text-white touch-manipulation active:scale-[0.98]',
              )}
            >
              <CheckCircle2 className="h-5 w-5" aria-hidden />
              ENCOSTEI
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
