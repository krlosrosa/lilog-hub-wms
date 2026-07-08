import { cn } from '@lilog/ui';
import { Camera, Loader2 } from 'lucide-react';

import { hapticLight } from '@/lib/haptics';

import { useAvariaEvidenciaRapida } from '../hooks/use-avaria-evidencia-rapida';

interface AvariaQuickCaptureButtonProps {
  demandId: string;
  sku?: string;
  className?: string;
}

export function AvariaQuickCaptureButton({
  demandId,
  sku,
  className,
}: AvariaQuickCaptureButtonProps) {
  const { photos, capture, hiddenInput, captureError, isProcessing } =
    useAvariaEvidenciaRapida(demandId, sku);

  const pendingCount = photos.length;

  return (
    <>
      {hiddenInput}
      <button
        type="button"
        aria-label={
          pendingCount > 0
            ? `Capturar evidência de avaria (${pendingCount} foto${pendingCount === 1 ? '' : 's'} pendente${pendingCount === 1 ? '' : 's'})`
            : 'Capturar evidência de avaria'
        }
        title={captureError ?? 'Fotografar avaria antes de registrar'}
        onClick={() => {
          hapticLight();
          capture();
        }}
        disabled={isProcessing}
        className={cn(
          'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant transition-colors touch-manipulation active:scale-95 hover:border-warning hover:bg-warning-container/20 hover:text-warning',
          pendingCount > 0 && 'border-warning bg-warning-container/20 text-warning',
          isProcessing && 'opacity-70',
          className,
        )}
      >
        {isProcessing ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <Camera className="h-5 w-5" aria-hidden />
        )}
        {pendingCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold text-on-warning-container">
            {pendingCount}
          </span>
        ) : null}
      </button>
    </>
  );
}
