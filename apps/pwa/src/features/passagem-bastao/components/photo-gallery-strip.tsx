import { cn } from '@lilog/ui';
import { ImagePlus, Trash2 } from 'lucide-react';

import { hapticLight } from '@/lib/haptics';
import type { CapturedPhoto } from '@/lib/offline/hooks/use-photo-capture';

interface PhotoGalleryStripProps {
  photos: CapturedPhoto[];
  onCapture: () => void;
  onRemove: (photoId: number) => void;
  hiddenInput: React.ReactNode;
  label?: string;
  className?: string;
  compact?: boolean;
}

export function PhotoGalleryStrip({
  photos,
  onCapture,
  onRemove,
  hiddenInput,
  label = 'Fotos',
  className,
  compact = false,
}: PhotoGalleryStripProps) {
  const thumbSize = compact ? 'h-12 w-12' : 'h-[72px] w-[72px]';

  return (
    <div className={cn(compact ? 'mt-1.5' : 'mt-2.5', className)}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p
          className={cn(
            'font-medium text-on-surface-variant',
            compact ? 'text-[10px] uppercase tracking-wide' : 'text-label-sm',
          )}
        >
          {label}
        </p>
        {photos.length > 0 ? (
          <span className="text-[10px] tabular-nums text-on-surface-variant">
            {photos.length}
          </span>
        ) : null}
      </div>
      <div className="hide-scrollbar -mx-0.5 flex gap-1.5 overflow-x-auto px-0.5">
        <button
          type="button"
          onClick={() => {
            hapticLight();
            onCapture();
          }}
          className={cn(
            thumbSize,
            'flex shrink-0 flex-col items-center justify-center gap-px rounded-md border border-dashed border-outline-variant text-on-surface-variant transition-all touch-manipulation active:scale-95 hover:border-secondary hover:bg-surface-container-low hover:text-secondary',
          )}
          aria-label={`Adicionar ${label.toLowerCase()}`}
        >
          <ImagePlus className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} aria-hidden />
          {!compact ? (
            <span className="text-[10px] font-medium">Anexar</span>
          ) : null}
        </button>
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className={cn(
              thumbSize,
              'relative shrink-0 overflow-hidden rounded-md border border-outline-variant bg-surface-container-low',
            )}
          >
            <img
              src={photo.previewUrl}
              alt={`${label} ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              aria-label={`Remover ${label.toLowerCase()} ${index + 1}`}
              onClick={() => {
                hapticLight();
                void onRemove(photo.id);
              }}
              className={cn(
                'absolute right-0.5 top-0.5 flex items-center justify-center rounded bg-foreground/75 text-background touch-manipulation active:scale-95',
                compact ? 'h-5 w-5' : 'h-7 w-7',
              )}
            >
              <Trash2 className={cn(compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5')} aria-hidden />
            </button>
          </div>
        ))}
      </div>
      {hiddenInput}
    </div>
  );
}
