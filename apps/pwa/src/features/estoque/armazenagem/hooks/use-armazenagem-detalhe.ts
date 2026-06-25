import { useCallback, useEffect, useState } from 'react';

import {
  concluirDemandaArmazenagem,
  fetchDemandaArmazenagem,
  iniciarDemandaArmazenagem,
  type DemandaArmazenagemDetalheApi,
} from '../lib/armazenagem-api';

export function useArmazenagemDetalhe(demandaId: string) {
  const [demanda, setDemanda] = useState<DemandaArmazenagemDetalheApi | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchDemandaArmazenagem(demandaId);
      setDemanda(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar demanda');
    } finally {
      setIsLoading(false);
    }
  }, [demandaId]);

  useEffect(() => {
    void load();
  }, [load]);

  const iniciar = useCallback(async () => {
    await iniciarDemandaArmazenagem(demandaId);
    await load();
  }, [demandaId, load]);

  const concluir = useCallback(async () => {
    await concluirDemandaArmazenagem(demandaId);
    await load();
  }, [demandaId, load]);

  return { demanda, isLoading, error, refresh: load, iniciar, concluir };
}
