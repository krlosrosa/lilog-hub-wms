import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';

import { useAuth } from '@/features/auth';
import { isChecklistComplete } from '@/features/recebimento-v2/lib/is-checklist-complete';
import { recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';
import type { ChecklistFormV2 } from '@/features/recebimento-v2/types/recebimento-v2.schema';
import type { ChecklistPhotoIds } from '@/features/recebimento-v2/hooks/use-checklist-v2';

import { useConferenceExecutorV3 } from '../context/conference-executor.context';

export type { ChecklistPhotoIds };

export function useChecklistV3(demandId: string) {
  const { user } = useAuth();
  const { executor } = useConferenceExecutorV3();

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
    ) => {
      await executor.salvarChecklist(
        demandId,
        form,
        dockId,
        dockLabel,
        photoIds,
        responsavelId ?? user?.funcionarioId ?? undefined,
      );
    },
    [demandId, executor, user?.funcionarioId],
  );

  return {
    saveChecklist,
    checklist,
    isComplete,
    isLoading: checklist === undefined,
  };
}
