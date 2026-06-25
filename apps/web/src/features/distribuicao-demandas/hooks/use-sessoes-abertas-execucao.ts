'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { listSessoes } from '@/features/sessao-operacao/lib/sessao-operacao-api';
import type { SessaoApi } from '@/features/sessao-operacao/types/sessao.api';

export function useSessoesAbertasParaExecucao() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [sessoesAbertas, setSessoesAbertas] = useState<SessaoApi[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!unidadeId) {
      setSessoesAbertas([]);
      return [];
    }

    setIsLoading(true);
    try {
      const response = await listSessoes({
        unidadeId,
        status: 'aberta',
        limit: 50,
      });
      setSessoesAbertas(response.items);
      return response.items;
    } catch {
      toast.error('Não foi possível carregar sessões abertas.');
      setSessoesAbertas([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { sessoesAbertas, isLoading, reload };
}
