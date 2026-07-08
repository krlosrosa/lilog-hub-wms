'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { cloneArvoreCondicoes } from '@/features/regras-wms/lib/arvore-condicoes-utils';
import {
  createRegraWms,
  deleteRegraWms,
  listRegrasWms,
  updateRegraWms,
} from '@/features/regras-wms/lib/regras-wms-api';
import { mapRegraProcessoToRegraWmsV2 } from '@/features/regras-wms/types/regra-wms.api';
import {
  REGRAS_WMS_PAGE_SIZE,
  type FiltroAtivo,
  type FiltroGatilho,
} from '@/features/regras-wms/types/regra-wms.schema';
import type { RegraWmsV2 } from '@/features/regras-wms/types/regra-wms-tree.schema';
import { ApiClientError } from '@/lib/api';

export function useRegrasWmsLista() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [regras, setRegras] = useState<RegraWmsV2[]>([]);
  const [totalFiltrados, setTotalFiltrados] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroGatilho, setFiltroGatilhoState] =
    useState<FiltroGatilho>('todos');
  const [filtroAtivo, setFiltroAtivoState] = useState<FiltroAtivo>('todos');
  const [busca, setBuscaState] = useState('');
  const [pagina, setPagina] = useState(1);

  const recarregar = useCallback(async () => {
    if (!unidadeId) {
      setRegras([]);
      setTotalFiltrados(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await listRegrasWms({
        unidadeId,
        page: pagina,
        limit: REGRAS_WMS_PAGE_SIZE,
        gatilho: filtroGatilho === 'todos' ? undefined : filtroGatilho,
        ativo:
          filtroAtivo === 'todos'
            ? undefined
            : filtroAtivo === 'ativo'
              ? true
              : false,
        search: busca.trim() || undefined,
      });

      setRegras(response.items.map(mapRegraProcessoToRegraWmsV2));
      setTotalFiltrados(response.total);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar as regras.';
      toast.error(message);
      setRegras([]);
      setTotalFiltrados(0);
    } finally {
      setIsLoading(false);
    }
  }, [busca, filtroAtivo, filtroGatilho, pagina, unidadeId]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(totalFiltrados / REGRAS_WMS_PAGE_SIZE),
  );
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = (paginaSegura - 1) * REGRAS_WMS_PAGE_SIZE;
  const itemsPagina = regras;

  const stats = useMemo(
    () => ({
      total: totalFiltrados,
      ativas: regras.filter((r) => r.ativo).length,
      inativas: regras.filter((r) => !r.ativo).length,
      conflitosPotenciais: 0,
    }),
    [regras, totalFiltrados],
  );

  const setFiltroGatilho = useCallback((value: FiltroGatilho) => {
    setFiltroGatilhoState(value);
    setPagina(1);
  }, []);

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
      const regra = regras.find((item) => item.id === id);
      if (!regra) {
        return;
      }

      try {
        await updateRegraWms(id, { ativo: !regra.ativo });
        toast.success(regra.ativo ? 'Regra desativada' : 'Regra ativada', {
          description: regra.nome,
        });
        await recarregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível alterar o status da regra.';
        toast.error(message);
      }
    },
    [recarregar, regras],
  );

  const duplicarRegra = useCallback(
    async (id: string) => {
      if (!unidadeId) {
        toast.error('Selecione uma unidade para continuar.');
        return;
      }

      const original = regras.find((item) => item.id === id);
      if (!original) {
        return;
      }

      try {
        await createRegraWms({
          unidadeId,
          nome: `${original.nome} (cópia)`,
          descricao: original.descricao,
          gatilho: original.gatilho,
          prioridade: original.prioridade,
          arvoreCondicoes: cloneArvoreCondicoes(original.arvoreCondicoes),
          acoes: [original.acao],
          ativo: false,
        });
        toast.success('Regra duplicada', {
          description: `${original.nome} (cópia)`,
        });
        await recarregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível duplicar a regra.';
        toast.error(message);
      }
    },
    [recarregar, regras, unidadeId],
  );

  const excluirRegra = useCallback(
    async (id: string) => {
      const regra = regras.find((item) => item.id === id);

      try {
        await deleteRegraWms(id);
        if (regra) {
          toast.success('Regra excluída', { description: regra.nome });
        }
        await recarregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível excluir a regra.';
        toast.error(message);
      }
    },
    [recarregar, regras],
  );

  return {
    regras,
    isLoading,
    filtroGatilho,
    setFiltroGatilho,
    filtroAtivo,
    setFiltroAtivo,
    busca,
    setBusca,
    pagina: paginaSegura,
    setPagina,
    totalPaginas,
    itemsPagina,
    itemsInicio,
    totalFiltrados,
    pageSize: REGRAS_WMS_PAGE_SIZE,
    stats,
    toggleAtivo,
    duplicarRegra,
    excluirRegra,
    recarregar,
  };
}
