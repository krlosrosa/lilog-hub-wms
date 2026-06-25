'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { DocaDialogState } from '@/features/docas/components/doca-action-dialogs';
import {
  blockDoca,
  deleteDoca,
  listDocas,
  listOperacoesDoca,
  mapDocaToListaItem,
  setMaintenanceDoca,
  unblockDoca,
} from '@/features/docas/lib/docas-api';
import type { OperacaoDocaApi } from '@/features/docas/types/doca.api';
import type {
  DocaListaItem,
  DocaStats,
  FiltroDocaSituacao,
  FiltroDocaTipo,
} from '@/features/docas/types/docas.schema';
import { useUnidadeContext } from '@/contexts/unidade-context';
import { ApiClientError } from '@/lib/api';

const PAGE_SIZE = 10;

const EMPTY_STATS: DocaStats = {
  total: 0,
  disponivel: 0,
  ocupada: 0,
  reservada: 0,
  bloqueada: 0,
  manutencao: 0,
};

function computeStats(docas: DocaListaItem[]): DocaStats {
  return {
    total: docas.length,
    disponivel: docas.filter((d) => d.situacao === 'disponivel').length,
    ocupada: docas.filter((d) => d.situacao === 'ocupada').length,
    reservada: docas.filter((d) => d.situacao === 'reservada').length,
    bloqueada: docas.filter((d) => d.situacao === 'bloqueada').length,
    manutencao: docas.filter((d) => d.situacao === 'manutencao').length,
  };
}

export function useDocasLista() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [docas, setDocas] = useState<DocaListaItem[]>([]);
  const [operacoesAtivas, setOperacoesAtivas] = useState<OperacaoDocaApi[]>([]);
  const [stats, setStats] = useState<DocaStats>(EMPTY_STATS);
  const [filtroSituacao, setFiltroSituacaoState] =
    useState<FiltroDocaSituacao>('todos');
  const [filtroTipo, setFiltroTipoState] = useState<FiltroDocaTipo>('todos');
  const [busca, setBuscaState] = useState('');
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [dialogState, setDialogState] = useState<DocaDialogState>(null);

  const situacaoApi =
    filtroSituacao !== 'todos' ? filtroSituacao : undefined;
  const tipoApi = filtroTipo !== 'todos' ? filtroTipo : undefined;

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = total === 0 ? 0 : (paginaSegura - 1) * PAGE_SIZE + 1;

  const carregar = useCallback(async () => {
    setIsLoading(true);

    try {
      const [listResponse, operacoesResponse, statsResponse] = await Promise.all([
        listDocas({
          page: paginaSegura,
          limit: PAGE_SIZE,
          unidadeId,
          situacao: situacaoApi,
          tipo: tipoApi,
          search: busca,
        }),
        listOperacoesDoca({
          page: 1,
          limit: 5,
          situacao: 'em_execucao',
        }),
        listDocas({
          page: 1,
          limit: 100,
          unidadeId,
        }),
      ]);

      setDocas(listResponse.items.map(mapDocaToListaItem));
      setTotal(listResponse.total);
      setOperacoesAtivas(operacoesResponse.items);
      setStats(computeStats(statsResponse.items.map(mapDocaToListaItem)));
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar as docas';

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [paginaSegura, unidadeId, situacaoApi, tipoApi, busca]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const setFiltroSituacao = useCallback((value: FiltroDocaSituacao) => {
    setFiltroSituacaoState(value);
    setPagina(1);
  }, []);

  const setFiltroTipo = useCallback((value: FiltroDocaTipo) => {
    setFiltroTipoState(value);
    setPagina(1);
  }, []);

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
    setPagina(1);
  }, []);

  const closeDialog = useCallback(() => {
    if (!isSubmitting) {
      setDialogState(null);
    }
  }, [isSubmitting]);

  const openBlockDialog = useCallback((doca: DocaListaItem) => {
    setDialogState({
      type: 'block',
      docaId: doca.id,
      docaLabel: `${doca.codigo} — ${doca.nome}`,
    });
  }, []);

  const openUnblockDialog = useCallback((doca: DocaListaItem) => {
    setDialogState({
      type: 'unblock',
      docaId: doca.id,
      docaLabel: `${doca.codigo} — ${doca.nome}`,
    });
  }, []);

  const openMaintenanceDialog = useCallback((doca: DocaListaItem) => {
    setDialogState({
      type: 'maintenance',
      docaId: doca.id,
      docaLabel: `${doca.codigo} — ${doca.nome}`,
    });
  }, []);

  const openDeleteDialog = useCallback((doca: DocaListaItem) => {
    setDialogState({
      type: 'delete',
      docaId: doca.id,
      docaLabel: `${doca.codigo} — ${doca.nome}`,
    });
  }, []);

  const runAction = useCallback(
    async (action: () => Promise<unknown>, successMessage: string) => {
      setIsSubmitting(true);

      try {
        await action();
        toast.success(successMessage);
        setDialogState(null);
        await carregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível concluir a operação';

        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [carregar],
  );

  const confirmBlock = useCallback(
    (motivo?: string) => {
      if (dialogState?.type !== 'block') return;

      void runAction(
        () => blockDoca(dialogState.docaId, { motivo }),
        'Doca bloqueada com sucesso',
      );
    },
    [dialogState, runAction],
  );

  const confirmUnblock = useCallback(() => {
    if (dialogState?.type !== 'unblock') return;

    void runAction(
      () => unblockDoca(dialogState.docaId),
      'Doca desbloqueada com sucesso',
    );
  }, [dialogState, runAction]);

  const confirmMaintenance = useCallback(
    (motivo?: string) => {
      if (dialogState?.type !== 'maintenance') return;

      void runAction(
        () => setMaintenanceDoca(dialogState.docaId, { motivo }),
        'Doca colocada em manutenção',
      );
    },
    [dialogState, runAction],
  );

  const confirmDelete = useCallback(() => {
    if (dialogState?.type !== 'delete') return;

    void runAction(
      () => deleteDoca(dialogState.docaId),
      'Doca excluída com sucesso',
    );
  }, [dialogState, runAction]);

  const turnosUtilizacao = useMemo(
    () => [
      { turno: 1, percentual: stats.total ? (stats.disponivel / stats.total) * 100 : 0 },
      { turno: 2, percentual: stats.total ? (stats.ocupada / stats.total) * 100 : 0 },
      { turno: 3, percentual: stats.total ? (stats.reservada / stats.total) * 100 : 0 },
    ],
    [stats],
  );

  return {
    isLoading,
    isSubmitting,
    docas,
    operacoesAtivas,
    stats,
    filtroSituacao,
    setFiltroSituacao,
    filtroTipo,
    setFiltroTipo,
    busca,
    setBusca,
    pagina: paginaSegura,
    setPagina,
    totalPaginas,
    itemsPagina: docas,
    itemsInicio,
    totalFiltrados: total,
    pageSize: PAGE_SIZE,
    dialogState,
    closeDialog,
    openBlockDialog,
    openUnblockDialog,
    openMaintenanceDialog,
    openDeleteDialog,
    confirmBlock,
    confirmUnblock,
    confirmMaintenance,
    confirmDelete,
    recarregar: carregar,
    turnosUtilizacao,
  };
}
