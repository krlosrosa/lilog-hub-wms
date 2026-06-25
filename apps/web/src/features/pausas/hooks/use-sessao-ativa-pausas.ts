'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  fetchFuncionariosElegiveis,
  fetchSessoesDoDia,
} from '@/features/pausas/lib/pausas-data';
import { listSessoes } from '@/features/sessao-operacao/lib/sessao-operacao-api';
import type { SessaoApi } from '@/features/sessao-operacao/types/sessao.api';
import type { SessaoFuncionarioApi } from '@/features/sessao-operacao/types/sessao.api';

export function useSessaoAtivaPausas() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [sessaoAtiva, setSessaoAtiva] = useState<SessaoApi | null>(null);
  const [sessoesAbertas, setSessoesAbertas] = useState<SessaoApi[]>([]);
  const [funcionarios, setFuncionarios] = useState<SessaoFuncionarioApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!unidadeId) {
      setSessaoAtiva(null);
      setSessoesAbertas([]);
      setFuncionarios([]);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await listSessoes({
        unidadeId,
        status: 'aberta',
        limit: 50,
      });

      setSessoesAbertas(response.items);

      if (response.items.length === 0) {
        setSessaoAtiva(null);
        setFuncionarios([]);
        return;
      }

      const ativa = response.items[0];
      if (!ativa) {
        setSessaoAtiva(null);
        setFuncionarios([]);
        return;
      }

      setSessaoAtiva(ativa);
      const elegiveis = await fetchFuncionariosElegiveis(ativa.id);
      setFuncionarios(elegiveis);
    } catch {
      setSessaoAtiva(null);
      setFuncionarios([]);
      setErrorMessage('Não foi possível carregar a sessão ativa.');
      toast.error('Não foi possível carregar a sessão ativa.');
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId]);

  const selectSessao = useCallback(
    async (sessaoId: string) => {
      const sessao = sessoesAbertas.find((s) => s.id === sessaoId);
      if (!sessao) return;

      setIsLoading(true);
      try {
        setSessaoAtiva(sessao);
        const elegiveis = await fetchFuncionariosElegiveis(sessao.id);
        setFuncionarios(elegiveis);
      } catch {
        toast.error('Não foi possível carregar os funcionários da sessão.');
      } finally {
        setIsLoading(false);
      }
    },
    [sessoesAbertas],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    unidadeId,
    unidadeNome: unidadeSelecionada?.nome ?? null,
    sessaoAtiva,
    sessoesAbertas,
    funcionarios,
    isLoading,
    errorMessage,
    semUnidade: !unidadeId,
    semSessaoAberta: Boolean(unidadeId && !isLoading && !sessaoAtiva),
    reload,
    selectSessao,
  };
}

export function useSessoesDiaPausas() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [sessoes, setSessoes] = useState<SessaoApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!unidadeId) {
      setSessoes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const items = await fetchSessoesDoDia(unidadeId, ['aberta', 'encerrada']);
      setSessoes(items);
    } catch {
      toast.error('Não foi possível carregar as sessões do dia.');
      setSessoes([]);
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    unidadeId,
    sessoes,
    isLoading,
    semUnidade: !unidadeId,
    reload,
  };
}
