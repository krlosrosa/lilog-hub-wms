import { cn } from '@lilog/ui';
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Loader2,
  Pin,
  Thermometer,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

import type { ChecklistRecebimentoApi } from '../types/recebimento.api';
import type { ChecklistPhotoPreview } from '../hooks/use-checklist-resumo';

const CONDITION_ITEMS = [
  { key: 'limpeza' as const, label: 'Limpeza interna' },
  { key: 'odor' as const, label: 'Ausência de odor' },
  { key: 'estrutura' as const, label: 'Integridade estrutural' },
  { key: 'vedacao' as const, label: 'Vedação das portas' },
];

function formatTemperature(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }

  return `${value.toFixed(1)}°C`;
}

function ChecklistPhotoThumb({ photo }: { photo: ChecklistPhotoPreview }) {
  return (
    <figure className="space-y-1">
      <div className="aspect-[4/3] overflow-hidden rounded-lg border border-outline-variant bg-surface-container">
        <img
          src={photo.url}
          alt={photo.label}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <figcaption className="truncate text-center text-[10px] font-medium text-on-surface-variant">
        {photo.label}
      </figcaption>
    </figure>
  );
}

export function ChecklistResumoCard({
  checklist,
  photos,
  isLoading,
  hasChecklist,
}: {
  checklist: ChecklistRecebimentoApi | null;
  photos: ChecklistPhotoPreview[];
  isLoading: boolean;
  hasChecklist: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!isLoading && (!hasChecklist || !checklist)) {
    return null;
  }

  const approvedConditions = checklist
    ? CONDITION_ITEMS.filter((item) => checklist.conditions[item.key]).length
    : 0;

  const subtitle = isLoading
    ? 'Carregando checklist...'
    : checklist?.lacre
      ? `Lacre ${checklist.lacre} · ${photos.length || checklist.photoCount} foto${(photos.length || checklist.photoCount) === 1 ? '' : 's'}`
      : `Sem lacre informado · ${photos.length || checklist?.photoCount || 0} foto${(photos.length || checklist?.photoCount || 0) === 1 ? '' : 's'}`;

  return (
    <article className="overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-sm">
      <button
        type="button"
        onClick={() => {
          if (!isLoading && hasChecklist) {
            setOpen((current) => !current);
          }
        }}
        disabled={isLoading}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left touch-manipulation disabled:cursor-default"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary-container text-on-secondary-container">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ClipboardList className="h-4 w-4" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-label-sm font-semibold text-on-surface">
            Checklist de entrada
          </p>
          <p className="truncate text-[11px] text-on-surface-variant">{subtitle}</p>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-outline transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {open && !isLoading && checklist ? (
        <div className="space-y-3 border-t border-outline-variant/60 px-3 py-3">
          <div className="grid grid-cols-1 gap-2">
            <div className="rounded-lg bg-surface-container px-3 py-2">
              <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wide text-on-surface-variant">
                <Thermometer className="h-3 w-3" aria-hidden />
                Baú
              </div>
              <p className="font-mono text-label-md font-semibold text-on-surface">
                {formatTemperature(checklist.tempBau)}
              </p>
            </div>
          </div>

          {checklist.lacre ? (
            <div className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-2">
              <Pin className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide text-on-surface-variant">
                  Lacre
                </p>
                <p className="truncate font-mono text-label-md font-semibold text-on-surface">
                  {checklist.lacre}
                </p>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-label-sm font-semibold text-on-surface">
                Condições do veículo
              </p>
              <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-semibold text-on-secondary-container">
                {approvedConditions}/{CONDITION_ITEMS.length}
              </span>
            </div>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {CONDITION_ITEMS.map((item) => {
                const ok = checklist.conditions[item.key];

                return (
                  <li
                    key={item.key}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-2.5 py-2 text-label-sm',
                      ok
                        ? 'bg-secondary/10 text-on-surface'
                        : 'bg-error-container/20 text-on-error-container',
                    )}
                  >
                    {ok ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
                    )}
                    <span>{item.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {checklist.observacoes ? (
            <div className="rounded-lg bg-surface-container px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-on-surface-variant">
                Observações
              </p>
              <p className="mt-1 text-body-sm text-on-surface">{checklist.observacoes}</p>
            </div>
          ) : null}

          {photos.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-label-sm font-semibold text-on-surface">
                <Camera className="h-4 w-4 text-secondary" aria-hidden />
                Fotos do checklist
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {photos.map((photo) => (
                  <ChecklistPhotoThumb key={photo.id} photo={photo} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
