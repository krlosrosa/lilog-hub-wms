import { cn } from '@lilog/ui';
import {
  AlertTriangle,
  Check,
  Columns2,
  DoorOpen,
  Package,
  ShoppingBasket,
  Trash2,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react';

import { hapticLight } from '@/lib/haptics';
import { usePhotoCapture } from '@/lib/offline/hooks/use-photo-capture';

import type {
  ChecklistConformidade,
  ChecklistItem,
  ChecklistItemIcon,
} from '../types/passagem-bastao.schema';
import { PhotoGalleryStrip } from './photo-gallery-strip';

const ICON_MAP: Record<ChecklistItemIcon, LucideIcon> = {
  pallet: Package,
  view_column: Columns2,
  shopping_basket: ShoppingBasket,
  restaurant: UtensilsCrossed,
  door_open: DoorOpen,
  delete: Trash2,
};

const AREA_LABELS: Record<ChecklistItem['area'], string> = {
  docas: 'Docas',
  corredores: 'Corredores',
  picking: 'Picking',
  refeitorio: 'Refeitório',
};

interface ChecklistCardProps {
  item: ChecklistItem;
  conformidade: ChecklistConformidade;
  observacao: string;
  onConformidadeChange: (value: Exclude<ChecklistConformidade, 'pendente'>) => void;
  onObservacaoChange: (value: string) => void;
}

export function ChecklistCard({
  item,
  conformidade,
  observacao,
  onConformidadeChange,
  onObservacaoChange,
}: ChecklistCardProps) {
  const Icon = ICON_MAP[item.icon];
  const obsId = `obs-${item.id}`;
  const isNaoConforme = conformidade === 'nao_conforme';
  const isConforme = conformidade === 'conforme';
  const isPending = conformidade === 'pendente';

  const { photos, capture, remove, hiddenInput } = usePhotoCapture({
    relatedId: `passagem-bastao-item-${item.id}`,
  });

  return (
    <article
      className={cn(
        'rounded-lg border bg-surface px-2.5 py-2 shadow-sm transition-colors',
        isConforme && 'border-secondary/40 bg-secondary/5',
        isNaoConforme && 'border-destructive/40 bg-destructive/5',
        isPending && 'border-outline-variant',
      )}
    >
      <div className="flex gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-container">
          <Icon className="h-3.5 w-3.5 text-outline" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="rounded bg-secondary/10 px-1 py-px text-[10px] font-bold uppercase leading-none text-secondary">
              {AREA_LABELS[item.area]}
            </span>
            {!isPending ? (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-1 py-px text-[9px] font-bold uppercase leading-none',
                  isConforme
                    ? 'bg-secondary/15 text-secondary'
                    : 'bg-destructive/15 text-destructive',
                )}
              >
                {isNaoConforme ? (
                  <AlertTriangle className="h-2 w-2" aria-hidden />
                ) : (
                  <Check className="h-2 w-2" aria-hidden />
                )}
                {isConforme ? 'OK' : 'Não OK'}
              </span>
            ) : null}
          </div>

          <h3 className="mt-0.5 text-label-sm font-semibold leading-tight text-on-surface">
            {item.title}
          </h3>
          <p className="mt-px line-clamp-1 text-[11px] leading-snug text-on-surface-variant">
            {item.description}
          </p>
        </div>
      </div>

      <div
        className="mt-2 grid grid-cols-2 gap-1.5"
        role="group"
        aria-label={`Avaliação de ${item.title}`}
      >
        <button
          type="button"
          aria-pressed={isConforme}
          onClick={() => {
            hapticLight();
            onConformidadeChange('conforme');
          }}
          className={cn(
            'flex h-7 items-center justify-center gap-1 rounded-md border text-[11px] font-semibold transition-transform touch-manipulation active:scale-[0.97]',
            isConforme
              ? 'border-secondary bg-secondary text-on-secondary'
              : 'border-outline-variant bg-surface-container text-on-surface-variant',
          )}
        >
          <Check className="h-3 w-3 shrink-0" aria-hidden />
          Conforme
        </button>
        <button
          type="button"
          aria-pressed={isNaoConforme}
          onClick={() => {
            hapticLight();
            onConformidadeChange('nao_conforme');
          }}
          className={cn(
            'flex h-7 items-center justify-center gap-1 rounded-md border text-[11px] font-semibold transition-transform touch-manipulation active:scale-[0.97]',
            isNaoConforme
              ? 'border-destructive bg-destructive text-destructive-foreground'
              : 'border-outline-variant bg-surface-container text-on-surface-variant',
          )}
        >
          <X className="h-3 w-3 shrink-0" aria-hidden />
          Não conforme
        </button>
      </div>

      <input
        id={obsId}
        type="text"
        value={observacao}
        onChange={(event) => onObservacaoChange(event.target.value)}
        placeholder={
          isNaoConforme ? 'Descreva a não conformidade...' : 'Obs. (opcional)'
        }
        aria-label={`Observação para ${item.title}`}
        aria-required={isNaoConforme}
        className={cn(
          'mt-1.5 h-7 w-full rounded-md border bg-surface-container-low px-2 text-[12px] text-on-surface outline-none transition-all placeholder:text-on-surface-variant focus:ring-1',
          isNaoConforme
            ? 'border-destructive/50 focus:border-destructive focus:ring-destructive'
            : 'border-outline-variant focus:border-secondary focus:ring-secondary',
        )}
      />

      <PhotoGalleryStrip
        photos={photos}
        onCapture={capture}
        onRemove={remove}
        hiddenInput={hiddenInput}
        label="Evidências"
        compact
        className="mt-1.5"
      />
    </article>
  );
}
