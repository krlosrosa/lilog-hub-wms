import { cn } from '@lilog/ui';
import {
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  ImageOff,
  Loader2,
  Pin,
  Thermometer,
  XCircle,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';

import { normalizeTempBau } from '../lib/checklist-sync-payload';
import { useDockDisplayLabelV2 } from '../hooks/use-dock-display-label-v2';
import { recebimentoV2Db } from '../local-db/db';
import type { ChecklistPhotoMediaIds, ChecklistRecord } from '../local-db/schema';

const CONDITION_ITEMS = [
  { key: 'limpeza', label: 'Limpeza interna' },
  { key: 'odor', label: 'Ausência de odor' },
  { key: 'estrutura', label: 'Integridade estrutural' },
  { key: 'vedacao', label: 'Vedação das portas' },
];

function formatTemperature(value: unknown): string {
  const normalized = normalizeTempBau(value);
  if (normalized == null) return '—';
  return `${normalized.toFixed(1)}°C`;
}

const PHOTO_SLOT_LABELS: Array<{ key: keyof ChecklistPhotoMediaIds; label: string }> = [
  { key: 'lacre', label: 'Lacre' },
  { key: 'bauFechado', label: 'Baú fechado' },
  { key: 'bauAberto', label: 'Baú aberto' },
  { key: 'extras', label: 'Extras' },
];

function ChecklistPhotoPreviews({
  photoMediaIds,
}: {
  photoMediaIds: ChecklistPhotoMediaIds;
}) {
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  const mediaRecords = useLiveQuery(async () => {
    const ids = PHOTO_SLOT_LABELS.flatMap(({ key }) => photoMediaIds[key] ?? []);
    if (ids.length === 0) return [];

    const records = await recebimentoV2Db.media.bulkGet(ids);
    return records.filter((record): record is NonNullable<typeof record> => Boolean(record));
  }, [photoMediaIds]);

  useEffect(() => {
    if (!mediaRecords) return;

    const nextUrls: Record<string, string> = {};
    for (const record of mediaRecords) {
      if (record.blob) {
        nextUrls[record.id] = URL.createObjectURL(record.blob);
      }
    }

    setPreviewUrls(nextUrls);

    return () => {
      for (const url of Object.values(nextUrls)) {
        URL.revokeObjectURL(url);
      }
    };
  }, [mediaRecords]);

  const hasPhotos = PHOTO_SLOT_LABELS.some(({ key }) => (photoMediaIds[key] ?? []).length > 0);
  if (!hasPhotos) return null;

  return (
    <div className="space-y-2">
      <p className="text-label-sm font-medium text-on-surface">Fotos</p>
      {PHOTO_SLOT_LABELS.map(({ key, label }) => {
        const ids = photoMediaIds[key] ?? [];
        if (ids.length === 0) return null;

        return (
          <div key={key}>
            <p className="mb-1 text-label-sm text-on-surface-variant">{label}</p>
            <div className="flex flex-wrap gap-2">
              {ids.map((id) => {
                const record = mediaRecords?.find((item) => item.id === id);
                const previewUrl = previewUrls[id];
                return (
                  <div
                    key={id}
                    className="h-16 w-16 overflow-hidden rounded-lg border border-outline-variant bg-surface-container"
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
                    ) : record?.status === 'uploaded' ? (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-secondary">
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                        <span className="text-[9px] font-medium">Enviada</span>
                      </div>
                    ) : record?.status === 'error' ? (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-destructive">
                        <ImageOff className="h-4 w-4" aria-hidden />
                        <span className="text-[9px] font-medium">Erro</span>
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-outline" aria-hidden />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ChecklistResumoV2Card({
  checklist,
  isLoading,
  defaultOpen = false,
}: {
  checklist: ChecklistRecord | undefined;
  isLoading: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const photoCount = useLiveQuery(async () => {
    if (!checklist?.photoMediaIds) return 0;
    const ids = [
      ...(checklist.photoMediaIds.lacre ?? []),
      ...(checklist.photoMediaIds.bauFechado ?? []),
      ...(checklist.photoMediaIds.bauAberto ?? []),
      ...(checklist.photoMediaIds.extras ?? []),
    ];
    if (ids.length === 0) return 0;
    const media = await recebimentoV2Db.media.bulkGet(ids);
    return media.filter(Boolean).length;
  }, [checklist?.photoMediaIds]);

  const approvedConditions = useMemo(() => {
    if (!checklist) return 0;
    return CONDITION_ITEMS.filter((item) => checklist.conditions[item.key]).length;
  }, [checklist]);

  const dockLabel = useDockDisplayLabelV2(checklist?.dock);

  if (!isLoading && !checklist) return null;

  const subtitle = isLoading
    ? 'Carregando checklist...'
    : checklist?.lacre
      ? `Lacre ${checklist.lacre} · ${photoCount ?? 0} foto${(photoCount ?? 0) === 1 ? '' : 's'}`
      : `Sem lacre informado · ${photoCount ?? 0} foto${(photoCount ?? 0) === 1 ? '' : 's'}`;

  return (
    <article className="overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-sm">
      <button
        type="button"
        onClick={() => {
          if (!isLoading && checklist) setOpen((current) => !current);
        }}
        disabled={isLoading}
        className="flex w-full items-center gap-2.5 px-3 py-3 text-left touch-manipulation disabled:cursor-default"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ClipboardList className="h-4 w-4" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-label-md font-semibold text-on-surface">Checklist de entrada</p>
          <p className="truncate text-label-sm text-on-surface-variant">{subtitle}</p>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-outline transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {open && checklist && (
        <div className="space-y-3 border-t border-outline-variant/60 px-3 py-3">
          <div className="grid grid-cols-2 gap-2 text-label-sm">
            <div className="rounded-lg bg-surface-container px-3 py-2">
              <p className="text-on-surface-variant">Doca</p>
              <p className="font-semibold text-on-surface">{dockLabel}</p>
            </div>
            <div className="rounded-lg bg-surface-container px-3 py-2">
              <p className="text-on-surface-variant">Lacre</p>
              <p className="font-mono font-semibold text-on-surface">{checklist.lacre || '—'}</p>
            </div>
            <div className="rounded-lg bg-surface-container px-3 py-2">
              <p className="flex items-center gap-1 text-on-surface-variant">
                <Thermometer className="h-3 w-3" aria-hidden />
                Temp. baú
              </p>
              <p className="font-semibold text-on-surface">
                {formatTemperature(checklist.tempBau)}
              </p>
            </div>
            <div className="rounded-lg bg-surface-container px-3 py-2">
              <p className="text-on-surface-variant">Condições</p>
              <p className="font-semibold text-on-surface">
                {approvedConditions}/{CONDITION_ITEMS.length}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            {CONDITION_ITEMS.map((item) => {
              const approved = checklist.conditions[item.key];
              return (
                <div key={item.key} className="flex items-center gap-2 text-label-sm">
                  {approved ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-secondary" aria-hidden />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-destructive" aria-hidden />
                  )}
                  <span className={approved ? 'text-on-surface' : 'text-on-surface-variant'}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {checklist.observacoes ? (
            <div className="rounded-lg bg-surface-container px-3 py-2 text-label-sm">
              <p className="flex items-center gap-1 text-on-surface-variant">
                <Pin className="h-3 w-3" aria-hidden />
                Observações
              </p>
              <p className="mt-1 text-on-surface">{checklist.observacoes}</p>
            </div>
          ) : null}

          {checklist.photoMediaIds ? (
            <ChecklistPhotoPreviews photoMediaIds={checklist.photoMediaIds} />
          ) : null}
        </div>
      )}
    </article>
  );
}
