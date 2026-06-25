import { useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useRef, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';
import { usePhotoCapture } from '@/lib/offline/hooks/use-photo-capture';

import {
  AREA_FILTER_LABELS,
  CHECKLIST_ITEMS,
} from '../data/passagem-bastao-seed';
import type {
  AreaFilter,
  ChecklistConformidade,
  ChecklistItemState,
} from '../types/passagem-bastao.schema';

export type ChecklistTurnoToast = {
  message: string;
  variant: 'success' | 'error';
};

const TOAST_DURATION_MS = 2500;
const EXTRAS_PHOTO_RELATED_ID = 'passagem-bastao-extras';

function createInitialItemStates(): Record<string, ChecklistItemState> {
  return CHECKLIST_ITEMS.reduce<Record<string, ChecklistItemState>>((acc, item) => {
    acc[item.id] = { conformidade: 'pendente', observacao: '' };
    return acc;
  }, {});
}

function countByConformidade(
  itemStates: Record<string, ChecklistItemState>,
  status: ChecklistConformidade,
): number {
  return Object.values(itemStates).filter((state) => state.conformidade === status).length;
}

export function useChecklistTurno() {
  const navigate = useNavigate();
  const [areaFilter, setAreaFilter] = useState<AreaFilter>('all');
  const [itemStates, setItemStates] = useState(createInitialItemStates);
  const [observacoesAdicionais, setObservacoesAdicionais] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ChecklistTurnoToast | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const extrasPhotos = usePhotoCapture({ relatedId: EXTRAS_PHOTO_RELATED_ID });

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, variant: ChecklistTurnoToast['variant']) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      setToast({ message, variant });
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
      }, TOAST_DURATION_MS);
    },
    [],
  );

  const conformeCount = useMemo(
    () => countByConformidade(itemStates, 'conforme'),
    [itemStates],
  );

  const naoConformeCount = useMemo(
    () => countByConformidade(itemStates, 'nao_conforme'),
    [itemStates],
  );

  const evaluatedCount = conformeCount + naoConformeCount;
  const pendingCount = CHECKLIST_ITEMS.length - evaluatedCount;
  const totalCount = CHECKLIST_ITEMS.length;

  const progressPercent = useMemo(
    () => (totalCount > 0 ? (evaluatedCount / totalCount) * 100 : 0),
    [evaluatedCount, totalCount],
  );

  const conformePercent = totalCount > 0 ? (conformeCount / totalCount) * 100 : 0;
  const naoConformePercent =
    totalCount > 0 ? (naoConformeCount / totalCount) * 100 : 0;

  const filteredItems = useMemo(() => {
    if (areaFilter === 'all') return CHECKLIST_ITEMS;
    return CHECKLIST_ITEMS.filter((item) => item.area === areaFilter);
  }, [areaFilter]);

  const areaFilters = useMemo(
    () =>
      (Object.keys(AREA_FILTER_LABELS) as AreaFilter[]).map((key) => ({
        id: key,
        label: AREA_FILTER_LABELS[key],
      })),
    [],
  );

  const setConformidade = useCallback(
    (itemId: string, conformidade: Exclude<ChecklistConformidade, 'pendente'>) => {
      setItemStates((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          conformidade,
        },
      }));
    },
    [],
  );

  const setObservacao = useCallback((itemId: string, value: string) => {
    setItemStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        observacao: value,
      },
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (evaluatedCount < totalCount) {
      hapticMedium();
      showToast(
        `Avalie todos os itens antes de finalizar (${pendingCount} pendente${pendingCount === 1 ? '' : 's'}).`,
        'error',
      );
      return;
    }

    setIsSubmitting(true);
    hapticMedium();
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsSubmitting(false);

    const summary =
      naoConformeCount > 0
        ? `Checklist salvo com ${naoConformeCount} não conformidade${naoConformeCount === 1 ? '' : 's'}.`
        : 'Checklist salvo. Todos os itens conformes.';
    showToast(`${summary} Redirecionando...`, 'success');

    window.setTimeout(() => {
      navigate({ to: '/passagem-bastao/resumo' });
    }, 800);
  }, [
    evaluatedCount,
    totalCount,
    pendingCount,
    naoConformeCount,
    navigate,
    showToast,
  ]);

  return {
    state: {
      areaFilter,
      areaFilters,
      filteredItems,
      itemStates,
      observacoesAdicionais,
      extrasPhotos: extrasPhotos.photos,
      conformeCount,
      naoConformeCount,
      evaluatedCount,
      pendingCount,
      totalCount,
      progressPercent,
      conformePercent,
      naoConformePercent,
      isSubmitting,
      toast,
    },
    actions: {
      setAreaFilter,
      setConformidade,
      setObservacao,
      setObservacoesAdicionais,
      captureExtraPhoto: extrasPhotos.capture,
      removeExtraPhoto: extrasPhotos.remove,
      extrasHiddenInput: extrasPhotos.hiddenInput,
      handleSubmit,
      dismissToast,
    },
  };
}
