'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  deleteRegraEnderecamento,
  listRegrasEnderecamento,
  mapRegraToListaItem,
  updateRegraEnderecamento,
} from '@/features/regras-enderecamento/lib/regra-enderecamento-api';
import type { RegraEnderecamentoCriterioTipoApi } from '@/features/regras-enderecamento/types/regra-enderecamento.api';
import type { RegraEnderecamentoListaItem } from '@/features/regras-enderecamento/types/regra-enderecamento.schema';
import { ApiClientError } from '@/lib/api';

const PAGE_SIZE = 20;

export function useRegrasEnderecamentoGestao() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regras, setRegras] = useState<RegraEnderecamentoListaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState('');
  const [criterioFiltro, setCriterioFiltro] = useState<
    RegraEnderecamentoCriterioTipoApi | 'todos'
  >('todos');
  const [ativoFiltro, setAtivoFiltro] = useState<'todos' | 'ativos' | 'inativos'>(
    'todos',
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [regraParaExcluir, setRegraParaExcluir] =
    useState<RegraEnderecamentoListaItem | null>(null);

  const recarregar = useCallback(async () => {
    if (!unidadeId) {
      setRegras([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await listRegrasEnderecamento({
        unidadeId,
        page: pagina,
        limit: PAGE_SIZE,
        search: busca.trim() || undefined,
        criterioTipo: criterioFiltro === 'todos' ? undefined : criterioFiltro,
        ativo:
          ativoFiltro === 'todos'
            ? undefined
            : ativoFiltro === 'ativos'
              ? true
              : false,
      });

      setRegras(response.items.map(mapRegraToListaItem));
      setTotal(response.total);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar as regras de endereçamento.';
      toast.error(message);
      setRegras([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [ativoFiltro, busca, criterioFiltro, pagina, unidadeId]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  useEffect(() => {
    setPagina(1);
  }, [busca, criterioFiltro, ativoFiltro, unidadeId]);

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const stats = useMemo(() => {
    return {
      total,
      ativas: regras.filter((item) => item.ativo).length,
      porGrupo: regras.filter((item) => item.criterioTipo === 'grupo').length,
      porProduto: regras.filter((item) => item.criterioTipo === 'produto').length,
    };
  }, [regras, total]);

  const abrirExclusao = useCallback((regra: RegraEnderecamentoListaItem) => {
    setRegraParaExcluir(regra);
    setDeleteDialogOpen(true);
  }, []);

  const fecharExclusao = useCallback((open: boolean) => {
    setDeleteDialogOpen(open);

    if (!open) {
      setRegraParaExcluir(null);
    }
  }, []);

  const alternarAtivo = useCallback(
    async (regra: RegraEnderecamentoListaItem) => {
      setIsSubmitting(true);

      try {
        await updateRegraEnderecamento(regra.id, { ativo: !regra.ativo });
        toast.success(
          regra.ativo ? 'Regra inativada com sucesso.' : 'Regra reativada com sucesso.',
        );
        await recarregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível alterar o status da regra.';
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [recarregar],
  );

  const confirmarExclusao = useCallback(async () => {
    if (!regraParaExcluir) {
      return;
    }

    setIsSubmitting(true);

    try {
      await deleteRegraEnderecamento(regraParaExcluir.id);
      toast.success('Regra excluída com sucesso.');
      setDeleteDialogOpen(false);
      setRegraParaExcluir(null);
      await recarregar();
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível excluir a regra.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [recarregar, regraParaExcluir]);

  return {
    unidadeId,
    isLoading,
    isSubmitting,
    regras,
    stats,
    busca,
    setBusca,
    criterioFiltro,
    setCriterioFiltro,
    ativoFiltro,
    setAtivoFiltro,
    pagina,
    setPagina,
    totalPaginas,
    total,
    pageSize: PAGE_SIZE,
    deleteDialogOpen,
    regraParaExcluir,
    abrirExclusao,
    fecharExclusao,
    alternarAtivo,
    confirmarExclusao,
    recarregar,
  };
}
