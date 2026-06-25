'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  atualizarConfiguracaoOperacional,
  deletarConfiguracaoOperacional,
  duplicarConfiguracaoOperacional,
  listarConfiguracoesOperacionais,
} from '@/features/config-operacional/lib/configuracao-operacional-api';
import type { ConfiguracaoOperacionalApi } from '@/features/config-operacional/types/configuracao-operacional.api';
import {
  PRODUTIVIDADE_CATEGORIA,
  PRODUTIVIDADE_DOMINIO,
} from '@/features/config-operacional/types/configuracao-operacional.api';
import {
  REGRAS_PRODUTIVIDADE_PAGE_SIZE,
  type FiltroAtivo,
} from '@/features/config-operacional/types/regra-produtividade-base.schema';
import type { EtapaProdutividade } from '@/features/config-operacional/types/regra-produtividade-tabs';
import { ApiClientError } from '@/lib/api';

type RegraProdutividadeBase = {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  padrao: boolean;
};

export function useRegrasProdutividadeListaCore<T extends RegraProdutividadeBase>(
  subtipo: EtapaProdutividade,
  mapFromApi: (item: ConfiguracaoOperacionalApi) => T,
) {
  const { unidadeSelecionada, isResolved } = useUnidadeContext();
  const [regras, setRegras] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [filtroAtivo, setFiltroAtivoState] = useState<FiltroAtivo>('todos');
  const [busca, setBuscaState] = useState('');
  const [pagina, setPagina] = useState(1);

  const carregarRegras = useCallback(async () => {
    if (!unidadeSelecionada) {
      setRegras([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    try {
      const response = await listarConfiguracoesOperacionais({
        unidadeId: unidadeSelecionada.id,
        dominio: PRODUTIVIDADE_DOMINIO,
        categoria: PRODUTIVIDADE_CATEGORIA,
        subtipo,
      });

      setRegras(response.items.map(mapFromApi));
    } catch (error) {
      setIsError(true);
      setRegras([]);

      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar as regras de produtividade.';

      toast.error('Erro ao carregar regras', { description: message });
    } finally {
      setIsLoading(false);
    }
  }, [mapFromApi, subtipo, unidadeSelecionada]);

  useEffect(() => {
    if (!isResolved) return;
    void carregarRegras();
  }, [carregarRegras, isResolved]);

  const filtrados = useMemo(() => {
    let items = regras;

    if (filtroAtivo === 'ativo') {
      items = items.filter((r) => r.ativo);
    } else if (filtroAtivo === 'inativo') {
      items = items.filter((r) => !r.ativo);
    }

    const term = busca.trim().toLowerCase();
    if (term) {
      items = items.filter(
        (r) =>
          r.nome.toLowerCase().includes(term) ||
          r.descricao?.toLowerCase().includes(term),
      );
    }

    return items;
  }, [regras, filtroAtivo, busca]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(filtrados.length / REGRAS_PRODUTIVIDADE_PAGE_SIZE),
  );
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = (paginaSegura - 1) * REGRAS_PRODUTIVIDADE_PAGE_SIZE;
  const itemsPagina = filtrados.slice(
    itemsInicio,
    itemsInicio + REGRAS_PRODUTIVIDADE_PAGE_SIZE,
  );

  const stats = useMemo(() => {
    const padrao = regras.find((r) => r.padrao);
    return {
      total: regras.length,
      ativas: regras.filter((r) => r.ativo).length,
      perfilPadrao: padrao?.nome ?? null,
    };
  }, [regras]);

  const setFiltroAtivo = useCallback((value: FiltroAtivo) => {
    setFiltroAtivoState(value);
    setPagina(1);
  }, []);

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
    setPagina(1);
  }, []);

  const toggleAtivo = useCallback(
    async (id: string) => {
      const regra = regras.find((r) => r.id === id);
      if (!regra) return;

      const novoAtivo = !regra.ativo;

      try {
        const updated = await atualizarConfiguracaoOperacional(id, {
          ativo: novoAtivo,
        });

        setRegras((prev) =>
          prev.map((r) => (r.id === id ? mapFromApi(updated) : r)),
        );

        toast.success(novoAtivo ? 'Regra ativada' : 'Regra desativada', {
          description: regra.nome,
        });
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível alterar o status da regra.';

        toast.error('Erro ao atualizar regra', { description: message });
      }
    },
    [mapFromApi, regras],
  );

  const duplicarRegra = useCallback(
    async (id: string) => {
      try {
        const copia = await duplicarConfiguracaoOperacional(id);
        const mapped = mapFromApi(copia);

        setRegras((prev) => [...prev, mapped]);
        toast.success('Regra duplicada', { description: mapped.nome });
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível duplicar a regra.';

        toast.error('Erro ao duplicar regra', { description: message });
      }
    },
    [mapFromApi],
  );

  const excluirRegra = useCallback(
    async (id: string) => {
      const regra = regras.find((r) => r.id === id);

      try {
        await deletarConfiguracaoOperacional(id);
        setRegras((prev) => prev.filter((r) => r.id !== id));

        if (regra) {
          toast.success('Regra excluída', { description: regra.nome });
        }
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível excluir a regra.';

        toast.error('Erro ao excluir regra', { description: message });
      }
    },
    [regras],
  );

  return {
    isLoading,
    isError,
    refetch: carregarRegras,
    filtroAtivo,
    setFiltroAtivo,
    busca,
    setBusca,
    pagina,
    setPagina,
    totalPaginas,
    itemsPagina,
    itemsInicio,
    totalFiltrados: filtrados.length,
    pageSize: REGRAS_PRODUTIVIDADE_PAGE_SIZE,
    stats,
    toggleAtivo,
    duplicarRegra,
    excluirRegra,
  };
}
