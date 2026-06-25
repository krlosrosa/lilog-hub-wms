import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { hapticMedium } from '@/lib/haptics';
import { db } from '@/lib/offline/db';
import { usePhotoCapture, type CapturedPhoto } from '@/lib/offline/hooks/use-photo-capture';

import { DOCK_SELECT_OPTIONS } from '../data/devolucao-docks';
import { useDemandById } from './use-demand-by-id';
import {
  checklistSchema,
  type ChecklistForm,
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
  conditions: {
    limpeza: false,
    odor: false,
    estrutura: false,
    vedacao: false,
  },
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoErrors, setPhotoErrors] = useState<Partial<Record<ChecklistRequiredPhotoSlotId, string>>>(
    {}
  );

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

  useEffect(() => {
    if (!demand?.dock) return;
    const currentDock = form.getValues('dock');
    if (!currentDock) {
      form.setValue('dock', demand.dock, { shouldValidate: true });
    }
  }, [demand?.dock, demand?.id, form]);

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

  const toggleCondition = useCallback(
    (key: keyof ChecklistForm['conditions']) => {
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

    getAllPhotoIds();

    if (demand) {
      await db.devolucaoDemands.put({
        ...demand,
        dock: values.dock,
        paletesRecebidos: Number(values.paletesRecebidos.trim()),
        status: 'em_conferencia',
      });
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
      selectedDock,
      dockOptions: DOCK_SELECT_OPTIONS,
      paletesEsperados,
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
