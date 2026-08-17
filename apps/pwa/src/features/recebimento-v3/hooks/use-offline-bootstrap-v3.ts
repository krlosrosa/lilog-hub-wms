import { useCallback, useRef, useState } from 'react';

import { prepareRecebimentoOffline } from '@/features/recebimento-v2/services/bootstrap.service';
import type { BootstrapProgress } from '@/features/recebimento-v2/types/recebimento-v2.schema';

export function useOfflineBootstrapV3() {
  const [progress, setProgress] = useState<BootstrapProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const activeDemandRef = useRef<string | null>(null);

  const prepare = useCallback(async (demandId: string, unidadeId: string) => {
    activeDemandRef.current = demandId;
    setIsPreparing(true);
    setError(null);
    setProgress(null);

    try {
      await prepareRecebimentoOffline(demandId, unidadeId, (nextProgress) => {
        if (activeDemandRef.current === demandId) {
          setProgress(nextProgress);
          if (nextProgress.error) {
            setError(nextProgress.error);
          }
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao baixar dados da demanda';
      if (activeDemandRef.current === demandId) {
        setError(message);
      }
      throw err;
    } finally {
      if (activeDemandRef.current === demandId) {
        activeDemandRef.current = null;
        setIsPreparing(false);
      }
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    prepare,
    progress,
    error,
    isPreparing,
    clearError,
  };
}
