import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { hapticMedium } from '@/lib/haptics';
import { listDocas } from '@/features/recebimento/lib/recebimento-api';
import { isApiConfigured } from '@/lib/offline/api-client';
import {
  docasToOptions,
  loadUnitDocasFromDb,
  saveUnitDocasToDb,
} from '@/lib/offline/checklist-cache';
import { db } from '@/lib/offline/db';
import { usePhotoCapture, type CapturedPhoto } from '@/lib/offline/hooks/use-photo-capture';
import { useUnidade } from '@/features/unidade';

import { isChecklistDevolucaoPendente } from '../lib/devolucao-api-mapper';
import {
  fetchParametrosDevolucaoConferencia,
  getCachedParametrosDevolucaoConferencia,
} from '../lib/devolucao-config';
import { syncDevolucaoChecklist, syncDevolucaoStatus } from '../lib/devolucao-sync';
import { uploadDevolucaoChecklistPhotos } from '../lib/upload-checklist-photos';
import { useDemandById, useDemandaDetalhe } from './use-demand-by-id';
import {
  buildDefaultChecklistConditions,
  checklistSchema,
  DEFAULT_CONDICOES_CHECKLIST,
  type ChecklistForm,
  type CondicaoChecklistItem,
} from '../types/devolucao.schema';

export const CHECKLIST_REQUIRED_PHOTO_SLOTS = [
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
  paletesRecebidos: '',
  tempBau: undefined,
  tempProd: undefined,
  conditions: {},
  observacoes: '',
};

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

export function useChecklist(demandId: string) {
  const navigate = useNavigate();
  const demand = useDemandById(demandId);
  const detalhe = useDemandaDetalhe(demandId);
  const { unidadeSelecionada } = useUnidade();
  const [showSuccess, setShowSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoErrors, setPhotoErrors] = useState<Partial<Record<ChecklistRequiredPhotoSlotId, string>>>(
    {}
  );
  const [condicoesChecklist, setCondicoesChecklist] = useState<CondicaoChecklistItem[]>(
    DEFAULT_CONDICOES_CHECKLIST
  );
  const conditionsInitializedRef = useRef(false);
  const [dockOptions, setDockOptions] = useState<Array<{ value: string; label: string }>>([]);

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
        bauFechado: bauFechadoPhotos,
        bauAberto: bauAbertoPhotos,
      }) as const,
    [bauFechadoPhotos, bauAbertoPhotos]
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

  const checklistPendente = isChecklistDevolucaoPendente({
    apiStatus: detalhe?.status,
    demandStatus: demand?.status,
  });

  useEffect(() => {
    if (!unidadeSelecionada?.id) return;

    const applyConfig = (condicoes: CondicaoChecklistItem[]) => {
      setCondicoesChecklist(condicoes);
      if (!conditionsInitializedRef.current) {
        form.setValue('conditions', buildDefaultChecklistConditions(condicoes));
        conditionsInitializedRef.current = true;
      }
    };

    const cached = getCachedParametrosDevolucaoConferencia(unidadeSelecionada.id);
    applyConfig(cached.condicoesChecklist);

    void fetchParametrosDevolucaoConferencia(unidadeSelecionada.id).then((parametros) => {
      applyConfig(parametros.condicoesChecklist);
    });
  }, [form, unidadeSelecionada?.id]);

  useEffect(() => {
    if (demand === undefined && detalhe === undefined) {
      return;
    }

    if (!checklistPendente && (demand != null || detalhe != null)) {
      navigate({ to: '/devolucao/$id/itens', params: { id: demandId }, replace: true });
    }
  }, [checklistPendente, demand, detalhe, demandId, navigate]);

  useEffect(() => {
    const unidadeId = unidadeSelecionada?.id ?? detalhe?.unidadeId;
    if (!unidadeId) return;

    async function loadDocas(unitId: string) {
      if (isApiConfigured() && navigator.onLine) {
        try {
          const docas = await listDocas(unitId);
          if (docas.length > 0) {
            await saveUnitDocasToDb(unitId, docas);
            setDockOptions(docasToOptions(docas));
            return;
          }
        } catch {
          // fallback para cache local
        }
      }

      const cached = await loadUnitDocasFromDb(unitId);
      if (cached.length > 0) {
        setDockOptions(docasToOptions(cached));
        return;
      }

      if (demand?.dock) {
        setDockOptions([{ value: demand.dock, label: demand.dock }]);
      }
    }

    void loadDocas(unidadeId);
  }, [demand?.dock, detalhe?.unidadeId, unidadeSelecionada?.id]);

  useEffect(() => {
    if (!demand?.dock) return;
    const currentDock = form.getValues('dock');
    if (!currentDock && dockOptions.length > 0) {
      const match = dockOptions.find((option) =>
        option.label.toLowerCase().includes(demand.dock.toLowerCase()),
      );
      if (match) {
        form.setValue('dock', match.value, { shouldValidate: true });
      }
    }
  }, [demand?.dock, demand?.id, dockOptions, form]);

  useEffect(() => {
    if (demand?.paletesRecebidos === undefined) return;
    const current = form.getValues('paletesRecebidos');
    if (!current) {
      form.setValue('paletesRecebidos', String(demand.paletesRecebidos), {
        shouldValidate: true,
      });
    }
  }, [demand?.paletesRecebidos, form]);

  const paletesEsperados = demand?.paletesEsperados ?? 0;

  const selectedDock = form.watch('dock');
  const selectedDockLabel =
    dockOptions.find((option) => option.value === selectedDock)?.label ?? selectedDock;

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

  const getAllPhotoIds = useCallback(() => {
    return [
      ...bauFechadoPhotos.getPhotoIds(),
      ...bauAbertoPhotos.getPhotoIds(),
      ...extrasPhotos.getPhotoIds(),
    ];
  }, [bauFechadoPhotos, bauAbertoPhotos, extrasPhotos]);

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

    const photoIds = getAllPhotoIds();
    const dockLabel =
      dockOptions.find((option) => option.value === values.dock)?.label ??
      demand?.dock ??
      values.dock;

    if (demand) {
      await db.devolucaoDemands.put({
        ...demand,
        dock: dockLabel,
        paletesRecebidos: Number(values.paletesRecebidos.trim()),
        status: 'em_conferencia',
      });
    }

    const routeId = demand?.routeId ?? demandId;
    if (unidadeSelecionada?.id) {
      try {
        await uploadDevolucaoChecklistPhotos(routeId, [
          { slotId: 'bau-fechado', photoIds: bauFechadoPhotos.getPhotoIds() },
          { slotId: 'bau-aberto', photoIds: bauAbertoPhotos.getPhotoIds() },
          { slotId: 'extras', photoIds: extrasPhotos.getPhotoIds() },
        ]);
      } catch {
        // mantém fotos locais se upload falhar
      }

      await syncDevolucaoChecklist(
        routeId,
        unidadeSelecionada.id,
        {
          dock: dockLabel,
          paletesRecebidos: Number(values.paletesRecebidos.trim()),
          tempBau: values.tempBau,
          tempProduto: values.tempProd,
          conditions: values.conditions,
          observacoes: values.observacoes?.trim() || undefined,
          photoCount: photoIds.length,
        },
        `Checklist ${demand?.id ?? demandId}`,
      );

      await syncDevolucaoStatus(
        routeId,
        unidadeSelecionada.id,
        {
          status: 'em_execucao',
          observacao: values.observacoes?.trim() || undefined,
        },
        `Status checklist ${demand?.id ?? demandId}`,
      );
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsSubmitting(false);
    setShowSuccess(true);
    setProgress(0);
    requestAnimationFrame(() => setProgress(100));
    window.setTimeout(() => {
      setShowSuccess(false);
      setProgress(0);
      navigate({ to: '/devolucao/$id/itens', params: { id: demandId } });
    }, 1500);
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
      errors: form.formState.errors,
      requiredPhotoSlots,
      extraPhotos,
      requiredPhotosComplete,
      photoErrors,
      requiredPhotoCount: CHECKLIST_REQUIRED_PHOTO_SLOTS.length,
      extraPhotoCount: extraPhotos.length,
      selectedDock: selectedDockLabel,
      dockOptions,
      paletesEsperados,
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
        bauFechado: bauFechadoPhotos.hiddenInput,
        bauAberto: bauAbertoPhotos.hiddenInput,
        extras: extrasPhotos.hiddenInput,
      },
    },
  };
}
