import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';
import { useNavigate } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { recebimentoV2Db } from '../local-db/db';
import type { SyncOperationRecord } from '../local-db/schema';
import {
  assertCanFinalizeConferencia,
  clearStaleEncerrarOps,
  hasActiveEncerrarOp,
} from '../lib/finalizar-sync-guard';
import { triggerAutoSyncIfPending } from '../services/auto-sync-v2.service';
import type { DivergenciaItem } from '../types/recebimento-v2.schema';
import { useChecklistV2 } from './use-checklist-v2';
import { useConferenciaV2 } from './use-conferencia-v2';
import { useDockDisplayLabelV2 } from './use-dock-display-label-v2';
import { useAvariaV2 } from './use-avaria-v2';
import { useParametrosConferenciaV2 } from './use-parametros-conferencia-v2';
import { useProcessV2 } from './use-process-v2';
import { useTemperaturaProdutoV2 } from './use-temperatura-produto-v2';

export function useFinalizarV2(demandId: string) {
  const navigate = useNavigate();
  const { getDivergencias } = useConferenciaV2(demandId);
  const { avarias } = useAvariaV2(demandId);
  const { checklist } = useChecklistV2(demandId);
  const { process } = useProcessV2(demandId);
  const parametrosConferencia = useParametrosConferenciaV2(process?.unidadeId);
  const { completo: temperaturasCompletas, preenchidas: temperaturasPreenchidas, totalEtapas: temperaturasTotal } =
    useTemperaturaProdutoV2(demandId);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const diff = Date.now() - start;
    return Math.max(1, Math.round(diff / 60000));
  }, [startedAt]);

  const dockRaw = checklist?.dock ?? process?.dock ?? '—';
  const dock = useDockDisplayLabelV2(dockRaw);

  const finalizar = useCallback(async (quantidadePaletes: number, teveSobreposicao: boolean) => {
    setIsFinalizing(true);
    setError(null);

    try {
      if (!Number.isInteger(quantidadePaletes) || quantidadePaletes <= 0) {
        throw new Error('Informe a quantidade de paletes recebidos');
      }

      await clearStaleEncerrarOps(demandId);
      await assertCanFinalizeConferencia(demandId);

      const nowMs = Date.now();
      const alreadyHasActiveEncerrar = await hasActiveEncerrarOp(demandId);

      if (!alreadyHasActiveEncerrar) {
        const opId = crypto.randomUUID();

        const syncOp: SyncOperationRecord = {
          id: opId,
          aggregateId: demandId,
          module: 'conference',
          opType: RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_ENCERRAR,
          sequence: nowMs,
          dependsOn: [],
          idempotencyKey: opId,
          payload: {
            demandId,
            encerradoAt: new Date().toISOString(),
            dock,
            quantidadePaletes,
            teveSobreposicaoCarga: teveSobreposicao,
          },
          attachmentIds: [],
          status: 'pending',
          attempts: 0,
          createdAt: nowMs,
          updatedAt: nowMs,
        };

        await recebimentoV2Db.transaction(
          'rw',
          [recebimentoV2Db.syncOperations, recebimentoV2Db.processes],
          async () => {
            await recebimentoV2Db.syncOperations.put(syncOp);
            await recebimentoV2Db.processes.update(demandId, {
              status: 'completed',
              errorMessage: undefined,
              updatedAt: nowMs,
            });
          },
        );
      } else {
        await recebimentoV2Db.processes.update(demandId, {
          status: 'completed',
          errorMessage: undefined,
          updatedAt: nowMs,
        });
      }

      setShowConfirmModal(false);
      triggerAutoSyncIfPending(demandId);
      await navigate({ to: '/recebimento-v2' });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao finalizar conferência';
      setError(message);
      toast.error(message);
    } finally {
      setIsFinalizing(false);
    }
  }, [demandId, dock, navigate]);

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
    temperaturasCompletas,
    temperaturasPreenchidas,
    temperaturasTotal,
  };
}

export type { DivergenciaItem };

