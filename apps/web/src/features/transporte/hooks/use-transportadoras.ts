'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  buscarTransportadoraRavexPorPlaca,
  createTransportadora,
  deleteTransportadora,
  listTransportadoras,
  mapTransportadoraToListaItem,
  updateTransportadora,
} from '@/features/transporte/lib/transportadoras-api';
import type { ConfirmarCadastroRavexPayload } from '@/features/transporte/types/transportadora.api';
import {
  TRANSPORTADORAS_PAGE_SIZE,
  type FiltroTransportadoraStatus,
  type TransportadoraFormValues,
  type TransportadoraListaItem,
} from '@/features/transporte/types/transportadora.schema';
import { ApiClientError } from '@/lib/api';

export type TransportadoraFormDialogState = {
  open: boolean;
  editingItem: TransportadoraListaItem | null;
};

export type TransportadoraDeleteDialogState = {
  open: boolean;
  target: TransportadoraListaItem | null;
};

export type TransportadoraEmailsDialogState = {
  open: boolean;
  target: TransportadoraListaItem | null;
};

const EMPTY_STATS = {
  total: 0,
  ativas: 0,
  inativas: 0,
  totalVeiculos: 0,
};

function computeStats(items: TransportadoraListaItem[]) {
  return {
    total: items.length,
    ativas: items.filter((item) => item.status === 'ativa').length,
    inativas: items.filter((item) => item.status === 'inativa').length,
    totalVeiculos: items.reduce(
      (acc, item) => acc + item.quantidadeVeiculos,
      0,
    ),
  };
}

export function useTransportadoras() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingRavex, setIsSearchingRavex] = useState(false);
  const [transportadoras, setTransportadoras] = useState<TransportadoraListaItem[]>(
    [],
  );
  const [stats, setStats] = useState(EMPTY_STATS);
  const [filtroStatus, setFiltroStatusState] =
    useState<FiltroTransportadoraStatus>('todos');
  const [busca, setBuscaState] = useState('');
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [formDialog, setFormDialog] = useState<TransportadoraFormDialogState>({
    open: false,
    editingItem: null,
  });
  const [deleteDialog, setDeleteDialog] =
    useState<TransportadoraDeleteDialogState>({
      open: false,
      target: null,
    });
  const [emailsDialog, setEmailsDialog] = useState<TransportadoraEmailsDialogState>(
    {
      open: false,
      target: null,
    },
  );
  const [cadastroRapidoOpen, setCadastroRapidoOpen] = useState(false);

  const statusApi = filtroStatus !== 'todos' ? filtroStatus : undefined;
  const totalPaginas = Math.max(1, Math.ceil(total / TRANSPORTADORAS_PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = total === 0 ? 0 : (paginaSegura - 1) * TRANSPORTADORAS_PAGE_SIZE + 1;

  const carregar = useCallback(async () => {
    if (!unidadeId) {
      setTransportadoras([]);
      setTotal(0);
      setStats(EMPTY_STATS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [listResponse, statsResponse] = await Promise.all([
        listTransportadoras({
          page: paginaSegura,
          limit: TRANSPORTADORAS_PAGE_SIZE,
          unidadeId,
          status: statusApi,
          search: busca,
        }),
        listTransportadoras({
          page: 1,
          limit: 100,
          unidadeId,
        }),
      ]);

      setTransportadoras(listResponse.items.map(mapTransportadoraToListaItem));
      setTotal(listResponse.total);
      setStats(computeStats(statsResponse.items.map(mapTransportadoraToListaItem)));
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar as transportadoras';

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [paginaSegura, unidadeId, statusApi, busca]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const setFiltroStatus = useCallback((value: FiltroTransportadoraStatus) => {
    setFiltroStatusState(value);
    setPagina(1);
  }, []);

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
    setPagina(1);
  }, []);

  const openCreateDialog = useCallback(() => {
    setFormDialog({ open: true, editingItem: null });
  }, []);

  const openEditDialog = useCallback((item: TransportadoraListaItem) => {
    setFormDialog({ open: true, editingItem: item });
  }, []);

  const closeFormDialog = useCallback(() => {
    setFormDialog({ open: false, editingItem: null });
  }, []);

  const openDeleteDialog = useCallback((item: TransportadoraListaItem) => {
    setDeleteDialog({ open: true, target: item });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ open: false, target: null });
  }, []);

  const openEmailsDialog = useCallback((item: TransportadoraListaItem) => {
    setEmailsDialog({ open: true, target: item });
  }, []);

  const closeEmailsDialog = useCallback(() => {
    setEmailsDialog({ open: false, target: null });
  }, []);

  const openCadastroRapidoDialog = useCallback(() => {
    setCadastroRapidoOpen(true);
  }, []);

  const closeCadastroRapidoDialog = useCallback(() => {
    if (!isSubmitting && !isSearchingRavex) {
      setCadastroRapidoOpen(false);
    }
  }, [isSubmitting, isSearchingRavex]);

  const runMutation = useCallback(
    async (action: () => Promise<unknown>, successMessage: string) => {
      if (!unidadeId) {
        toast.error('Selecione uma unidade para continuar');
        return;
      }

      setIsSubmitting(true);

      try {
        await action();
        toast.success(successMessage);
        closeFormDialog();
        closeDeleteDialog();
        closeEmailsDialog();
        setCadastroRapidoOpen(false);
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
    [unidadeId, carregar, closeFormDialog, closeDeleteDialog, closeEmailsDialog],
  );

  const salvarTransportadora = useCallback(
    async (data: TransportadoraFormValues) => {
      if (!unidadeId) {
        toast.error('Selecione uma unidade para continuar');
        return;
      }

      const editingItem = formDialog.editingItem;

      await runMutation(
        () =>
          editingItem
            ? updateTransportadora(editingItem.id, {
                nome: data.nome,
                cnpj: data.cnpj,
                status: data.status,
              })
            : createTransportadora({
                unidadeId,
                idRavexTransportadora: data.idRavexTransportadora,
                nome: data.nome,
                cnpj: data.cnpj,
                status: data.status,
              }),
        editingItem
          ? 'Transportadora atualizada com sucesso'
          : 'Transportadora cadastrada com sucesso',
      );
    },
    [unidadeId, formDialog.editingItem, runMutation],
  );

  const confirmarExclusao = useCallback(async () => {
    const target = deleteDialog.target;

    if (!target) {
      return;
    }

    await runMutation(
      () => deleteTransportadora(target.id),
      'Transportadora excluída com sucesso',
    );
  }, [deleteDialog.target, runMutation]);

  const salvarEmails = useCallback(
    async (emails: string[]) => {
      const target = emailsDialog.target;

      if (!target) {
        return;
      }

      await runMutation(
        () => updateTransportadora(target.id, { emails }),
        'E-mails atualizados com sucesso',
      );
    },
    [emailsDialog.target, runMutation],
  );

  const buscarRavex = useCallback(
    async (placa: string) => {
      if (!unidadeId) {
        toast.error('Selecione uma unidade para continuar');
        return null;
      }

      setIsSearchingRavex(true);

      try {
        return await buscarTransportadoraRavexPorPlaca(placa, unidadeId);
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível buscar a transportadora na Ravex';

        toast.error(message);
        return null;
      } finally {
        setIsSearchingRavex(false);
      }
    },
    [unidadeId],
  );

  const confirmarCadastroRavex = useCallback(
    async (data: ConfirmarCadastroRavexPayload) => {
      if (!unidadeId) {
        toast.error('Selecione uma unidade para continuar');
        return;
      }

      await runMutation(
        () =>
          createTransportadora({
            unidadeId,
            idRavexTransportadora: data.idRavexTransportadora,
            nome: data.nome,
            cnpj: data.cnpj,
            status: data.status,
            quantidadeVeiculos: data.quantidadeVeiculos,
            sincronizarPlacas: data.sincronizarPlacas,
          }),
        data.sincronizarPlacas
          ? 'Transportadora cadastrada e placas sincronizadas'
          : 'Transportadora cadastrada com sucesso',
      );
    },
    [unidadeId, runMutation],
  );

  const itemsPagina = useMemo(() => transportadoras, [transportadoras]);

  return {
    isLoading,
    filtroStatus,
    setFiltroStatus,
    busca,
    setBusca,
    pagina: paginaSegura,
    setPagina,
    totalPaginas,
    itemsPagina,
    itemsInicio,
    totalFiltrados: total,
    pageSize: TRANSPORTADORAS_PAGE_SIZE,
    stats,
    isSubmitting,
    isSearchingRavex,
    formDialog,
    deleteDialog,
    emailsDialog,
    cadastroRapidoOpen,
    openCreateDialog,
    openEditDialog,
    closeFormDialog,
    openDeleteDialog,
    closeDeleteDialog,
    openEmailsDialog,
    closeEmailsDialog,
    openCadastroRapidoDialog,
    closeCadastroRapidoDialog,
    salvarTransportadora,
    salvarEmails,
    confirmarExclusao,
    buscarRavex,
    confirmarCadastroRavex,
    recarregar: carregar,
  };
}
