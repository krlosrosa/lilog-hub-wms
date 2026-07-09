import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { hapticMedium } from '@/lib/haptics';
import { useUnidade } from '@/features/unidade';
import {
  docasToOptions,
  findDockOptionValue,
  getChecklistDraft,
  loadUnitDocasFromDb,
  saveOfflineChecklistDraft,
  saveUnitDocasToDb,
  type DockOption,
} from '@/lib/offline/checklist-cache';
import { db } from '@/lib/offline/db';
import { isApiConfigured } from '@/lib/offline/api-client';
import { usePhotoCapture, type CapturedPhoto } from '@/lib/offline/hooks/use-photo-capture';

import {
  getRecebimentoByPreRecebimento,
  listDocas,
} from '../lib/recebimento-api';
import {
  ensureConferenciaContext,
  saveConferenciaContextToDb,
  setConferenciaContextStore,
  updateDemandRecebimentoId,
} from '../lib/conferencia-context-store';
import {
  fetchParametrosRecebimentoConferencia,
  getCachedParametrosRecebimentoConferencia,
} from '../lib/recebimento-config';
import { useDemandById } from './use-demand-by-id';
import {
  buildDefaultChecklistConditions,
  checklistSchema,
  DEFAULT_CONDICOES_CHECKLIST,
  type ChecklistForm,
  type CondicaoChecklistItem,
} from '../types/recebimento.schema';

export const CHECKLIST_REQUIRED_PHOTO_SLOTS = [
  {
    id: 'lacre',
    label: 'Foto do lacre',
    hint: 'Lacre visível e legível',
  },
  {
    id: 'bauFechado',
    label: 'Baú fechado',
    hint: 'Portas fechadas por fora',
  },
  {
    id: 'bauAberto',
    label: 'Baú aberto',
    hint: 'Interior do compartimento',
  },
] as const;

export type ChecklistRequiredPhotoSlotId =
  (typeof CHECKLIST_REQUIRED_PHOTO_SLOTS)[number]['id'];

const DEFAULT_VALUES: ChecklistForm = {
  dock: '',
  lacre: '',
  tempBau: undefined,
  tempProd: undefined,
  conditions: {},
  observacoes: '',
};

function readCachedFuncionarioId(): number | null {
  try {
    const raw = localStorage.getItem('lilog.auth.user');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { funcionarioId?: number | null };
    return parsed.funcionarioId ?? null;
  } catch {
    return null;
  }
}

function checklistPhotoRelatedId(demandId: string, slot: ChecklistRequiredPhotoSlotId | 'extras') {
  const suffix =
    slot === 'bauFechado' ? 'bau-fechado' : slot === 'bauAberto' ? 'bau-aberto' : slot;
  return `checklist-${demandId}-${suffix}`;
}

export type ChecklistPhotoSlotState = {
  id: ChecklistRequiredPhotoSlotId;
  label: string;
  hint: string;
  photos: CapturedPhoto[];
  capture: () => void;
  removePhoto: (photoId: number) => Promise<void>;
};

type PersistChecklistOfflineParams = {
  demandId: string;
  values: ChecklistForm;
  dockLabel: string;
  recebimentoId: string | null;
  cachedDemand: Awaited<ReturnType<typeof db.demands.get>>;
  unidadeId: string;
  lacrePhotoIds: number[];
  bauFechadoPhotoIds: number[];
  bauAbertoPhotoIds: number[];
  extrasPhotoIds: number[];
};

async function persistChecklistOffline({
  demandId,
  values,
  dockLabel,
  recebimentoId,
  cachedDemand,
  unidadeId,
  lacrePhotoIds,
  bauFechadoPhotoIds,
  bauAbertoPhotoIds,
  extrasPhotoIds,
}: PersistChecklistOfflineParams): Promise<void> {
  const context = await ensureConferenciaContext(demandId);

  await saveOfflineChecklistDraft({
    demandId,
    form: values,
    dockId: values.dock,
    dockLabel,
    photoSlots: [
      { slotId: 'lacre', photoIds: lacrePhotoIds },
      { slotId: 'bau-fechado', photoIds: bauFechadoPhotoIds },
      { slotId: 'bau-aberto', photoIds: bauAbertoPhotoIds },
      { slotId: 'extras', photoIds: extrasPhotoIds },
    ],
    situacao: cachedDemand?.preRecebimentoSituacao ?? 'agendado',
    recebimentoId,
    responsavelId: readCachedFuncionarioId(),
    unidadeId,
  });

  if (cachedDemand) {
    await db.demands.put({
      ...cachedDemand,
      dock: dockLabel,
      recebimentoId: recebimentoId ?? cachedDemand.recebimentoId,
      status: 'em_conferencia',
      preRecebimentoSituacao: 'em_conferencia',
    });
  }

  if (context) {
    const nextContext = recebimentoId
      ? { ...context, recebimentoId }
      : context;
    setConferenciaContextStore(demandId, nextContext);
    await saveConferenciaContextToDb(demandId, nextContext);
    if (recebimentoId) {
      updateDemandRecebimentoId(demandId, recebimentoId);
    }
  }
}

export function useChecklist(demandId: string) {
  const navigate = useNavigate();
  const demand = useDemandById(demandId);
  const { unidadeSelecionada } = useUnidade();
  const [showSuccess, setShowSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dockOptions, setDockOptions] = useState<DockOption[]>([]);
  const [photoErrors, setPhotoErrors] = useState<Partial<Record<ChecklistRequiredPhotoSlotId, string>>>(
    {}
  );
  const [condicoesChecklist, setCondicoesChecklist] = useState<CondicaoChecklistItem[]>(
    DEFAULT_CONDICOES_CHECKLIST,
  );
  const conditionsInitializedRef = useRef(false);

  const lacrePhotos = usePhotoCapture({
    relatedId: checklistPhotoRelatedId(demandId, 'lacre'),
  });
  const bauFechadoPhotos = usePhotoCapture({
    relatedId: checklistPhotoRelatedId(demandId, 'bauFechado'),
  });
  const bauAbertoPhotos = usePhotoCapture({
    relatedId: checklistPhotoRelatedId(demandId, 'bauAberto'),
  });
  const extrasPhotos = usePhotoCapture({
    relatedId: checklistPhotoRelatedId(demandId, 'extras'),
  });

  const captureBySlot = useMemo(
    () =>
      ({
        lacre: lacrePhotos,
        bauFechado: bauFechadoPhotos,
        bauAberto: bauAbertoPhotos,
      }) as const,
    [lacrePhotos, bauFechadoPhotos, bauAbertoPhotos]
  );

  const requiredPhotoSlots: ChecklistPhotoSlotState[] = useMemo(
    () =>
      CHECKLIST_REQUIRED_PHOTO_SLOTS.map((slot) => ({
        id: slot.id,
        label: slot.label,
        hint: slot.hint,
        photos: captureBySlot[slot.id].photos,
        capture: captureBySlot[slot.id].capture,
        removePhoto: captureBySlot[slot.id].remove,
      })),
    [captureBySlot]
  );

  const requiredPhotosComplete = requiredPhotoSlots.every((slot) => slot.photos.length > 0);

  const extraPhotos = useMemo(
    () => [...extrasPhotos.photos].sort((a, b) => b.createdAt - a.createdAt),
    [extrasPhotos.photos]
  );

  const form = useForm<ChecklistForm>({
    resolver: zodResolver(checklistSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    void ensureConferenciaContext(demandId);
  }, [demandId]);

  const checklistDone =
    demand?.preRecebimentoSituacao === 'em_conferencia' ||
    demand?.preRecebimentoSituacao === 'conferido' ||
    demand?.pendingOfflineSync === true;

  useEffect(() => {
    if (demand === undefined) return;
    if (checklistDone && demand != null) {
      navigate({ to: '/recebimento/$id/itens', params: { id: demandId }, replace: true });
    }
  }, [checklistDone, demand, demandId, navigate]);

  useEffect(() => {
    const unidadeId = unidadeSelecionada?.id ?? demand?.unidadeId;
    if (!unidadeId) return;

    const applyConfig = (condicoes: CondicaoChecklistItem[]) => {
      setCondicoesChecklist(condicoes);
      if (!conditionsInitializedRef.current) {
        form.setValue('conditions', buildDefaultChecklistConditions(condicoes));
        conditionsInitializedRef.current = true;
      }
    };

    const cached = getCachedParametrosRecebimentoConferencia(unidadeId);
    applyConfig(cached.condicoesChecklist);

    void fetchParametrosRecebimentoConferencia(unidadeId).then((parametros) => {
      applyConfig(parametros.condicoesChecklist);
    });
  }, [demand?.unidadeId, form, unidadeSelecionada?.id]);

  useEffect(() => {
    const unidadeId = demand?.unidadeId;
    if (!unidadeId) return;

    const resolvedUnidadeId = unidadeId;

    async function loadDocas() {
      if (isApiConfigured() && navigator.onLine) {
        try {
          const docas = await listDocas(resolvedUnidadeId);
          if (docas.length > 0) {
            await saveUnitDocasToDb(resolvedUnidadeId, docas);
            setDockOptions(docasToOptions(docas));
            return;
          }
        } catch {
          // fallback para cache local
        }
      }

      const cached = await loadUnitDocasFromDb(resolvedUnidadeId);
      if (cached.length > 0) {
        setDockOptions(docasToOptions(cached));
        return;
      }

      if (demand?.dock) {
        setDockOptions([{ value: demand.dock, label: demand.dock }]);
      }
    }

    void loadDocas();
  }, [demand?.dock, demand?.unidadeId]);

  useEffect(() => {
    if (dockOptions.length === 0) return;

    const currentDock = form.getValues('dock');
    if (currentDock) return;

    async function preselectDock() {
      const draft = await getChecklistDraft(demandId);
      if (draft?.dockId && dockOptions.some((option) => option.value === draft.dockId)) {
        form.setValue('dock', draft.dockId, { shouldValidate: true });
        return;
      }

      if (demand?.recebimentoId && isApiConfigured() && navigator.onLine) {
        try {
          const recebimento = await getRecebimentoByPreRecebimento(demandId);
          if (
            recebimento?.docaId &&
            dockOptions.some((option) => option.value === recebimento.docaId)
          ) {
            form.setValue('dock', recebimento.docaId, { shouldValidate: true });
            return;
          }
        } catch {
          // segue para demais fontes de doca
        }
      }

      const context = await ensureConferenciaContext(demandId);
      const contextMatch = findDockOptionValue(context?.dock, dockOptions);
      if (contextMatch) {
        form.setValue('dock', contextMatch, { shouldValidate: true });
        return;
      }

      const demandMatch = findDockOptionValue(demand?.dock, dockOptions);
      if (demandMatch) {
        form.setValue('dock', demandMatch, { shouldValidate: true });
      }
    }

    void preselectDock();
  }, [demand?.dock, demand?.id, demand?.recebimentoId, demandId, dockOptions, form]);

  const selectedDock = form.watch('dock');

  const toggleCondition = useCallback(
    (key: string) => {
      const current = form.getValues('conditions');
      form.setValue('conditions', {
        ...current,
        [key]: !current[key],
      });
    },
    [form]
  );

  const validatePhotos = useCallback(() => {
    const nextErrors: Partial<Record<ChecklistRequiredPhotoSlotId, string>> = {};
    for (const slot of requiredPhotoSlots) {
      if (slot.photos.length === 0) {
        nextErrors[slot.id] = 'Foto obrigatória';
      }
    }
    setPhotoErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [requiredPhotoSlots]);

  useEffect(() => {
    setPhotoErrors((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      const next = { ...prev };
      let changed = false;
      for (const slot of requiredPhotoSlots) {
        if (next[slot.id] && slot.photos.length > 0) {
          delete next[slot.id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [requiredPhotoSlots]);

  const handleSave = form.handleSubmit(async (values) => {
    if (!validatePhotos()) {
      hapticMedium();
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const cachedDemand = demand ?? (await db.demands.get(demandId));
      const dockLabel =
        dockOptions.find((option) => option.value === values.dock)?.label ??
        cachedDemand?.dock ??
        values.dock;

      const recebimentoId = cachedDemand?.recebimentoId ?? null;
      const unidadeId = cachedDemand?.unidadeId ?? demand?.unidadeId ?? '';
      const offlineParams: PersistChecklistOfflineParams = {
        demandId,
        values,
        dockLabel,
        recebimentoId,
        cachedDemand,
        unidadeId,
        lacrePhotoIds: lacrePhotos.getPhotoIds(),
        bauFechadoPhotoIds: bauFechadoPhotos.getPhotoIds(),
        bauAbertoPhotoIds: bauAbertoPhotos.getPhotoIds(),
        extrasPhotoIds: extrasPhotos.getPhotoIds(),
      };

      if (isApiConfigured()) {
        if (
          cachedDemand?.preRecebimentoSituacao === 'agendado' ||
          cachedDemand?.preRecebimentoSituacao === 'aguardando'
        ) {
          throw new Error(
            'Carga ainda não liberada para conferência no painel web.',
          );
        }

        await persistChecklistOffline(offlineParams);
      } else if (cachedDemand) {
        try {
          await db.demands.put({ ...cachedDemand, dock: dockLabel });
        } catch {
          // offline: segue mesmo se cache local falhar
        }
      }

      setShowSuccess(true);
      setProgress(0);
      requestAnimationFrame(() => setProgress(100));

      window.setTimeout(() => {
        setShowSuccess(false);
        setProgress(0);
        navigate({ to: '/recebimento/$id/itens', params: { id: demandId } });
      }, 800);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Falha ao salvar checklist',
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  const clearSlotError = useCallback((slotId: ChecklistRequiredPhotoSlotId) => {
    setPhotoErrors((prev) => {
      if (!prev[slotId]) return prev;
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  }, []);

  return {
    state: {
      demandId,
      demand,
      form,
      checked: form.watch('conditions'),
      showSuccess,
      progress,
      isSubmitting,
      submitError,
      errors: form.formState.errors,
      requiredPhotoSlots,
      extraPhotos,
      requiredPhotosComplete,
      photoErrors,
      photoCaptureError:
        lacrePhotos.captureError ??
        bauFechadoPhotos.captureError ??
        bauAbertoPhotos.captureError ??
        extrasPhotos.captureError ??
        null,
      isProcessingPhoto:
        lacrePhotos.isProcessing ||
        bauFechadoPhotos.isProcessing ||
        bauAbertoPhotos.isProcessing ||
        extrasPhotos.isProcessing,
      requiredPhotoCount: CHECKLIST_REQUIRED_PHOTO_SLOTS.length,
      extraPhotoCount: extraPhotos.length,
      selectedDock,
      dockOptions,
      condicoesChecklist,
    },
    actions: {
      toggleCondition,
      handleSave,
      register: form.register,
      captureExtra: extrasPhotos.capture,
      removeExtraPhoto: extrasPhotos.remove,
      clearSlotError,
      photoHiddenInputs: {
        lacre: lacrePhotos.hiddenInput,
        bauFechado: bauFechadoPhotos.hiddenInput,
        bauAberto: bauAbertoPhotos.hiddenInput,
        extras: extrasPhotos.hiddenInput,
      },
    },
  };
}
