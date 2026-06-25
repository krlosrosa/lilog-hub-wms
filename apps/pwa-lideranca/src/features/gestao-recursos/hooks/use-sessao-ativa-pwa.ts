import { useCallback, useEffect, useState } from 'react';

import { listSessoesAbertas } from '@/features/gestao-recursos/api/gestao-recursos-api';
import type { SessaoApi } from '@/features/gestao-recursos/types/gestao-recursos.api';
import { useUnidade } from '@/features/unidade';

export function useSessaoAtivaPwa() {
  const { unidadeSelecionada } = useUnidade();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const [sessaoAtiva, setSessaoAtiva] = useState<SessaoApi | null>(null);
  const [sessoesAbertas, setSessoesAbertas] = useState<SessaoApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!unidadeId) {
      setSessaoAtiva(null);
      setSessoesAbertas([]);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await listSessoesAbertas(unidadeId);
      setSessoesAbertas(response.items);

      if (response.items.length === 0) {
        setSessaoAtiva(null);
        return;
      }

      setSessaoAtiva((current) => {
        if (current && response.items.some((item) => item.id === current.id)) {
          return current;
        }
        return response.items[0] ?? null;
      });
    } catch (error) {
      setSessaoAtiva(null);
      setSessoesAbertas([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar a sessão ativa.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId]);

  const selectSessao = useCallback((sessaoId: string) => {
    setSessaoAtiva((current) => {
      const found = sessoesAbertas.find((item) => item.id === sessaoId);
      return found ?? current;
    });
  }, [sessoesAbertas]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    unidadeId,
    unidadeNome: unidadeSelecionada?.nome ?? null,
    sessaoAtiva,
    sessoesAbertas,
    isLoading,
    errorMessage,
    semUnidade: !unidadeId,
    semSessaoAberta: Boolean(unidadeId && !isLoading && !sessaoAtiva),
    reload,
    selectSessao,
  };
}
