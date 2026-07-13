import { useCallback, useEffect, useMemo, useState } from 'react';

import { listSessoesAbertas } from '@/features/gestao-recursos/api/gestao-recursos-api';
import {
  buildSessaoAtivaStorageKey,
  filterSessoesPorArea,
  resolveSessaoAtivaDefault,
  writeStoredSessaoId,
} from '@/features/gestao-recursos/lib/resolve-sessao-ativa-default';
import type { SessaoApi } from '@/features/gestao-recursos/types/gestao-recursos.api';
import { useUnidade } from '@/features/unidade';

export type UseSessaoAtivaPwaOptions = {
  /** Restringe sessões visíveis e o default à área da equipe (ex.: recebimento). */
  equipeArea?: string;
  /** Persiste a última sessão escolhida por unidade. */
  storageKey?: string;
};

export function useSessaoAtivaPwa(options: UseSessaoAtivaPwaOptions = {}) {
  const { equipeArea, storageKey: storageKeyBase } = options;
  const { unidadeSelecionada } = useUnidade();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const storageKey = useMemo(
    () => buildSessaoAtivaStorageKey(storageKeyBase, unidadeId),
    [storageKeyBase, unidadeId],
  );

  const [sessaoAtiva, setSessaoAtiva] = useState<SessaoApi | null>(null);
  const [sessoesAbertas, setSessoesAbertas] = useState<SessaoApi[]>([]);
  const [todasSessoesAbertas, setTodasSessoesAbertas] = useState<SessaoApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!unidadeId) {
      setSessaoAtiva(null);
      setSessoesAbertas([]);
      setTodasSessoesAbertas([]);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await listSessoesAbertas(unidadeId);
      const allSessoes = response.items;
      const sessoesFiltradas = filterSessoesPorArea(allSessoes, equipeArea);
      setTodasSessoesAbertas(allSessoes);
      setSessoesAbertas(sessoesFiltradas);

      if (allSessoes.length === 0) {
        setSessaoAtiva(null);
        return;
      }

      setSessaoAtiva((current) => {
        const resolved = resolveSessaoAtivaDefault(allSessoes, current, {
          preferArea: equipeArea,
          storageKey,
        });

        if (resolved) {
          writeStoredSessaoId(storageKey, resolved.id);
        }

        return resolved;
      });
    } catch (error) {
      setSessaoAtiva(null);
      setSessoesAbertas([]);
      setTodasSessoesAbertas([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar a sessão ativa.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [equipeArea, storageKey, unidadeId]);

  const selectSessao = useCallback(
    (sessaoId: string) => {
      setSessaoAtiva((current) => {
        const found = sessoesAbertas.find((item) => item.id === sessaoId);
        if (!found) {
          return current;
        }

        writeStoredSessaoId(storageKey, found.id);
        return found;
      });
    },
    [sessoesAbertas, storageKey],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    unidadeId,
    unidadeNome: unidadeSelecionada?.nome ?? null,
    sessaoAtiva,
    sessoesAbertas,
    todasSessoesAbertas,
    isLoading,
    errorMessage,
    semUnidade: !unidadeId,
    semSessaoAberta: Boolean(unidadeId && !isLoading && !sessaoAtiva),
    reload,
    selectSessao,
  };
}
