import { useNavigate } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { DivergenciaItem } from '@/features/recebimento-v2/types/recebimento-v2.schema';
import { recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';
import {
  useAvariasReplicache,
  useChecklistReplicache,
  useReplicache,
} from '@/lib/replicache/hooks';

import { formatDockLabel } from '../lib/demand-view-ui';
import { mapAvariaViewsToDamageRecords } from '../lib/map-avaria-view-to-damage';
import {
  persistRcFinalizacaoPendente,
  scheduleRcFinalizacaoSync,
} from '../services/sync-checklist-photos-rc.service';
import { useRcServerSyncStatus } from './use-rc-server-sync-status';
import {
  hasRcReplicacheServerMismatch,
  isRcServerDemandConferido,
} from '../lib/rc-server-sync-status';
import { useConferenciaRc } from './use-conferencia-rc';
import { useDemandaRc } from './use-demanda-rc';
import { useParametrosConferenciaRc } from './use-parametros-conferencia-rc';
import { useTemperaturaRc } from './use-temperatura-rc';

export function useFinalizarRc(preRecebimentoId: string) {
  const navigate = useNavigate();
  const { rep } = useReplicache();
  const demanda = useDemandaRc(preRecebimentoId);
  const checklist = useChecklistReplicache(preRecebimentoId);
  const localChecklist = useLiveQuery(
    () => recebimentoV2Db.checklists.get(preRecebimentoId),
    [preRecebimentoId],
  );
  const parametrosConferencia = useParametrosConferenciaRc(demanda?.unidadeId);
  const { getDivergencias, conferences } = useConferenciaRc(preRecebimentoId);
  const {
    completo: temperaturasCompletas,
    preenchidas: temperaturasPreenchidas,
    totalEtapas: temperaturasTotal,
  } = useTemperaturaRc(preRecebimentoId);
  const { status: serverStatus, isOnline } = useRcServerSyncStatus(preRecebimentoId);

  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avariaViews = useAvariasReplicache(preRecebimentoId);
  const avarias = useMemo(
    () => mapAvariaViewsToDamageRecords(preRecebimentoId, avariaViews),
    [avariaViews, preRecebimentoId],
  );

  const divergencias = getDivergencias(parametrosConferencia.quantidadeModo);

  const naoConferidos = useMemo(
    () => divergencias.filter((d) => d.status === 'nao_conferido'),
    [divergencias],
  );

  const divergenciasAtivas = useMemo(
    () => divergencias.filter((d) => d.status === 'falta' || d.status === 'sobra'),
    [divergencias],
  );

  const startedAt = useMemo(() => {
    const firstConference = [...conferences]
      .filter((c) => !c.deletedAt)
      .sort(
        (a, b) =>
          new Date(a.conferidoAt).getTime() - new Date(b.conferidoAt).getTime(),
      )[0];
    return firstConference?.conferidoAt ?? checklist?.savedAt ?? null;
  }, [checklist?.savedAt, conferences]);

  const elapsedMinutes = useMemo(() => {
    if (!startedAt) return null;
    const start = new Date(startedAt).getTime();
    const diff = Date.now() - start;
    return Math.max(1, Math.round(diff / 60000));
  }, [startedAt]);

  const dockRaw = checklist?.dock ?? demanda?.dock ?? '—';
  const dock = formatDockLabel(dockRaw);

  const hasPendingFinalizationSync = Boolean(localChecklist?.pendingFinalizationSync);
  const hasLocalFinalizationAttempt = Boolean(
    localChecklist?.localFinalizationAttempted ||
      localChecklist?.pendingFinalizationSync ||
      localChecklist?.finalizacaoPayload,
  );
  const isServerFinalizationConfirmed = Boolean(
    localChecklist?.finalizationServerConfirmed,
  );
  const needsFinalizationSync =
    hasPendingFinalizationSync ||
    (hasLocalFinalizationAttempt &&
      !isServerFinalizationConfirmed &&
      Boolean(localChecklist?.finalizacaoPayload));

  const hasReplicacheServerMismatch = hasRcReplicacheServerMismatch({
    replicacheSituacao: demanda?.situacao,
    serverStatus,
  });

  const isServerConferidoWhenKnown =
    !isOnline ||
    !serverStatus ||
    Boolean(serverStatus.error) ||
    isRcServerDemandConferido(serverStatus);

  // Não confiar no conferido otimista do Replicache após finalização local
  // até o servidor confirmar (alinha PWA com o web).
  const isCompleted =
    demanda?.situacao === 'conferido' &&
    !needsFinalizationSync &&
    !hasReplicacheServerMismatch &&
    isServerConferidoWhenKnown &&
    (!hasLocalFinalizationAttempt || isServerFinalizationConfirmed);

  const showFinalizeButton = !isCompleted && !needsFinalizationSync;

  const finalizar = useCallback(
    async (quantidadePaletes: number, teveSobreposicao: boolean) => {
      setIsFinalizing(true);
      setError(null);

      try {
        if (!Number.isInteger(quantidadePaletes) || quantidadePaletes <= 0) {
          throw new Error('Informe a quantidade de paletes recebidos');
        }

        if (!rep) {
          throw new Error('Replicache não está pronto');
        }

        if (!temperaturasCompletas) {
          throw new Error(
            'Informe as temperaturas de início, meio e fim do baú antes de finalizar a conferência.',
          );
        }

        await rep.mutate.encerrarConferencia({
          preRecebimentoId,
          quantidadePaletes,
          teveSobreposicaoCarga: teveSobreposicao,
        });

        await persistRcFinalizacaoPendente(preRecebimentoId, {
          quantidadePaletes,
          teveSobreposicaoCarga: teveSobreposicao,
        });

        scheduleRcFinalizacaoSync(preRecebimentoId);

        setShowConfirmModal(false);
        await navigate({ to: '/recebimento-rc' });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao finalizar conferência';
        setError(message);
        toast.error(message);
      } finally {
        setIsFinalizing(false);
      }
    },
    [
      navigate,
      preRecebimentoId,
      rep,
      temperaturasCompletas,
    ],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    dock,
    divergencias,
    naoConferidos,
    divergenciasAtivas,
    avarias,
    elapsedMinutes,
    isFinalizing,
    showConfirmModal,
    setShowConfirmModal,
    finalizar,
    error,
    clearError,
    isCompleted,
    hasPendingFinalizationSync,
    needsFinalizationSync,
    hasReplicacheServerMismatch,
    serverStatus,
    showFinalizeButton,
    localChecklist: localChecklist ?? undefined,
    demanda,
    checklist,
    temperaturasCompletas,
    temperaturasPreenchidas,
    temperaturasTotal,
  };
}

export type { DivergenciaItem };
