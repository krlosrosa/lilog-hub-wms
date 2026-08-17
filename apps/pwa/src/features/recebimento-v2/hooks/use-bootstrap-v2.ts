import { useCallback, useRef, useState } from 'react';

import { useUnidade } from '@/features/unidade';

import { prepareRecebimentoOffline } from '../services/bootstrap.service';
import type { BootstrapProgress } from '../types/recebimento-v2.schema';

export interface UseBootstrapV2Result {
  prepare: (demandId: string) => Promise<void>;
  preparingDemandId: string | null;
  progress: BootstrapProgress | null;
  isPreparing: boolean;
  error: string | null;
  clearError: () => void;
}

export function useBootstrapV2(): UseBootstrapV2Result {
  const { unidadeSelecionada } = useUnidade();
  const [preparingDemandId, setPreparingDemandId] = useState<string | null>(null);
  const [progress, setProgress] = useState<BootstrapProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeDemandRef = useRef<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const prepare = useCallback(
    async (demandId: string) => {
      const unidadeId = unidadeSelecionada?.id;
      if (!unidadeId) {
        setError('Unidade não selecionada');
        return;
      }

      activeDemandRef.current = demandId;
      setPreparingDemandId(demandId);
      setError(null);
      setProgress(null);

      try {
        await prepareRecebimentoOffline(demandId, unidadeId, (p) => {
          if (activeDemandRef.current === demandId) {
            setProgress(p);
            if (p.error) {
              setError(p.error);
            }
          }
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao preparar demanda';
        if (activeDemandRef.current === demandId) {
          setError(message);
        }
      } finally {
        if (activeDemandRef.current === demandId) {
          activeDemandRef.current = null;
          // Defer clearing so Dexie LiveQuery can update status before the next render
          setTimeout(() => setPreparingDemandId(null), 0);
        }
      }
    },
    [unidadeSelecionada?.id],
  );

  return {
    prepare,
    preparingDemandId,
    progress,
    isPreparing: preparingDemandId != null,
    error,
    clearError,
  };
}
