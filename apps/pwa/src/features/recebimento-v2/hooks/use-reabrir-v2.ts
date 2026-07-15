import { useCallback, useState } from 'react';

import { useNetworkStatus } from '@/lib/offline/hooks/use-network';

import {
  hasConferenciaBloqueadaIssues,
  REABRIR_CONFERENCIA_HINT,
  REABRIR_CONFERENCIA_SEM_PERMISSAO_HINT,
} from '../lib/sync-conferencia-bloqueada';
import { reabrirConferenciaV2 } from '../services/reabrir-conferencia-v2.service';
import { useProcessCapabilitiesV2 } from './use-process-capabilities-v2';
import { useProcessV2 } from './use-process-v2';
import type { UseSyncStatusV2Result } from './use-sync-status-v2';

export interface UseReabrirV2Result {
  needsReabrir: boolean;
  canReabrir: boolean;
  isReabrindo: boolean;
  reabrirHint: string | null;
  reabrirConferencia: () => Promise<boolean>;
}

export function useReabrirV2(
  demandId: string,
  syncStatus: Pick<UseSyncStatusV2Result, 'issueOperations'>,
): UseReabrirV2Result {
  const { isOnline } = useNetworkStatus();
  const { process } = useProcessV2(demandId);
  const { capabilities } = useProcessCapabilitiesV2(demandId);
  const [isReabrindo, setIsReabrindo] = useState(false);

  const needsReabrir = hasConferenciaBloqueadaIssues(syncStatus.issueOperations);
  const canReabrir =
    needsReabrir &&
    isOnline &&
    Boolean(process?.recebimentoId?.trim()) &&
    capabilities.canFinalizar;

  const reabrirHint = needsReabrir
    ? canReabrir
      ? REABRIR_CONFERENCIA_HINT
      : REABRIR_CONFERENCIA_SEM_PERMISSAO_HINT
    : null;

  const reabrirConferencia = useCallback(async (): Promise<boolean> => {
    if (!canReabrir) {
      return false;
    }

    setIsReabrindo(true);
    try {
      await reabrirConferenciaV2(demandId);
      return true;
    } finally {
      setIsReabrindo(false);
    }
  }, [canReabrir, demandId]);

  return {
    needsReabrir,
    canReabrir,
    isReabrindo,
    reabrirHint,
    reabrirConferencia,
  };
}
