import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';

import { useAuth } from '@/features/auth';

import { buildChecklistSyncPayload, normalizeTempBau } from '../lib/checklist-sync-payload';
import { isChecklistComplete } from '../lib/is-checklist-complete';
import { recebimentoV2Db } from '../local-db/db';
import type { ChecklistPhotoMediaIds, ChecklistRecord, SyncOperationRecord } from '../local-db/schema';
import type { ChecklistFormV2 } from '../types/recebimento-v2.schema';

export interface ChecklistPhotoIds {
  lacre: string[];
  bauFechado: string[];
  bauAberto: string[];
  extras: string[];
}

export interface UseChecklistV2Result {
  saveChecklist: (
    form: ChecklistFormV2,
    dockId: string,
    dockLabel: string,
    photoIds: ChecklistPhotoIds,
    responsavelId?: number,
  ) => Promise<void>;
  checklist: ChecklistRecord | undefined;
  isComplete: boolean;
  isLoading: boolean;
}

export function useChecklistV2(demandId: string): UseChecklistV2Result {
  const { user } = useAuth();
  const checklist = useLiveQuery(
    () => recebimentoV2Db.checklists.get(demandId),
    [demandId],
  );

  const isComplete = isChecklistComplete(checklist);

  const saveChecklist = useCallback(
    async (
      form: ChecklistFormV2,
      dockId: string,
      dockLabel: string,
      photoIds: ChecklistPhotoIds,
      responsavelId?: number,
    ): Promise<void> => {
      const now = new Date().toISOString();
      const nowMs = Date.now();
      const opId = crypto.randomUUID();

      const existing = await recebimentoV2Db.checklists.get(demandId);
      const recordId = existing?.id ?? crypto.randomUUID();

      const photoMediaIds: ChecklistPhotoMediaIds = {
        lacre: photoIds.lacre,
        bauFechado: photoIds.bauFechado,
        bauAberto: photoIds.bauAberto,
        extras: photoIds.extras,
      };

      const allMediaIds = [
        ...photoIds.lacre,
        ...photoIds.bauFechado,
        ...photoIds.bauAberto,
        ...photoIds.extras,
      ];

      const tempBau = normalizeTempBau(form.tempBau);

      const resolvedResponsavelId = responsavelId ?? user?.funcionarioId ?? undefined;

      const record: ChecklistRecord = {
        demandId,
        id: recordId,
        dock: dockLabel || dockId,
        lacre: form.lacre,
        tempBau,
        conditions: form.conditions,
        observacoes: form.observacoes,
        responsavelId: resolvedResponsavelId,
        photoMediaIds,
        savedAt: now,
        syncStatus: 'pending',
        updatedAt: nowMs,
      };

      const syncOp: SyncOperationRecord = {
        id: opId,
        aggregateId: demandId,
        module: 'checklist',
        opType: RECEBIMENTO_V2_OP_TYPES.CHECKLIST_UPSERT,
        sequence: nowMs,
        dependsOn: [],
        idempotencyKey: opId,
        payload: buildChecklistSyncPayload({
          demandId,
          dockId,
          form,
          photoMediaIds,
          responsavelId: resolvedResponsavelId,
        }),
        attachmentIds: allMediaIds,
        status: 'pending',
        attempts: 0,
        createdAt: nowMs,
        updatedAt: nowMs,
      };

      await recebimentoV2Db.transaction(
        'rw',
        [recebimentoV2Db.checklists, recebimentoV2Db.syncOperations, recebimentoV2Db.processes],
        async () => {
          await recebimentoV2Db.checklists.put(record);
          await recebimentoV2Db.syncOperations.put(syncOp);
          await recebimentoV2Db.processes.update(demandId, {
            dock: dockLabel || dockId,
            status: 'working',
            updatedAt: nowMs,
          });
        },
      );
    },
    [demandId, user?.funcionarioId],
  );

  return {
    saveChecklist,
    checklist: checklist ?? undefined,
    isComplete,
    isLoading: checklist === undefined,
  };
}
