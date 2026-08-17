import { Button, cn } from '@lilog/ui';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  OctagonAlert,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { AvariaSelectField } from '@/features/recebimento/components/avaria-select-field';
import {
  findDockOptionValue,
  resolveDockDisplayLabel,
} from '@/lib/offline/checklist-cache';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import { PhotoCaptureModalV3 } from '@/features/recebimento-v3/components/photo-capture-modal-v3';
import { usePhotoCaptureV3 } from '@/features/recebimento-v3/hooks/use-photo-capture-v3';

import { ChecklistResumoV2Card } from '@/features/recebimento-v2/components/checklist-resumo-v2-card';
import { useDocasV2, type DocaOptionV2 } from '@/features/recebimento-v2/hooks/use-docas-v2';
import { recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';
import {
  checklistRequiresObservacoes,
  type ChecklistFormV2,
} from '@/features/recebimento-v2/types/recebimento-v2.schema';

import { useChecklistV3 } from '../hooks/use-checklist-v3';
import { useImpedimentoV2 } from '@/features/recebimento-v2/hooks/use-impedimento-v2';
import { ImpedimentoV2Sheet } from '@/features/recebimento-v2/views/impedimento-v2-sheet';

const DEFAULT_CONDITIONS = [
  { id: 'limpeza', label: 'Limpeza Interna' },
  { id: 'odor', label: 'Ausência de Odor' },
  { id: 'estrutura', label: 'Integridade Estrutural' },
  { id: 'vedacao', label: 'Vedação das Portas' },
];

const REQUIRED_PHOTO_SLOTS = [
  { id: 'lacre', label: 'Foto do lacre', hint: 'Lacre visível e legível' },
  { id: 'bauFechado', label: 'Baú fechado', hint: 'Portas fechadas por fora' },
  { id: 'bauAberto', label: 'Baú aberto', hint: 'Interior do compartimento' },
] as const;

type PhotoSlotId = (typeof REQUIRED_PHOTO_SLOTS)[number]['id'];

function resolveDockFormValue(
  dockRef: string | null | undefined,
  dockOptions: DocaOptionV2[],
): string {
  if (!dockRef?.trim()) return '';

  return (
    findDockOptionValue(dockRef, dockOptions) ??
    dockOptions.find(
      (option) => option.label === dockRef || option.value === dockRef,
    )?.value ??
    ''
  );
}

function normalizeChecklistConditions(
  conditions?: Record<string, boolean>,
): Record<string, boolean> {
  return Object.fromEntries(
    DEFAULT_CONDITIONS.map((condition) => [condition.id, Boolean(conditions?.[condition.id])]),
  );
}

function checklistOwnerId(demandId: string, slot: PhotoSlotId | 'extras') {
  return `checklist-${demandId}-${slot}`;
}

function ConditionToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        hapticLight();
        onChange(!checked);
      }}
      className={cn(
        'flex w-full items-center justify-between gap-3 px-4 py-3 text-left touch-manipulation transition-colors active:bg-surface-container-low',
        checked ? 'bg-surface' : 'bg-warning/5',
      )}
    >
      <span className="text-body-md text-on-surface">{label}</span>
      <div
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-secondary' : 'bg-outline-variant/60',
        )}
        aria-hidden
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow-sm transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </div>
    </button>
  );
}

function PhotoThumb({
  title,
  photo,
  error,
  isProcessing = false,
  onCapture,
  onRemove,
}: {
  title: string;
  photo?: { id: string; previewUrl: string };
  error?: string;
  isProcessing?: boolean;
  onCapture: () => void;
  onRemove: (photoId: string) => void;
}) {
  return (
    <div className="relative shrink-0">
      {isProcessing ? (
        <div
          className="flex h-14 w-14 items-center justify-center rounded-lg border border-secondary/40 bg-surface-container-low"
          aria-label={`Processando foto: ${title}`}
        >
          <Loader2 className="h-5 w-5 animate-spin text-secondary" aria-hidden />
        </div>
      ) : photo ? (
        <button
          type="button"
          onClick={() => {
            hapticLight();
            onCapture();
          }}
          className={cn(
            'h-14 w-14 overflow-hidden rounded-lg border bg-surface-container-low touch-manipulation active:scale-95',
            error ? 'border-destructive' : 'border-secondary',
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
          disabled={isProcessing}
          className={cn(
            'flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed bg-surface-container-low px-1 touch-manipulation active:scale-95 disabled:opacity-60',
            error
              ? 'border-destructive text-destructive'
              : 'border-outline-variant text-on-surface-variant',
          )}
          aria-label={`Tirar foto: ${title}`}
        >
          <Camera className="h-5 w-5 shrink-0" aria-hidden />
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

interface ChecklistV3ViewProps {
  demandId: string;
  viewOnly?: boolean;
}

export function ChecklistV3View({ demandId, viewOnly = false }: ChecklistV3ViewProps) {
  const navigate = useNavigate();
  const { checklist, saveChecklist, isComplete, isLoading } = useChecklistV3(demandId);
  const { impedimento, isImpedido, retomarConferencia, canRetomar, retomarBlockingMessage } =
    useImpedimentoV2(demandId);
  const { dockOptions } = useDocasV2();
  const process = useLiveQuery(
    () => recebimentoV2Db.processes.get(demandId),
    [demandId],
  );
  const [photoErrors, setPhotoErrors] = useState<Partial<Record<PhotoSlotId, string>>>({});
  const [isImpedimentoSheetOpen, setIsImpedimentoSheetOpen] = useState(false);
  const [isRetomando, setIsRetomando] = useState(false);

  const lacrePhotos = usePhotoCaptureV3({
    processId: demandId,
    ownerType: 'checklist',
    ownerId: checklistOwnerId(demandId, 'lacre'),
    maxNumberOfFiles: 1,
  });
  const bauFechadoPhotos = usePhotoCaptureV3({
    processId: demandId,
    ownerType: 'checklist',
    ownerId: checklistOwnerId(demandId, 'bauFechado'),
    maxNumberOfFiles: 1,
  });
  const bauAbertoPhotos = usePhotoCaptureV3({
    processId: demandId,
    ownerType: 'checklist',
    ownerId: checklistOwnerId(demandId, 'bauAberto'),
    maxNumberOfFiles: 1,
  });
  const extrasPhotos = usePhotoCaptureV3({
    processId: demandId,
    ownerType: 'checklist',
    ownerId: checklistOwnerId(demandId, 'extras'),
  });

  const captureBySlot = useMemo(
    () => ({
      lacre: lacrePhotos,
      bauFechado: bauFechadoPhotos,
      bauAberto: bauAbertoPhotos,
    }),
    [bauAbertoPhotos, bauFechadoPhotos, lacrePhotos],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    getValues,
    setValue,
    setError,
    clearErrors,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ChecklistFormV2>({
    defaultValues: {
      dock: '',
      lacre: '',
      conditions: normalizeChecklistConditions(),
    },
  });

  const selectedDock = watch('dock');
  const watchedConditions = watch('conditions');
  const requiresObservacoes = checklistRequiresObservacoes(watchedConditions);

  useEffect(() => {
    if (!requiresObservacoes) {
      clearErrors('observacoes');
      return;
    }
    void trigger('observacoes');
  }, [clearErrors, requiresObservacoes, trigger]);

  useEffect(() => {
    if (dockOptions.length === 0) return;

    const dockRef = checklist?.dock?.trim() || process?.dock?.trim() || '';
    const dockValue = resolveDockFormValue(dockRef, dockOptions);

    if (checklist) {
      reset({
        dock: dockValue,
        lacre: checklist.lacre ?? '',
        tempBau: checklist.tempBau,
        conditions: normalizeChecklistConditions(checklist.conditions),
        observacoes: checklist.observacoes,
      });
      return;
    }

    if (dockValue) {
      reset({
        dock: dockValue,
        lacre: '',
        conditions: normalizeChecklistConditions(),
      });
    }
  }, [checklist, dockOptions, process?.dock, reset]);

  if (viewOnly) {
    return (
      <div className="page-enter flex flex-col pb-safe-offset-4">
        <div className="sticky top-0 z-20 border-b border-outline-variant/60 bg-surface/95 backdrop-blur-md supports-[backdrop-filter]:bg-surface/80">
          <div className="flex items-center gap-3 px-margin-mobile py-3">
            <Link
              to="/recebimento-v3/$id/itens"
              params={{ id: demandId }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant touch-manipulation transition-transform active:scale-90"
              aria-label="Voltar para conferência"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-headline-sm font-bold text-on-surface">Checklist do veículo</h1>
              {isComplete && (
                <p className="text-label-sm text-secondary">Checklist concluído</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-4 px-margin-mobile">
          <ChecklistResumoV2Card
            checklist={checklist}
            isLoading={isLoading}
            defaultOpen
          />
        </div>
      </div>
    );
  }

  async function handleRetomarConferencia() {
    try {
      hapticMedium();
      setIsRetomando(true);
      await retomarConferencia();
      toast.success('Conferência retomada');
      if (isComplete) {
        await navigate({ to: '/recebimento-v3/$id/itens', params: { id: demandId } });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao retomar conferência');
    } finally {
      setIsRetomando(false);
    }
  }

  async function onSubmit(form: ChecklistFormV2) {
    const nextPhotoErrors: Partial<Record<PhotoSlotId, string>> = {};
    for (const slot of REQUIRED_PHOTO_SLOTS) {
      if (captureBySlot[slot.id].photos.length === 0) {
        nextPhotoErrors[slot.id] = 'Foto obrigatória';
      }
    }
    setPhotoErrors(nextPhotoErrors);
    if (Object.keys(nextPhotoErrors).length > 0) {
      toast.error('Informe todas as fotos obrigatórias');
      return;
    }

    const conditions = normalizeChecklistConditions(form.conditions);
    if (checklistRequiresObservacoes(conditions) && !form.observacoes?.trim()) {
      setError('observacoes', {
        type: 'manual',
        message: 'Informe observações para as condições não conformes',
      });
      toast.error('Informe observações para as condições não conformes');
      return;
    }

    const dockOption = dockOptions.find((d) => d.value === form.dock);
    const dockLabel = dockOption
      ? dockOption.label.split(' — ')[0]?.trim() || dockOption.label
      : resolveDockDisplayLabel(form.dock, dockOptions);

    try {
      hapticMedium();
      await saveChecklist(
        { ...form, conditions },
        form.dock,
        dockLabel,
        {
          lacre: lacrePhotos.getPhotoIds(),
          bauFechado: bauFechadoPhotos.getPhotoIds(),
          bauAberto: bauAbertoPhotos.getPhotoIds(),
          extras: extrasPhotos.getPhotoIds(),
        },
      );
      toast.success('Checklist salvo');
      await navigate({ to: '/recebimento-v3/$id/itens', params: { id: demandId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar checklist');
    }
  }

  return (
    <div className="page-enter flex flex-col pb-safe-offset-4">
      <div className="sticky top-0 z-20 border-b border-outline-variant/60 bg-surface/95 backdrop-blur-md supports-[backdrop-filter]:bg-surface/80">
        <div className="flex items-center gap-3 px-margin-mobile py-3">
          <Link
            to="/recebimento-v3"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant touch-manipulation transition-transform active:scale-90"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-headline-sm font-bold text-on-surface">Checklist do veículo</h1>
            {isImpedido ? (
              <p className="text-label-sm text-warning">Descarga suspensa</p>
            ) : isComplete ? (
              <p className="text-label-sm text-secondary">Checklist concluído</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {!isImpedido ? (
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  setIsImpedimentoSheetOpen(true);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface-variant touch-manipulation transition-transform active:scale-90"
                aria-label="Reportar impedimento para descarga"
              >
                <OctagonAlert className="h-4.5 w-4.5" aria-hidden />
              </button>
            ) : null}
            {isComplete && !isImpedido ? (
              <Link
                to="/recebimento-v3/$id/itens"
                params={{ id: demandId }}
                className="text-label-sm font-medium text-secondary"
              >
                Ir para itens
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-5 px-margin-mobile">
        {isImpedido ? (
          <div className="rounded-lg border border-warning/30 bg-warning-container px-4 py-3">
            <div className="flex items-start gap-2.5">
              <OctagonAlert className="mt-0.5 h-5 w-5 shrink-0 text-on-warning-container" aria-hidden />
              <div className="min-w-0">
                <p className="text-label-md font-semibold text-on-warning-container">
                  Descarga suspensa
                </p>
                <p className="mt-1 text-body-sm text-on-warning-container/85">
                  {impedimento?.descricao ??
                    'Impedimento registrado. A demanda ficou na lista e pode ser retomada quando houver condições de descarregar.'}
                </p>
                {retomarBlockingMessage && !canRetomar ? (
                  <p className="mt-2 text-body-sm text-destructive">{retomarBlockingMessage}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isRetomando || !canRetomar}
                    onClick={() => void handleRetomarConferencia()}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-secondary px-4 text-label-sm font-semibold text-on-secondary touch-manipulation transition-transform active:scale-[0.98] disabled:opacity-50"
                  >
                    {isRetomando ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    )}
                    {isRetomando ? 'Retomando...' : 'Retomar conferência'}
                  </button>
                  <Link
                    to="/recebimento-v3"
                    className="inline-flex text-label-sm font-medium text-on-warning-container underline"
                  >
                    Voltar para demandas
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
        <AvariaSelectField
          id="dock"
          label="Doca"
          options={dockOptions}
          placeholder="Selecione a doca"
          error={errors.dock?.message}
          {...register('dock', { required: 'Selecione a doca' })}
        />

        <div className="space-y-1.5">
          <label className="text-label-sm font-medium text-on-surface" htmlFor="lacre">
            Número do lacre <span className="text-destructive">*</span>
          </label>
          <input
            id="lacre"
            {...register('lacre', { required: 'Informe o número do lacre' })}
            placeholder="Ex: 123456"
            className={cn(
              'w-full rounded-lg border bg-surface px-3 py-2.5 text-body-md text-on-surface outline-none',
              'focus:border-secondary focus:ring-2 focus:ring-secondary/20',
              errors.lacre ? 'border-destructive' : 'border-input',
            )}
          />
          {errors.lacre && (
            <p className="text-label-sm text-destructive">{errors.lacre.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-label-sm font-medium text-on-surface" htmlFor="tempBau">
            Temperatura do baú (°C)
          </label>
          <input
            id="tempBau"
            type="number"
            step="0.1"
            {...register('tempBau')}
            placeholder="Ex: -18.0"
            className="w-full rounded-lg border border-input bg-surface px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
          />
        </div>

        <div className="space-y-3">
          <p className="text-label-sm font-medium text-on-surface">Fotos obrigatórias</p>
          {REQUIRED_PHOTO_SLOTS.map((slot) => (
            <div key={slot.id} className="rounded-lg border border-outline-variant bg-surface p-3">
              <div className="flex items-start gap-3">
                <PhotoThumb
                  title={slot.label}
                  photo={captureBySlot[slot.id].photos[0]}
                  error={photoErrors[slot.id]}
                  isProcessing={captureBySlot[slot.id].isProcessing}
                  onCapture={() => captureBySlot[slot.id].capture()}
                  onRemove={(id) => void captureBySlot[slot.id].removePhoto(id)}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-semibold text-on-surface">{slot.label}</p>
                  <p className="text-label-sm text-on-surface-variant">{slot.hint}</p>
                  {photoErrors[slot.id] && (
                    <p className="mt-1 text-label-sm text-destructive">{photoErrors[slot.id]}</p>
                  )}
                </div>
              </div>
              <PhotoCaptureModalV3
                capture={captureBySlot[slot.id]}
                note={`Capture a foto: ${slot.label}`}
              />
            </div>
          ))}

          <div className="rounded-lg border border-outline-variant bg-surface p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-body-sm font-semibold text-on-surface">Fotos extras</p>
              <button
                type="button"
                onClick={() => extrasPhotos.capture()}
                disabled={extrasPhotos.isProcessing}
                className="inline-flex items-center gap-1 text-label-sm text-secondary disabled:opacity-50"
              >
                {extrasPhotos.isProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                )}
                Adicionar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {extrasPhotos.photos.map((photo) => (
                <PhotoThumb
                  key={photo.id}
                  title="Extra"
                  photo={photo}
                  isProcessing={extrasPhotos.isProcessing}
                  onCapture={() => extrasPhotos.capture()}
                  onRemove={(id) => void extrasPhotos.removePhoto(id)}
                />
              ))}
            </div>
            <PhotoCaptureModalV3
              capture={extrasPhotos}
              note="Adicione fotos extras do checklist."
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-label-sm font-medium text-on-surface">Condições do veículo</p>
          <div className="divide-y divide-outline-variant/50 overflow-hidden rounded-lg border border-outline-variant bg-surface">
            {DEFAULT_CONDITIONS.map((condition) => (
              <ConditionToggleRow
                key={condition.id}
                label={condition.label}
                checked={Boolean(watchedConditions?.[condition.id])}
                onChange={(next) => {
                  setValue(`conditions.${condition.id}`, next, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  void trigger('observacoes');
                }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-label-sm font-medium text-on-surface" htmlFor="observacoes">
            Observações
            {requiresObservacoes ? <span className="text-destructive"> *</span> : null}
          </label>
          <textarea
            id="observacoes"
            {...register('observacoes', {
              validate: (value) => {
                const conditions = getValues('conditions');
                if (!checklistRequiresObservacoes(conditions)) return true;
                return value?.trim()
                  ? true
                  : 'Informe observações para as condições não conformes';
              },
            })}
            rows={3}
            placeholder={
              requiresObservacoes
                ? 'Descreva as irregularidades encontradas...'
                : 'Observações adicionais...'
            }
            className={cn(
              'w-full resize-none rounded-lg border bg-surface px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20',
              errors.observacoes ? 'border-destructive' : 'border-input',
            )}
          />
          {errors.observacoes ? (
            <p className="text-label-sm text-destructive">{errors.observacoes.message}</p>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-label-md font-semibold text-on-secondary touch-manipulation transition-transform active:scale-[0.98]"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : isComplete ? (
            <ArrowRight className="h-5 w-5" aria-hidden />
          ) : (
            <Save className="h-5 w-5" aria-hidden />
          )}
          {isSubmitting
            ? 'Salvando...'
            : isComplete
              ? 'Atualizar e continuar'
              : 'Salvar e iniciar conferência'}
        </Button>
          </>
        )}
      </form>

      <ImpedimentoV2Sheet
        demandId={demandId}
        open={isImpedimentoSheetOpen}
        onOpenChange={setIsImpedimentoSheetOpen}
        onSuccess={() => {
          void navigate({ to: '/recebimento-v3' });
        }}
      />
    </div>
  );
}
