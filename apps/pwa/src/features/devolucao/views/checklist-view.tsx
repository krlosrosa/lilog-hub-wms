import { Button, cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle,
  CheckCircle2,
  ClipboardCheck,
  LayoutGrid,
  Loader2,
  Lock,
  Plus,
  Sparkles,
  Thermometer,
  Trash2,
  Truck,
  Wind,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { hapticLight, hapticMedium } from '@/lib/haptics';

import { AvariaSelectField } from '../components/avaria-select-field';
import { PaleteIcon } from '../components/palete-icon';
import {
  useChecklist,
  type ChecklistPhotoSlotState,
  type ChecklistRequiredPhotoSlotId,
} from '../hooks/use-checklist';

const CONDITIONS = [
  { id: 'limpeza' as const, label: 'Limpeza Interna', icon: Sparkles },
  { id: 'odor' as const, label: 'Ausência de Odor', icon: Wind },
  { id: 'estrutura' as const, label: 'Integridade Estrutural', icon: LayoutGrid },
  { id: 'vedacao' as const, label: 'Vedação das Portas', icon: Lock },
];

interface ChecklistViewProps {
  demandId: string;
}

const PHOTO_THUMB = 'h-14 w-14';

function PhotoThumb({
  title,
  photo,
  error,
  onCapture,
  onReplace,
  onRemove,
}: {
  title: string;
  photo?: { id: number; previewUrl: string };
  error?: string;
  onCapture: () => void;
  onReplace: () => void;
  onRemove: (photoId: number) => void;
}) {
  return (
    <div className="relative shrink-0">
      {photo ? (
        <button
          type="button"
          onClick={() => {
            hapticLight();
            onReplace();
          }}
          className={cn(
            PHOTO_THUMB,
            'overflow-hidden rounded-lg border bg-surface-container-low touch-manipulation active:scale-95',
            error ? 'border-destructive' : 'border-secondary'
          )}
          aria-label={`Trocar foto: ${title}`}
        >
          <img src={photo.previewUrl} alt={title} className="h-full w-full object-cover" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            hapticLight();
            onCapture();
          }}
          className={cn(
            PHOTO_THUMB,
            'flex items-center justify-center rounded-lg border-2 border-dashed bg-surface-container-low touch-manipulation active:scale-95',
            error
              ? 'border-destructive text-destructive'
              : 'border-outline-variant text-on-surface-variant'
          )}
          aria-label={`Tirar foto: ${title}`}
        >
          <Camera className="h-5 w-5" aria-hidden />
        </button>
      )}
      {photo ? (
        <>
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <CheckCircle2 className="h-2.5 w-2.5" aria-hidden />
          </span>
          <button
            type="button"
            aria-label={`Remover foto: ${title}`}
            onClick={() => {
              hapticLight();
              void onRemove(photo.id);
            }}
            className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/75 text-background touch-manipulation active:scale-95"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </>
      ) : null}
    </div>
  );
}

function PhotoListRow({
  title,
  hint,
  photo,
  required,
  error,
  onCapture,
  onReplace,
  onRemove,
}: {
  title: string;
  hint?: string;
  photo?: { id: number; previewUrl: string };
  required?: boolean;
  error?: string;
  onCapture: () => void;
  onReplace: () => void;
  onRemove: (photoId: number) => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 py-2.5',
        error && 'rounded-lg bg-destructive/5 px-1 -mx-1'
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-body-sm font-medium text-on-surface">
          {title}
          {required ? <span className="text-destructive"> *</span> : null}
        </p>
        {hint ? <p className="truncate text-label-sm text-on-surface-variant">{hint}</p> : null}
        {error ? <p className="text-label-sm text-destructive">{error}</p> : null}
      </div>
      <PhotoThumb
        title={title}
        photo={photo}
        error={error}
        onCapture={onCapture}
        onReplace={onReplace}
        onRemove={onRemove}
      />
    </div>
  );
}

function ChecklistBottomDock({
  isSubmitting,
  onSubmit,
}: {
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-margin-mobile pb-safe">
      <div className="pointer-events-auto mx-auto max-w-screen-xl rounded-t-2xl border border-b-0 border-outline-variant bg-surface-container-highest/95 p-4 shadow-[0_-8px_24px_rgba(11,28,48,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-surface-container-highest/90">
        <Button
          type="button"
          onClick={() => {
            hapticMedium();
            void onSubmit();
          }}
          disabled={isSubmitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-on-secondary text-label-md font-semibold shadow-sm touch-manipulation active:scale-[0.98] hover:bg-secondary/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Salvando...
            </>
          ) : (
            <>
              Salvar e iniciar conferência
              <ArrowRight className="h-5 w-5" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </div>,
    document.body
  );
}

function ChecklistSuccessOverlay({
  open,
  progress,
}: {
  open: boolean;
  progress: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center bg-primary/20 backdrop-blur-sm transition-opacity duration-300',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      )}
      aria-hidden={!open}
    >
      <div className="mx-margin-mobile w-full max-w-sm rounded-lg border border-outline-variant bg-surface p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
          <CheckCircle className="h-12 w-12" aria-hidden />
        </div>
        <h2 className="mb-2 text-headline-md font-semibold text-on-surface">Checklist salvo!</h2>
        <p className="mb-6 text-body-sm text-on-surface-variant">
          Os dados foram registrados. Redirecionando para a conferência de carga...
        </p>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso do redirecionamento"
        >
          <div
            className="h-full rounded-full bg-secondary transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ChecklistView({ demandId }: ChecklistViewProps) {
  const { state, actions } = useChecklist(demandId);
  const {
    demand,
    checked,
    showSuccess,
    progress,
    isSubmitting,
    errors,
    requiredPhotoSlots,
    extraPhotos,
    requiredPhotosComplete,
    photoErrors,
    requiredPhotoCount,
    selectedDock,
    dockOptions,
    paletesEsperados,
  } = state;

  const handleSlotCapture = async (
    slot: ChecklistPhotoSlotState,
    replaceExisting: boolean
  ) => {
    actions.clearSlotError(slot.id);
    if (replaceExisting && slot.photos[0]) {
      await slot.removePhoto(slot.photos[0].id);
    }
    slot.capture();
  };

  return (
    <div className="page-enter flex flex-col">
      {actions.photoHiddenInputs.bauFechado}
      {actions.photoHiddenInputs.bauAberto}
      {actions.photoHiddenInputs.extras}
      <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center gap-3 px-margin-mobile">
          <Link
            to="/devolucao"
            aria-label="Voltar para lista de demandas"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-headline-md font-semibold leading-tight text-on-surface">
              Checklist de entrada
            </h1>
            {demand ? (
              <p className="truncate font-mono text-label-sm text-on-surface-variant">
                {demand.id}
                {selectedDock ? ` · ${selectedDock}` : ''}
              </p>
            ) : (
              <p className="truncate text-label-sm text-on-surface-variant">{demandId}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 px-margin-mobile pb-[calc(120px+env(safe-area-inset-bottom,0px))] pt-4">
        <p className="text-body-sm text-on-surface-variant">
          Insira os dados de conferência do veículo para autorizar o descarregamento.
        </p>

        {demand && (
          <article className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container">
                <Truck className="h-5 w-5 text-secondary" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-label-md font-bold text-primary">{demand.id}</p>
                <p className="line-clamp-2 text-body-sm text-on-surface-variant">{demand.supplier}</p>
              </div>
            </div>
            <div className="mt-3 border-t border-outline-variant/50 pt-3">
              <AvariaSelectField
                id="dock"
                label="Doca de descarga"
                options={dockOptions}
                placeholder="Selecione a doca"
                error={errors.dock?.message}
                className="h-12 rounded-lg border-outline-variant bg-surface-bright"
                {...actions.register('dock', {
                  onChange: () => hapticLight(),
                })}
              />
            </div>
          </article>
        )}

        <section className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-outline-variant pb-3">
            <PaleteIcon className="h-5 w-5 text-secondary" />
            <h2 className="text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
              Paletes
            </h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-surface-container px-4 py-3">
              <span className="text-label-md text-on-surface-variant">Paletes esperados</span>
              <span className="font-mono text-headline-md font-bold tabular-nums text-on-surface">
                {paletesEsperados}
              </span>
            </div>
            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant" htmlFor="paletes-recebidos">
                Paletes recebidos
              </label>
              <input
                id="paletes-recebidos"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                placeholder="0"
                {...actions.register('paletesRecebidos')}
                className="numeric-input h-12 w-full rounded-lg border border-outline-variant bg-surface-bright px-4 text-center font-mono text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary"
              />
              {errors.paletesRecebidos?.message ? (
                <p className="text-label-sm text-destructive">
                  {errors.paletesRecebidos.message}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-outline-variant pb-3">
            <Thermometer className="h-5 w-5 text-secondary" aria-hidden />
            <h2 className="text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
              Temperatura
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant" htmlFor="temp-bau">
                Baú (°C)
              </label>
              <input
                id="temp-bau"
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="0.0"
                {...actions.register('tempBau')}
                className="numeric-input h-12 w-full rounded-lg border border-outline-variant bg-surface-bright px-4 text-center font-mono text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant" htmlFor="temp-prod">
                Produto (°C)
              </label>
              <input
                id="temp-prod"
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="0.0"
                {...actions.register('tempProd')}
                className="numeric-input h-12 w-full rounded-lg border border-outline-variant bg-surface-bright px-4 text-center font-mono text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary"
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Camera className="h-5 w-5 shrink-0 text-secondary" aria-hidden />
              <div className="min-w-0">
                <h2 className="text-label-md font-semibold text-on-surface">Fotos</h2>
                <p className="truncate text-label-sm text-on-surface-variant">
                  3 obrigatórias · extras opcionais
                </p>
              </div>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-lg px-2 py-0.5 font-mono text-label-sm font-semibold',
                requiredPhotosComplete
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-surface-container text-on-surface-variant'
              )}
            >
              {requiredPhotoSlots.filter((s) => s.photos.length > 0).length}/{requiredPhotoCount}
            </span>
          </div>

          <div className="divide-y divide-outline-variant/50">
            {requiredPhotoSlots.map((slot) => (
              <PhotoListRow
                key={slot.id}
                title={slot.label}
                hint={slot.hint}
                photo={slot.photos[0]}
                required
                error={photoErrors[slot.id]}
                onCapture={() => void handleSlotCapture(slot, false)}
                onReplace={() => void handleSlotCapture(slot, true)}
                onRemove={slot.removePhoto}
              />
            ))}

            <div className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-body-sm font-medium text-on-surface">Fotos adicionais</p>
                <p className="text-label-sm text-on-surface-variant">Opcional</p>
              </div>
              <div className="hide-scrollbar flex max-w-[55%] shrink-0 items-center gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => {
                    hapticLight();
                    actions.captureExtra();
                  }}
                  className={cn(
                    PHOTO_THUMB,
                    'flex shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-outline-variant text-on-surface-variant touch-manipulation active:scale-95 hover:border-secondary hover:bg-surface-container-low'
                  )}
                  aria-label="Anexar foto adicional"
                >
                  <Plus className="h-5 w-5" aria-hidden />
                </button>
                {extraPhotos.map((photo, index) => (
                  <PhotoThumb
                    key={photo.id}
                    title={`Foto adicional ${index + 1}`}
                    photo={photo}
                    onCapture={() => {
                      hapticLight();
                      actions.captureExtra();
                    }}
                    onReplace={() => {
                      hapticLight();
                      actions.captureExtra();
                    }}
                    onRemove={actions.removeExtraPhoto}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-outline-variant pb-3">
            <ClipboardCheck className="h-5 w-5 text-secondary" aria-hidden />
            <h2 className="text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
              Condições do baú
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {CONDITIONS.map(({ id, label, icon: Icon }) => (
              <label
                key={id}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors touch-manipulation active:bg-surface-container-low',
                  checked[id]
                    ? 'border-secondary bg-surface-container-high'
                    : 'border-outline-variant/80 bg-surface'
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0 text-on-surface-variant" aria-hidden />
                  <span className="text-body-md text-on-surface">{label}</span>
                </div>
                <input
                  type="checkbox"
                  checked={checked[id]}
                  onChange={() => {
                    hapticLight();
                    actions.toggleCondition(id);
                  }}
                  className="h-5 w-5 shrink-0 rounded border-outline text-secondary focus:ring-secondary"
                />
              </label>
            ))}
          </div>
          <div className="mt-4 space-y-1.5">
            <label className="text-label-md text-on-surface-variant" htmlFor="obs">
              Observações adicionais
            </label>
            <textarea
              id="obs"
              rows={4}
              placeholder="Descreva qualquer irregularidade encontrada..."
              {...actions.register('observacoes')}
              className="w-full resize-none rounded-lg border border-outline-variant bg-surface-bright px-4 py-3 text-body-sm text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary"
            />
          </div>
        </section>
      </div>

      <ChecklistBottomDock isSubmitting={isSubmitting} onSubmit={actions.handleSave} />
      <ChecklistSuccessOverlay open={showSuccess} progress={progress} />
    </div>
  );
}
