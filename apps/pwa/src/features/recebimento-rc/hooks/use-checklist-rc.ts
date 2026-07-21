import { useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { useAuth } from '@/features/auth';
import { countChecklistPhotoMediaIds, normalizeTempBau } from '@/features/recebimento-v2/lib/checklist-sync-payload';
import type { ChecklistPhotoMediaIds, ChecklistRecord } from '@/features/recebimento-v2/local-db/schema';
import { recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';
import type { ChecklistFormV2 } from '@/features/recebimento-v2/types/recebimento-v2.schema';
import {
  useChecklistReplicache,
  useReplicache,
} from '@/lib/replicache/hooks';

import {
  isChecklistComplete,
  isChecklistCompleteRc,
  type LocalChecklistPhotoCounts,
} from '../lib/is-checklist-complete-rc';
import {
  persistRcChecklistForPhotoUpload,
  syncRcChecklistPhotos,
} from '../services/sync-checklist-photos-rc.service';

export interface ChecklistPhotoIds {
  lacre: string[];
  bauFechado: string[];
  bauAberto: string[];
  extras: string[];
}

export type RcChecklistSyncStatus = 'pending' | 'synced' | 'error' | 'none';

export function useLocalChecklistCompleteRc(demandId: string): boolean | undefined {
  const localChecklist = useLiveQuery(
    () => recebimentoV2Db.checklists.get(demandId),
    [demandId],
    null,
  );

  if (localChecklist === null) {
    return undefined;
  }

  return isChecklistComplete(localChecklist ?? undefined);
}

export interface UseChecklistRcResult {
  saveChecklist: (
    form: ChecklistFormV2,
    dockId: string,
    dockLabel: string,
    photoIds: ChecklistPhotoIds,
    responsavelId?: number,
  ) => Promise<void>;
  checklist: ReturnType<typeof useChecklistReplicache>;
  localChecklist: ChecklistRecord | undefined;
  isComplete: boolean;
  isLoading: boolean;
  syncStatus: RcChecklistSyncStatus;
  hasPendingSync: boolean;
  hasSyncError: boolean;
}

export function useChecklistRc(
  preRecebimentoId: string,
  localPhotoCounts?: LocalChecklistPhotoCounts,
): UseChecklistRcResult {
  const { user } = useAuth();
  const { rep, isReady } = useReplicache();
  const checklist = useChecklistReplicache(preRecebimentoId);
  const localChecklist = useLiveQuery(
    () => recebimentoV2Db.checklists.get(preRecebimentoId),
    [preRecebimentoId],
  );

  const syncStatus = useMemo((): RcChecklistSyncStatus => {
    if (!localChecklist) {
      return 'none';
    }

    return localChecklist.syncStatus;
  }, [localChecklist]);

  const hasPendingSync = syncStatus === 'pending';
  const hasSyncError = syncStatus === 'error';

  const isComplete = useMemo(() => {
    if (localChecklist && isChecklistComplete(localChecklist)) {
      return true;
    }

    return isChecklistCompleteRc(checklist, localPhotoCounts);
  }, [checklist, localChecklist, localPhotoCounts]);

  const saveChecklist = useCallback(
    async (
      form: ChecklistFormV2,
      dockId: string,
      dockLabel: string,
      photoIds: ChecklistPhotoIds,
      responsavelId?: number,
    ): Promise<void> => {
      if (!rep) {
        throw new Error('Replicache não está pronto');
      }

      const photoMediaIds: ChecklistPhotoMediaIds = {
        lacre: photoIds.lacre,
        bauFechado: photoIds.bauFechado,
        bauAberto: photoIds.bauAberto,
        extras: photoIds.extras,
      };

      const photoCount = countChecklistPhotoMediaIds(photoMediaIds);
      const tempBau = normalizeTempBau(form.tempBau);
      const resolvedResponsavelId = responsavelId ?? user?.funcionarioId ?? undefined;

      await rep.mutate.upsertChecklist({
        preRecebimentoId,
        dockId,
        dockLabel,
        lacre: form.lacre,
        tempBau: tempBau ?? null,
        conditions: form.conditions,
        observacoes: form.observacoes,
        photoCount,
        photoMediaIds,
        responsavelId: resolvedResponsavelId,
        clientChecklistId: crypto.randomUUID(),
      });

      await persistRcChecklistForPhotoUpload(preRecebimentoId, {
        dockId,
        dock: dockLabel || dockId,
        lacre: form.lacre,
        tempBau,
        conditions: form.conditions,
        observacoes: form.observacoes,
        responsavelId: resolvedResponsavelId,
        photoMediaIds,
      });

      await syncRcChecklistPhotos(rep, preRecebimentoId);
    },
    [rep, preRecebimentoId, user?.funcionarioId],
  );

  return {
    saveChecklist,
    checklist,
    localChecklist: localChecklist ?? undefined,
    isComplete,
    isLoading: !isReady,
    syncStatus,
    hasPendingSync,
    hasSyncError,
  };
}
