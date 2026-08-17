import { useNavigate } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';
import {
  assertCanFinalizeConferencia,
  clearStaleEncerrarOps,
} from '@/features/recebimento-v2/lib/finalizar-sync-guard';
import { useDockDisplayLabelV2 } from '@/features/recebimento-v2/hooks/use-dock-display-label-v2';
import { useParametrosConferenciaV2 } from '@/features/recebimento-v2/hooks/use-parametros-conferencia-v2';
import { useProcessV2 } from '@/features/recebimento-v2/hooks/use-process-v2';
import { useTemperaturaProdutoV2 } from '@/features/recebimento-v2/hooks/use-temperatura-produto-v2';

import { useConferenceExecutorV3 } from '../context/conference-executor.context';
import { useConferenciaV3 } from './use-conferencia-v3';
import { useChecklistV3 } from './use-checklist-v3';
import { useAvariaV3 } from './use-avaria-v3';
import {
  finalizarOfflineV3,
  finalizarOnlineV3,
} from '../services/finalizar-offline-v3.service';
import type { FinalizationProgress } from '../types/conference-mode';
import { isBrowserOnline } from '../lib/network';

export type SyncPrecondition = {
  id: string;
  label: string;
  ok: boolean;
  message?: string;
};

export type ValidateBeforeSyncResult = {
  ok: boolean;
  errors: string[];
  preconditions: SyncPrecondition[];
};

export function useFinalizarV3(demandId: string) {
  const navigate = useNavigate();
  const { mode } = useConferenceExecutorV3();
  const { getDivergencias } = useConferenciaV3(demandId);
  const { avarias } = useAvariaV3(demandId);
  const { checklist } = useChecklistV3(demandId);
  const { process } = useProcessV2(demandId);
  const parametrosConferencia = useParametrosConferenciaV2(process?.unidadeId);
  const {
    completo: temperaturasCompletas,
    preenchidas: temperaturasPreenchidas,
    totalEtapas: temperaturasTotal,
  } = useTemperaturaProdutoV2(demandId);

  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<FinalizationProgress | null>(null);
  const [isOnline, setIsOnline] = useState(() => isBrowserOnline());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const conferenciasCount = useLiveQuery(async () => {
    return recebimentoV2Db.conferences
      .where('demandId')
      .equals(demandId)
      .and((c) => !c.deletedAt)
      .count();
  }, [demandId]);

  const divergencias = getDivergencias(parametrosConferencia.quantidadeModo);

  const naoConferidos = useMemo(
    () => divergencias.filter((d) => d.status === 'nao_conferido'),
    [divergencias],
  );

  const divergenciasAtivas = useMemo(
    () => divergencias.filter((d) => d.status === 'falta' || d.status === 'sobra'),
    [divergencias],
  );

  const startedAt = useLiveQuery(async () => {
    const firstConference = await recebimentoV2Db.conferences
      .where('demandId')
      .equals(demandId)
      .and((c) => !c.deletedAt)
      .sortBy('conferidoAt');
    return firstConference[0]?.conferidoAt ?? checklist?.savedAt ?? null;
  }, [demandId, checklist?.savedAt]);

  const elapsedMinutes = useMemo(() => {
    if (!startedAt) return null;
    const start = new Date(startedAt).getTime();
    return Math.max(1, Math.round((Date.now() - start) / 60000));
  }, [startedAt]);

  const dockRaw = checklist?.dock ?? process?.dock ?? '—';
  const dock = useDockDisplayLabelV2(dockRaw);

  const validateBeforeSync = useCallback(
    (quantidadePaletes: number): ValidateBeforeSyncResult => {
      const errors: string[] = [];
      const preconditions: SyncPrecondition[] = [];

      const onlineOk = isBrowserOnline();
      preconditions.push({
        id: 'connection',
        label: 'Conexão com a internet',
        ok: onlineOk,
        message: onlineOk ? undefined : 'Conecte-se à internet para enviar ao servidor',
      });
      if (!onlineOk) {
        errors.push('É necessário conexão com a internet para enviar ao servidor.');
      }

      const checklistOk = Boolean(checklist?.dock && checklist.conditions);
      preconditions.push({
        id: 'checklist',
        label: 'Checklist preenchido',
        ok: checklistOk,
        message: checklistOk ? undefined : 'Salve o checklist antes de enviar',
      });
      if (!checklistOk) {
        errors.push('Checklist não preenchido ou não salvo.');
      }

      preconditions.push({
        id: 'temperaturas',
        label: 'Temperaturas do baú',
        ok: temperaturasCompletas,
        message: temperaturasCompletas
          ? undefined
          : 'Informe as temperaturas de início, meio e fim do baú',
      });
      if (!temperaturasCompletas) {
        errors.push('Informe as temperaturas de início, meio e fim do baú.');
      }

      const hasConferencias = (conferenciasCount ?? 0) > 0;
      preconditions.push({
        id: 'conferencias',
        label: 'Itens conferidos',
        ok: hasConferencias,
        message: hasConferencias ? undefined : 'Conferir ao menos um item',
      });
      if (!hasConferencias) {
        errors.push('É necessário conferir ao menos um item.');
      }

      const paletesOk = Number.isInteger(quantidadePaletes) && quantidadePaletes > 0;
      preconditions.push({
        id: 'paletes',
        label: 'Quantidade de paletes',
        ok: paletesOk,
        message: paletesOk ? undefined : 'Informe a quantidade de paletes recebidos',
      });
      if (!paletesOk) {
        errors.push('Informe a quantidade de paletes recebidos (número inteiro maior que zero).');
      }

      return {
        ok: errors.length === 0,
        errors,
        preconditions,
      };
    },
    [checklist, conferenciasCount, temperaturasCompletas],
  );

  const finalizar = useCallback(
    async (quantidadePaletes: number, teveSobreposicao: boolean) => {
      setIsFinalizing(true);
      setError(null);
      setProgress(null);

      try {
        if (mode === 'online') {
          if (!Number.isInteger(quantidadePaletes) || quantidadePaletes <= 0) {
            throw new Error('Informe a quantidade de paletes recebidos');
          }
          await clearStaleEncerrarOps(demandId);
          await assertCanFinalizeConferencia(demandId);
          setProgress({ step: 'submit_conference', label: 'Enviando conferência' });
          await finalizarOnlineV3({
            demandId,
            quantidadePaletes,
            teveSobreposicaoCarga: teveSobreposicao,
            dock,
          });
        } else {
          const validation = validateBeforeSync(quantidadePaletes);
          if (!validation.ok) {
            throw new Error(validation.errors[0] ?? 'Validação falhou');
          }

          await finalizarOfflineV3({
            demandId,
            quantidadePaletes,
            teveSobreposicaoCarga: teveSobreposicao,
            dock,
            onProgress: setProgress,
          });
        }

        toast.success('Conferência finalizada com sucesso');
        await navigate({ to: '/recebimento-v3/' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao finalizar conferência';
        setError(message);
        toast.error(message);
      } finally {
        setIsFinalizing(false);
      }
    },
    [demandId, dock, mode, navigate, validateBeforeSync],
  );

  const canFinalize =
    mode === 'online'
      ? naoConferidos.length === 0 && temperaturasCompletas && Boolean(checklist)
      : isOnline &&
        temperaturasCompletas &&
        Boolean(checklist) &&
        (conferenciasCount ?? 0) > 0;

  return {
    mode,
    finalizar,
    validateBeforeSync,
    divergencias,
    naoConferidos,
    divergenciasAtivas,
    avarias,
    checklist,
    process,
    parametrosConferencia,
    temperaturasCompletas,
    temperaturasPreenchidas,
    temperaturasTotal,
    conferenciasCount: conferenciasCount ?? 0,
    elapsedMinutes,
    dock,
    isOnline,
    isFinalizing,
    showConfirmModal,
    setShowConfirmModal,
    canFinalize,
    error,
    progress,
  };
}
