import { cn } from '@lilog/ui';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { AvariaSelectField } from '@/features/recebimento/components/avaria-select-field';
import {
  findDockOptionValue,
  resolveDockDisplayLabel,
} from '@/lib/offline/checklist-cache';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import { UppyCaptureModal } from '@/lib/uppy/uppy-capture-modal';
import { useUppyCapture } from '@/lib/uppy/use-uppy-capture';

import { ChecklistResumoV2Card } from '@/features/recebimento-v2/components/checklist-resumo-v2-card';
import { useDocasV2, type DocaOptionV2 } from '@/features/recebimento-v2/hooks/use-docas-v2';
import type { ChecklistRecord } from '@/features/recebimento-v2/local-db/schema';
import {
  checklistRequiresObservacoes,
  type ChecklistFormV2,
} from '@/features/recebimento-v2/types/recebimento-v2.schema';

import { useChecklistRc, type RcChecklistSyncStatus } from '../hooks/use-checklist-rc';
import { useDemandaRc } from '../hooks/use-demanda-rc';

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

function ChecklistSyncStatusBadge({
  syncStatus,
  hasPendingSync,
  hasSyncError,
}: {
  syncStatus: RcChecklistSyncStatus;
  hasPendingSync: boolean;
  hasSyncError: boolean;
}) {
  if (hasSyncError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
        <p className="text-label-md font-semibold text-destructive">
          Erro na sincronização
        </p>
        <p className="mt-1 text-body-sm text-destructive/85">
          Edite o checklist para corrigir e tente sincronizar novamente.
        </p>
      </div>
    );
  }

  if (hasPendingSync || syncStatus === 'pending') {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning-container/40 px-4 py-3">
        <p className="text-label-md font-semibold text-on-warning-container">
          Aguardando sincronização
        </p>
        <p className="mt-1 text-body-sm text-on-warning-container/85">
          Checklist concluído localmente. Os dados serão enviados quando houver conexão.
        </p>
      </div>
    );
  }

  if (syncStatus === 'synced') {
    return (
      <div className="rounded-lg border border-secondary/30 bg-secondary/10 px-4 py-3">
        <p className="text-label-md font-semibold text-secondary">Sincronizado</p>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          Checklist confirmado no servidor.
        </p>
      </div>
    );
  }

  return null;
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

interface ChecklistRcViewProps {
  demandId: string;
}

export function ChecklistRcView({ demandId }: ChecklistRcViewProps) {
  const navigate = useNavigate();
  const demanda = useDemandaRc(demandId);
  const isImpedido = demanda?.situacao === 'impedido';

  const lacrePhotos = useUppyCapture({
    processId: demandId,
    ownerType: 'checklist',
    ownerId: checklistOwnerId(demandId, 'lacre'),
    maxNumberOfFiles: 1,
  });
  const bauFechadoPhotos = useUppyCapture({
    processId: demandId,
    ownerType: 'checklist',
    ownerId: checklistOwnerId(demandId, 'bauFechado'),
    maxNumberOfFiles: 1,
  });
  const bauAbertoPhotos = useUppyCapture({
    processId: demandId,
    ownerType: 'checklist',
    ownerId: checklistOwnerId(demandId, 'bauAberto'),
    maxNumberOfFiles: 1,
  });
  const extrasPhotos = useUppyCapture({
    processId: demandId,
    ownerType: 'checklist',
    ownerId: checklistOwnerId(demandId, 'extras'),
  });

  const localPhotoCounts = useMemo(
    () => ({
      lacre: lacrePhotos.photos.length,
      bauFechado: bauFechadoPhotos.photos.length,
      bauAberto: bauAbertoPhotos.photos.length,
    }),
    [
      lacrePhotos.photos.length,
      bauFechadoPhotos.photos.length,
      bauAbertoPhotos.photos.length,
    ],
  );

  const {
    checklist,
    localChecklist,
    saveChecklist,
    isComplete,
    isLoading,
    syncStatus,
    hasPendingSync,
    hasSyncError,
  } = useChecklistRc(demandId, localPhotoCounts);
  const { dockOptions } = useDocasV2();
  const [photoErrors, setPhotoErrors] = useState<Partial<Record<PhotoSlotId, string>>>({});
  const [isEditing, setIsEditing] = useState(false);
  const hadChecklistRef = useRef(false);

  const showReadOnlySummary = isComplete && !isEditing && !isImpedido;
  const canEditChecklist = hasPendingSync || hasSyncError;

  const displayChecklist = useMemo((): ChecklistRecord | undefined => {
    if (localChecklist) {
      return localChecklist;
    }

    if (!checklist) {
      return undefined;
    }

    return {
      demandId,
      id: demandId,
      dock: checklist.dock ?? '',
      lacre: checklist.lacre,
      tempBau: checklist.tempBau ?? undefined,
      conditions: checklist.conditions,
      observacoes: checklist.observacoes ?? undefined,
      photoMediaIds: {
        lacre: lacrePhotos.getPhotoIds(),
        bauFechado: bauFechadoPhotos.getPhotoIds(),
        bauAberto: bauAbertoPhotos.getPhotoIds(),
        extras: extrasPhotos.getPhotoIds(),
      },
      savedAt: checklist.savedAt ?? new Date().toISOString(),
      syncStatus: syncStatus === 'none' ? 'synced' : syncStatus,
      updatedAt: Date.now(),
    };
  }, [
    bauAbertoPhotos,
    bauFechadoPhotos,
    checklist,
    demandId,
    extrasPhotos,
    lacrePhotos,
    localChecklist,
    syncStatus,
  ]);

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

    const checklistSource = localChecklist ?? checklist;
    const dockRef =
      checklistSource?.dock?.trim() || demanda?.dock?.trim() || '';
    const dockValue =
      resolveDockFormValue(dockRef, dockOptions) ||
      (dockRef && dockOptions.some((option) => option.value === dockRef) ? dockRef : '');

    if (checklistSource) {
      hadChecklistRef.current = true;
      reset({
        dock: dockValue,
        lacre: checklistSource.lacre ?? '',
        tempBau: checklistSource.tempBau ?? undefined,
        conditions: normalizeChecklistConditions(checklistSource.conditions),
        observacoes: checklistSource.observacoes ?? undefined,
      });
      return;
    }

    if (!hadChecklistRef.current && dockValue) {
      reset({
        dock: dockValue,
        lacre: '',
        conditions: normalizeChecklistConditions(),
      });
    }
  }, [checklist, localChecklist, demanda?.dock, dockOptions, reset]);

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
      await navigate({
        to: '/recebimento-rc/$id/itens',
        params: { id: demandId },
        search: { fromChecklist: true },
        replace: true,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar checklist');
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" aria-hidden />
      </div>
    );
  }

  if (showReadOnlySummary) {
    return (
      <div className="page-enter flex flex-col pb-safe-offset-4">
        <div className="sticky top-0 z-20 border-b border-outline-variant/60 bg-surface/95 backdrop-blur-md supports-[backdrop-filter]:bg-surface/80">
          <div className="flex items-center gap-3 px-margin-mobile py-3">
            <Link
              to="/recebimento-rc/$id/itens"
              params={{ id: demandId }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant touch-manipulation transition-transform active:scale-90"
              aria-label="Voltar para conferência"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-headline-sm font-bold text-on-surface">Checklist do veículo</h1>
              <p className="text-label-sm text-secondary">Checklist concluído</p>
            </div>
            <Link
              to="/recebimento-rc/$id/itens"
              params={{ id: demandId }}
              className="text-label-sm font-medium text-secondary"
            >
              Ir para itens
            </Link>
          </div>
        </div>

        <div className="mt-4 space-y-4 px-margin-mobile">
          <ChecklistSyncStatusBadge
            syncStatus={syncStatus}
            hasPendingSync={hasPendingSync}
            hasSyncError={hasSyncError}
          />
          <ChecklistResumoV2Card
            checklist={displayChecklist}
            isLoading={displayChecklist === undefined && checklist === null}
            defaultOpen
          />
          {canEditChecklist ? (
            <button
              type="button"
              onClick={() => {
                hapticLight();
                setIsEditing(true);
              }}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface text-label-md font-semibold text-on-surface touch-manipulation transition-transform active:scale-[0.98]"
            >
              <Pencil className="h-5 w-5" aria-hidden />
              Editar checklist
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter flex flex-col pb-safe-offset-4">
      <div className="sticky top-0 z-20 border-b border-outline-variant/60 bg-surface/95 backdrop-blur-md supports-[backdrop-filter]:bg-surface/80">
        <div className="flex items-center gap-3 px-margin-mobile py-3">
          <Link
            to={isComplete ? '/recebimento-rc/$id/itens' : '/recebimento-rc'}
            params={isComplete ? { id: demandId } : undefined}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant touch-manipulation transition-transform active:scale-90"
            aria-label={isComplete ? 'Voltar para conferência' : 'Voltar'}
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
          {isComplete && !isImpedido ? (
            <Link
              to="/recebimento-rc/$id/itens"
              params={{ id: demandId }}
              className="text-label-sm font-medium text-secondary"
            >
              Ir para itens
            </Link>
          ) : null}
        </div>
      </div>

      {isImpedido ? (
        <div className="mt-4 px-margin-mobile">
          <div className="rounded-lg border border-warning/30 bg-warning-container px-4 py-3">
            <p className="text-label-md font-semibold text-on-warning-container">
              Descarga suspensa
            </p>
            <p className="mt-1 text-body-sm text-on-warning-container/85">
              Não é possível registrar checklist enquanto a demanda estiver impedida.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-5 px-margin-mobile">
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
                <UppyCaptureModal
                  uppy={captureBySlot[slot.id].uppy}
                  open={captureBySlot[slot.id].isModalOpen}
                  onRequestClose={captureBySlot[slot.id].closeModal}
                  onPickFromDevice={captureBySlot[slot.id].pickFromDevice}
                  isProcessing={captureBySlot[slot.id].isProcessing}
                  fileInputRef={captureBySlot[slot.id].fileInputRef}
                  fileInputAccept={captureBySlot[slot.id].fileInputAccept}
                  onNativeFileChange={captureBySlot[slot.id].handleNativeFileChange}
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
              <UppyCaptureModal
                uppy={extrasPhotos.uppy}
                open={extrasPhotos.isModalOpen}
                onRequestClose={extrasPhotos.closeModal}
                onPickFromDevice={extrasPhotos.pickFromDevice}
                isProcessing={extrasPhotos.isProcessing}
                fileInputRef={extrasPhotos.fileInputRef}
                fileInputAccept={extrasPhotos.fileInputAccept}
                onNativeFileChange={extrasPhotos.handleNativeFileChange}
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-label-md font-semibold text-on-secondary touch-manipulation transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : isComplete ? (
              <ArrowRight className="h-5 w-5" aria-hidden />
            ) : (
              <Save className="h-5 w-5" aria-hidden />
            )}
            {isSubmitting
              ? 'Salvando e sincronizando...'
              : isComplete
                ? 'Atualizar e continuar'
                : 'Salvar e iniciar conferência'}
          </button>
        </form>
      )}
    </div>
  );
}
