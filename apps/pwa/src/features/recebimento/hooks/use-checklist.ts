import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { hapticMedium } from '@/lib/haptics';
import {
  docasToOptions,
  loadUnitDocasFromDb,
  saveOfflineChecklistDraft,
  saveUnitDocasToDb,
} from '@/lib/offline/checklist-cache';
import { db } from '@/lib/offline/db';
import { ApiClientError, isApiConfigured } from '@/lib/offline/api-client';
import { usePhotoCapture, type CapturedPhoto } from '@/lib/offline/hooks/use-photo-capture';

import {
  checkinVeiculo,
  fetchAuthMe,
  fetchConferenciaContext,
  getRecebimentoByPreRecebimento,
  iniciarRecebimento,
  listDocas,
  saveChecklist,
} from '../lib/recebimento-api';
import {
  ensureConferenciaContext,
  saveConferenciaContextToDb,
  setConferenciaContextStore,
  updateDemandRecebimentoId,
} from '../lib/conferencia-context-store';
import { mapConferenciaContext } from '../lib/map-conferencia-itens';
import { uploadChecklistPhotos } from '../lib/upload-checklist-photos';
import { useDemandById } from './use-demand-by-id';
import {
  checklistSchema,
  type ChecklistForm,
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
  conditions: {
    limpeza: false,
    odor: false,
    estrutura: false,
    vedacao: false,
  },
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

export function useChecklist(demandId: string) {
  const navigate = useNavigate();
  const demand = useDemandById(demandId);
  const [showSuccess, setShowSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dockOptions, setDockOptions] = useState<{ value: string; label: string }[]>([]);
  const [photoErrors, setPhotoErrors] = useState<Partial<Record<ChecklistRequiredPhotoSlotId, string>>>(
    {}
  );

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

  useEffect(() => {
    const unidadeId = demand?.unidadeId;
    if (!unidadeId) return;

    async function loadDocas() {
      if (isApiConfigured() && navigator.onLine) {
        try {
          const docas = await listDocas(unidadeId);
          if (docas.length > 0) {
            await saveUnitDocasToDb(unidadeId, docas);
            setDockOptions(docasToOptions(docas));
            return;
          }
        } catch {
          // fallback para cache local
        }
      }

      const cached = await loadUnitDocasFromDb(unidadeId);
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
      ...lacrePhotos.getPhotoIds(),
      ...bauFechadoPhotos.getPhotoIds(),
      ...bauAbertoPhotos.getPhotoIds(),
      ...extrasPhotos.getPhotoIds(),
    ];
  }, [lacrePhotos, bauFechadoPhotos, bauAbertoPhotos, extrasPhotos]);

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
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const cachedDemand = demand ?? (await db.demands.get(demandId));
      const dockLabel =
        dockOptions.find((option) => option.value === values.dock)?.label ??
        cachedDemand?.dock ??
        values.dock;

      let recebimentoId = cachedDemand?.recebimentoId ?? null;

      if (isApiConfigured() && !navigator.onLine) {
        const context = await ensureConferenciaContext(demandId);

        await saveOfflineChecklistDraft({
          demandId,
          form: values,
          dockId: values.dock,
          dockLabel,
          photoSlots: [
            { slotId: 'lacre', photoIds: lacrePhotos.getPhotoIds() },
            { slotId: 'bau-fechado', photoIds: bauFechadoPhotos.getPhotoIds() },
            { slotId: 'bau-aberto', photoIds: bauAbertoPhotos.getPhotoIds() },
            { slotId: 'extras', photoIds: extrasPhotos.getPhotoIds() },
          ],
          situacao: cachedDemand?.preRecebimentoSituacao ?? 'agendado',
          recebimentoId,
          responsavelId: readCachedFuncionarioId(),
          unidadeId: cachedDemand?.unidadeId ?? demand?.unidadeId ?? '',
        });

        if (cachedDemand) {
          await db.demands.put({
            ...cachedDemand,
            dock: dockLabel,
            status: 'em_conferencia',
            preRecebimentoSituacao: 'em_recebimento',
          });
        }

        if (context) {
          await saveConferenciaContextToDb(demandId, context);
        }
      } else if (isApiConfigured()) {
        const context = await fetchConferenciaContext(demandId);
        let situacao = context.situacao;

        if (situacao === 'agendado') {
          try {
            await checkinVeiculo(demandId);
            situacao = 'veiculo_chegou';
          } catch (error) {
            if (error instanceof ApiClientError && error.status === 400) {
              situacao = 'veiculo_chegou';
            } else {
              throw error;
            }
          }
        }

        recebimentoId =
          context.recebimentoId ?? recebimentoId ?? null;

        if (!recebimentoId && situacao === 'veiculo_chegou') {
          const me = await fetchAuthMe();
          if (!me?.funcionarioId) {
            throw new Error(
              'Usuário sem funcionário vinculado para iniciar recebimento',
            );
          }

          try {
            const recebimento = await iniciarRecebimento({
              preRecebimentoId: demandId,
              docaId: values.dock,
              responsavelId: me.funcionarioId,
            });
            recebimentoId = recebimento.id;
          } catch (error) {
            if (error instanceof ApiClientError && error.status === 409) {
              const existing = await getRecebimentoByPreRecebimento(demandId);
              recebimentoId = existing?.id ?? null;
            } else {
              throw error;
            }
          }
        }

        if (!recebimentoId) {
          throw new Error(
            'Não foi possível iniciar o recebimento. Verifique doca e permissões.',
          );
        }

        updateDemandRecebimentoId(demandId, recebimentoId);

        if (cachedDemand) {
          try {
            await db.demands.put({
              ...cachedDemand,
              dock: dockLabel,
              recebimentoId,
              status: 'em_conferencia',
              preRecebimentoSituacao: 'em_recebimento',
            });
          } catch {
            // não bloqueia navegação se o Dexie estiver em upgrade
          }
        }

        const resolvedRecebimentoId = recebimentoId;
        void (async () => {
          try {
            await uploadChecklistPhotos(resolvedRecebimentoId, [
              { slotId: 'lacre', photoIds: lacrePhotos.getPhotoIds() },
              { slotId: 'bau-fechado', photoIds: bauFechadoPhotos.getPhotoIds() },
              { slotId: 'bau-aberto', photoIds: bauAbertoPhotos.getPhotoIds() },
              { slotId: 'extras', photoIds: extrasPhotos.getPhotoIds() },
            ]);
          } catch {
            // não bloqueia navegação se upload das fotos falhar
          }

          try {
            await saveChecklist(resolvedRecebimentoId, {
              lacre: values.lacre || undefined,
              tempBau: values.tempBau,
              tempProduto: values.tempProd,
              conditions: values.conditions,
              observacoes: values.observacoes || undefined,
              photoCount: photoIds.length,
            });
          } catch {
            // não bloqueia navegação se persistência do checklist falhar
          }

          try {
            const refreshed = await fetchConferenciaContext(demandId);
            const mapped = mapConferenciaContext(refreshed);
            setConferenciaContextStore(demandId, mapped);
            await saveConferenciaContextToDb(demandId, mapped);
          } catch {
            // não bloqueia navegação se refresh do contexto falhar
          }
        })();
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
      requiredPhotoCount: CHECKLIST_REQUIRED_PHOTO_SLOTS.length,
      extraPhotoCount: extraPhotos.length,
      selectedDock,
      dockOptions,
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
