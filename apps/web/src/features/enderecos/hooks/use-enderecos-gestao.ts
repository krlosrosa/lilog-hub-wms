'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import type { EnderecoDialogState } from '@/features/enderecos/components/endereco-action-dialogs';
import {
  blockEndereco,
  finishEnderecoInventory,
  getEnderecoKpi,
  inactivateEndereco,
  listEnderecos,
  mapEnderecoToListaItem,
  mapKpiApiToKpi,
  startEnderecoInventory,
  unblockEndereco,
  updateEndereco,
} from '@/features/enderecos/lib/endereco-api';
import type {
  EnderecoFiltros,
  EnderecoListaItem,
  EnderecoStatus,
  EnderecoTipo,
} from '@/features/enderecos/types/enderecos-gestao.schema';
import { normalizeNivel } from '@/features/enderecos/types/enderecos-gestao.schema';
import { useUnidadeContext } from '@/contexts/unidade-context';
import { ApiClientError } from '@/lib/api';

const PAGE_SIZE = 10;

const DEFAULT_FILTROS: EnderecoFiltros = {
  zonas: [],
  niveis: [],
  tipos: [],
  status: [],
};

function aplicarFiltrosLocais(
  items: EnderecoListaItem[],
  filtros: EnderecoFiltros,
): EnderecoListaItem[] {
  return items.filter((item) => {
    if (
      filtros.zonas.length > 0 &&
      !filtros.zonas.some(
        (zona) => item.zona.toUpperCase() === zona.toUpperCase(),
      )
    ) {
      return false;
    }

    if (
      filtros.niveis.length > 0 &&
      !filtros.niveis.some(
        (nivel) => normalizeNivel(item.nivel) === normalizeNivel(nivel),
      )
    ) {
      return false;
    }

    if (filtros.tipos.length > 0 && !filtros.tipos.includes(item.tipo)) {
      return false;
    }

    if (filtros.status.length > 0 && !filtros.status.includes(item.status)) {
      return false;
    }

    return true;
  });
}

export function useEnderecosGestao() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kpi, setKpi] = useState(() =>
    mapKpiApiToKpi({
      totalEnderecos: 0,
      totalEnderecosTrendPercent: 0,
      ocupacaoGlobalPercent: 0,
      posicoesBloqueadas: 0,
      crossDockingAtivos: 0,
      enderecosDisponiveis: 0,
      enderecosOcupados: 0,
      taxaOcupacaoGeral: 0,
    }),
  );
  const [filtros, setFiltrosState] = useState<EnderecoFiltros>(DEFAULT_FILTROS);
  const [busca, setBuscaState] = useState('');
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [enderecos, setEnderecos] = useState<EnderecoListaItem[]>([]);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [erro, setErro] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<EnderecoDialogState>(null);

  const usaFiltroLocal =
    filtros.zonas.length > 0 ||
    filtros.niveis.length > 0 ||
    filtros.tipos.length > 1 ||
    filtros.status.length > 1;

  const statusApi =
    filtros.status.length === 1 ? filtros.status[0] : undefined;
  const tipoApi = filtros.tipos.length === 1 ? filtros.tipos[0] : undefined;

  const carregar = useCallback(async () => {
    setIsLoading(true);
    setErro(null);

    try {
      const [listResponse, kpiResponse] = await Promise.all([
        listEnderecos({
          page: usaFiltroLocal ? 1 : pagina,
          limit: usaFiltroLocal ? 100 : PAGE_SIZE,
          status: statusApi,
          tipo: tipoApi,
          search: busca,
          unidadeId,
        }),
        getEnderecoKpi({ unidadeId }),
      ]);

      const items = listResponse.items.map(mapEnderecoToListaItem);
      const filtrados = aplicarFiltrosLocais(items, filtros);

      if (usaFiltroLocal) {
        const inicio = (pagina - 1) * PAGE_SIZE;
        setEnderecos(filtrados.slice(inicio, inicio + PAGE_SIZE));
        setTotal(filtrados.length);
      } else {
        setEnderecos(filtrados);
        setTotal(listResponse.total);
      }

      setKpi(mapKpiApiToKpi(kpiResponse));
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar os endereços';

      setErro(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [pagina, statusApi, tipoApi, busca, filtros, usaFiltroLocal, unidadeId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = total === 0 ? 0 : (paginaSegura - 1) * PAGE_SIZE + 1;

  const setFiltros = useCallback((partial: Partial<EnderecoFiltros>) => {
    setFiltrosState((prev) => ({ ...prev, ...partial }));
    setPagina(1);
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltrosState(DEFAULT_FILTROS);
    setPagina(1);
    toast.info('Filtros limpos');
  }, []);

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
    setPagina(1);
  }, []);

  const toggleZona = useCallback((zona: string) => {
    setFiltrosState((prev) => {
      const zonas = prev.zonas.includes(zona)
        ? prev.zonas.filter((z) => z !== zona)
        : [...prev.zonas, zona];
      return { ...prev, zonas };
    });
    setPagina(1);
  }, []);

  const toggleNivel = useCallback((nivel: string) => {
    setFiltrosState((prev) => {
      const niveis = prev.niveis.includes(nivel)
        ? prev.niveis.filter((n) => n !== nivel)
        : [...prev.niveis, nivel];
      return { ...prev, niveis };
    });
    setPagina(1);
  }, []);

  const toggleTipoFiltro = useCallback((tipo: EnderecoTipo) => {
    setFiltrosState((prev) => {
      const tipos = prev.tipos.includes(tipo)
        ? prev.tipos.filter((t) => t !== tipo)
        : [...prev.tipos, tipo];
      return { ...prev, tipos };
    });
    setPagina(1);
  }, []);

  const toggleStatusFiltro = useCallback((status: EnderecoStatus) => {
    setFiltrosState((prev) => {
      const statusList = prev.status.includes(status)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status];
      return { ...prev, status: statusList };
    });
    setPagina(1);
  }, []);

  const toggleSelecionado = useCallback((id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleTodosPagina = useCallback(() => {
    setSelecionados((prev) => {
      const idsPagina = enderecos.map((e) => e.id);
      const todosSelecionados = idsPagina.every((id) => prev.has(id));
      const next = new Set(prev);
      if (todosSelecionados) {
        idsPagina.forEach((id) => next.delete(id));
      } else {
        idsPagina.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [enderecos]);

  const closeDialog = useCallback(() => {
    if (!isSubmitting) {
      setDialogState(null);
    }
  }, [isSubmitting]);

  const openBlockDialog = useCallback(
    (enderecoId: string, enderecoLabel: string) => {
      setDialogState({ type: 'block', enderecoId, enderecoLabel });
    },
    [],
  );

  const openUnblockDialog = useCallback(
    (
      enderecoId: string,
      enderecoLabel: string,
      ocupacaoPercent: number,
    ) => {
      setDialogState({
        type: 'unblock',
        enderecoId,
        enderecoLabel,
        ocupacaoPercent,
      });
    },
    [],
  );

  const openChangeStatusDialog = useCallback(
    (
      enderecoId: string,
      enderecoLabel: string,
      currentStatus: EnderecoStatus,
    ) => {
      setDialogState({
        type: 'change-status',
        enderecoId,
        enderecoLabel,
        currentStatus,
      });
    },
    [],
  );

  const bloqueioEmMassa = useCallback(() => {
    if (selecionados.size === 0) {
      toast.error('Selecione ao menos um endereço');
      return;
    }

    setDialogState({ type: 'mass-block', count: selecionados.size });
  }, [selecionados]);

  const confirmBlock = useCallback(
    async (motivo: string) => {
      if (dialogState?.type !== 'block') {
        return;
      }

      setIsSubmitting(true);

      try {
        await blockEndereco(dialogState.enderecoId, { motivo });
        toast.success('Endereço bloqueado com sucesso');
        setDialogState(null);
        await carregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível bloquear o endereço';

        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [dialogState, carregar],
  );

  const confirmMassBlock = useCallback(
    async (motivo: string) => {
      if (dialogState?.type !== 'mass-block') {
        return;
      }

      setIsSubmitting(true);

      try {
        await Promise.all(
          Array.from(selecionados).map((id) => blockEndereco(id, { motivo })),
        );

        toast.success(`${selecionados.size} endereço(s) bloqueado(s)`);
        setSelecionados(new Set());
        setDialogState(null);
        await carregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível bloquear os endereços selecionados';

        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [dialogState, selecionados, carregar],
  );

  const confirmUnblock = useCallback(
    async (motivo?: string) => {
      if (dialogState?.type !== 'unblock') {
        return;
      }

      setIsSubmitting(true);

      try {
        await unblockEndereco(dialogState.enderecoId, { motivo });
        toast.success('Endereço desbloqueado com sucesso');
        setDialogState(null);
        await carregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível desbloquear o endereço';

        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [dialogState, carregar],
  );

  const confirmChangeStatus = useCallback(
    async (status: EnderecoStatus, motivo?: string) => {
      if (dialogState?.type !== 'change-status') {
        return;
      }

      setIsSubmitting(true);

      try {
        const { enderecoId, currentStatus } = dialogState;

        if (status === 'bloqueado') {
          if (!motivo) {
            toast.error('Informe o motivo do bloqueio');
            return;
          }

          await blockEndereco(enderecoId, { motivo });
        } else if (status === 'inativo') {
          await inactivateEndereco(enderecoId, { motivo });
        } else if (status === 'inventario') {
          await startEnderecoInventory(enderecoId, { motivo });
        } else if (currentStatus === 'bloqueado') {
          await unblockEndereco(enderecoId, { motivo });
        } else if (currentStatus === 'inventario') {
          await finishEnderecoInventory(enderecoId, { motivo });
        } else {
          await updateEndereco(enderecoId, {
            status,
            motivoAlteracao: motivo,
          });
        }

        toast.success('Status alterado com sucesso');
        setDialogState(null);
        await carregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível alterar o status do endereço';

        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [dialogState, carregar],
  );

  const inventariarEndereco = useCallback(
    async (id: string, label: string) => {
      setIsSubmitting(true);

      try {
        await startEnderecoInventory(id, {
          motivo: 'Inventário iniciado pela gestão de endereços',
        });
        toast.success(`Endereço ${label} em inventário`);
        await carregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível iniciar o inventário';

        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [carregar],
  );

  const inativarEndereco = useCallback(
    async (id: string, label: string) => {
      setIsSubmitting(true);

      try {
        await inactivateEndereco(id, {
          motivo: 'Inativação pela gestão de endereços',
        });
        toast.success(`Endereço ${label} inativado`);
        await carregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível inativar o endereço';

        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [carregar],
  );

  const filtrosAtivos = useMemo(
    () =>
      filtros.zonas.length +
      filtros.niveis.length +
      filtros.tipos.length +
      filtros.status.length,
    [filtros],
  );

  return {
    isLoading,
    isSubmitting,
    erro,
    kpi,
    enderecos,
    filtros,
    filtrosAtivos,
    setFiltros,
    limparFiltros,
    toggleZona,
    toggleNivel,
    toggleTipoFiltro,
    toggleStatusFiltro,
    busca,
    setBusca,
    pagina: paginaSegura,
    setPagina,
    totalPaginas,
    totalFiltrados: total,
    itemsInicio,
    pageSize: PAGE_SIZE,
    selecionados,
    toggleSelecionado,
    toggleTodosPagina,
    bloqueioEmMassa,
    recarregar: carregar,
    dialogState,
    closeDialog,
    openBlockDialog,
    openUnblockDialog,
    openChangeStatusDialog,
    confirmBlock,
    confirmUnblock,
    confirmChangeStatus,
    confirmMassBlock,
    inventariarEndereco,
    inativarEndereco,
  };
}
