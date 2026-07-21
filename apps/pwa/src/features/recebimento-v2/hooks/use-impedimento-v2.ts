import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect } from 'react';

import { useAuth } from '@/features/auth';

import { deriveLifecycleFromStatus } from '../lib/sync-operation-lifecycle';
import { recebimentoV2Db } from '../local-db/db';
import type { ImpedimentoRecord, SyncOperationRecord } from '../local-db/schema';
import { triggerAutoSyncIfPending } from '../services/auto-sync-v2.service';
import { syncNowV2 } from '../services/auto-sync-v2.service';
import { getImpedimentoSyncState } from '../lib/impedimento-sync-state';
import {
  blockChecklistOpsDuringImpedimento,
  unblockChecklistOpsAfterRetomar,
} from '../lib/checklist-sync-impedimento';
import { useImpedimentoSyncState } from './use-impedimento-sync-state';

export interface RegistrarImpedimentoInput {
  tipo: string;
  descricao: string;
  mediaIds: string[];
}

export interface UseImpedimentoV2Result {
  registrarImpedimento: (input: RegistrarImpedimentoInput) => Promise<string>;
  retomarConferencia: () => Promise<void>;
  impedimento: ImpedimentoRecord | undefined;
  isImpedido: boolean;
  isLoading: boolean;
  canRetomar: boolean;
  retomarBlockingMessage: string | null;
}

export function useImpedimentoV2(demandId: string): UseImpedimentoV2Result {
  const { user } = useAuth();

  const impedimento = useLiveQuery(
    () =>
      recebimentoV2Db.impedimentos
        .where('demandId')
        .equals(demandId)
        .first(),
    [demandId],
  );

  const demand = useLiveQuery(
    () => recebimentoV2Db.demands.get(demandId),
    [demandId],
  );

  const isImpedido = demand?.situacao === 'impedido';

  useEffect(() => {
    if (isImpedido) {
      void blockChecklistOpsDuringImpedimento(demandId);
    }
  }, [demandId, isImpedido]);

  const registrarImpedimento = useCallback(
    async (input: RegistrarImpedimentoInput): Promise<string> => {
      if (!input.mediaIds.length) {
        throw new Error('Informe ao menos uma foto do impedimento');
      }

      if (!user?.funcionarioId) {
        throw new Error('Usuário sem vínculo de funcionário para registrar impedimento');
      }

      const now = new Date().toISOString();
      const nowMs = Date.now();
      const id = crypto.randomUUID();
      const opId = crypto.randomUUID();

      const record: ImpedimentoRecord = {
        id,
        demandId,
        tipo: input.tipo,
        descricao: input.descricao.trim(),
        mediaIds: input.mediaIds,
        registradoAt: now,
        syncStatus: 'pending',
        updatedAt: nowMs,
      };

      const syncOp: SyncOperationRecord = {
        id: opId,
        aggregateId: demandId,
        module: 'impedimento',
        opType: RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_SUSPENDER,
        sequence: nowMs,
        dependsOn: [],
        idempotencyKey: opId,
        payload: {
          impedimentoId: id,
          tipo: input.tipo,
          descricao: input.descricao.trim(),
          photoCount: input.mediaIds.length,
          mediaIds: input.mediaIds,
          registradoPorId: user?.funcionarioId,
        },
        attachmentIds: input.mediaIds,
        status: 'pending',
        lifecycleStatus: deriveLifecycleFromStatus('pending'),
        attempts: 0,
        createdAt: nowMs,
        updatedAt: nowMs,
      };

      await recebimentoV2Db.transaction(
        'rw',
        [
          recebimentoV2Db.impedimentos,
          recebimentoV2Db.syncOperations,
          recebimentoV2Db.processes,
          recebimentoV2Db.demands,
        ],
        async () => {
          await recebimentoV2Db.impedimentos.put(record);
          await recebimentoV2Db.syncOperations.put(syncOp);
          await recebimentoV2Db.demands.update(demandId, {
            situacao: 'impedido',
            status: 'impedido',
            updatedAt: nowMs,
          });
          await recebimentoV2Db.processes.update(demandId, {
            status: 'pendingSync',
            updatedAt: nowMs,
          });
        },
      );

      triggerAutoSyncIfPending(demandId);
      await blockChecklistOpsDuringImpedimento(demandId);
      return id;
    },
    [demandId, user?.funcionarioId],
  );

  const retomarConferencia = useCallback(async (): Promise<void> => {
    await syncNowV2(demandId, { manual: true });

    const syncState = await getImpedimentoSyncState(demandId);
    if (!syncState.canRetomar) {
      throw new Error(
        syncState.blockingMessage ??
          'Aguarde a sincronização do impedimento antes de retomar a conferência.',
      );
    }

    const nowMs = Date.now();
    const opId = crypto.randomUUID();

    const syncOp: SyncOperationRecord = {
      id: opId,
      aggregateId: demandId,
      module: 'impedimento',
      opType: RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_RETOMAR,
      sequence: nowMs,
      dependsOn: [],
      idempotencyKey: opId,
      payload: {
        preRecebimentoId: demandId,
      },
      attachmentIds: [],
      status: 'pending',
      lifecycleStatus: deriveLifecycleFromStatus('pending'),
      attempts: 0,
      createdAt: nowMs,
      updatedAt: nowMs,
    };

    await recebimentoV2Db.transaction(
      'rw',
      [recebimentoV2Db.syncOperations, recebimentoV2Db.processes, recebimentoV2Db.demands],
      async () => {
        await recebimentoV2Db.syncOperations.put(syncOp);
        await recebimentoV2Db.demands.update(demandId, {
          situacao: 'em_conferencia',
          status: 'em_conferencia',
          updatedAt: nowMs,
        });
        await recebimentoV2Db.processes.update(demandId, {
          status: 'working',
          updatedAt: nowMs,
        });
      },
    );

    await unblockChecklistOpsAfterRetomar(demandId);
    triggerAutoSyncIfPending(demandId);
  }, [demandId]);

  const syncState = useImpedimentoSyncState(demandId);

  return {
    registrarImpedimento,
    retomarConferencia,
    impedimento: impedimento ?? undefined,
    isImpedido,
    isLoading: impedimento === undefined && demand === undefined,
    canRetomar: isImpedido ? syncState.canRetomar : false,
    retomarBlockingMessage: isImpedido ? syncState.blockingMessage : null,
  };
}
