'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  atualizarPerfilPlaca,
  atualizarPerfilPlacasMassa,
  listPlacas,
  listPlacasUnidade,
  sincronizarPlacas,
} from '@/features/transporte/lib/placas-api';
import {
  listPerfisTarifas,
  mapPerfilTarifaToItem,
} from '@/features/transporte/lib/perfis-tarifas-api';
import {
  listTransportadoras,
  mapTransportadoraToListaItem,
} from '@/features/transporte/lib/transportadoras-api';
import type { PerfilTarifaItem } from '@/features/transporte/types/perfil-tarifa.schema';
import {
  PLACAS_PAGE_SIZE,
  TODAS_TRANSPORTADORAS_ID,
  TODOS_TIPOS_VEICULO_ID,
} from '@/features/transporte/types/placa-transportadora.schema';
import type { PlacaTransportadora } from '@/features/transporte/types/placa-transportadora.schema';
import type { TransportadoraListaItem } from '@/features/transporte/types/transportadora.schema';
import { ApiClientError } from '@/lib/api';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function usePlacas() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [transportadoras, setTransportadoras] = useState<TransportadoraListaItem[]>(
    [],
  );
  const [perfisTarifas, setPerfisTarifas] = useState<PerfilTarifaItem[]>([]);
  const [tiposVeiculo, setTiposVeiculo] = useState<string[]>([]);
  const [isLoadingTransportadoras, setIsLoadingTransportadoras] = useState(true);
  const [isLoadingPerfis, setIsLoadingPerfis] = useState(true);
  const [transportadoraSelecionadaId, setTransportadoraSelecionadaId] =
    useState<string>(TODAS_TRANSPORTADORAS_ID);
  const [tipoVeiculoFiltro, setTipoVeiculoFiltro] = useState(TODOS_TIPOS_VEICULO_ID);
  const [placas, setPlacas] = useState<PlacaTransportadora[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUpdatingPerfil, setIsUpdatingPerfil] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [perfilMassaId, setPerfilMassaId] = useState<string>('');

  const visualizandoTodas =
    transportadoraSelecionadaId === TODAS_TRANSPORTADORAS_ID;

  const transportadoraSelecionada = useMemo(
    () =>
      visualizandoTodas
        ? null
        : (transportadoras.find(
            (transportadora) => transportadora.id === transportadoraSelecionadaId,
          ) ?? null),
    [transportadoras, transportadoraSelecionadaId, visualizandoTodas],
  );

  const totalPaginas = Math.max(1, Math.ceil(total / PLACAS_PAGE_SIZE));
  const itemsInicio = (pagina - 1) * PLACAS_PAGE_SIZE;
  const selectedCount = selectedIds.size;
  const todasPaginaSelecionadas =
    placas.length > 0 && placas.every((placa) => selectedIds.has(placa.id));
  const algumaPaginaSelecionada = placas.some((placa) =>
    selectedIds.has(placa.id),
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBuscaDebounced(busca);
      setPagina(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [busca]);

  const carregarPerfisTarifas = useCallback(async () => {
    if (!unidadeId) {
      setPerfisTarifas([]);
      setIsLoadingPerfis(false);
      return;
    }

    setIsLoadingPerfis(true);

    try {
      const response = await listPerfisTarifas({ unidadeId });
      setPerfisTarifas(response.items.map(mapPerfilTarifaToItem));
    } catch (error) {
      toast.error(
        getErrorMessage(error, 'Não foi possível carregar os perfis de tarifa.'),
      );
      setPerfisTarifas([]);
    } finally {
      setIsLoadingPerfis(false);
    }
  }, [unidadeId]);

  const carregarTiposVeiculo = useCallback(async () => {
    if (!unidadeId) {
      setTiposVeiculo([]);
      return;
    }

    try {
      const response = visualizandoTodas
        ? await listPlacasUnidade(unidadeId, { limit: 200 })
        : transportadoraSelecionadaId
          ? await listPlacas(transportadoraSelecionadaId, { limit: 200 })
          : { items: [] as PlacaTransportadora[] };

      const tipos = [
        ...new Set(
          response.items
            .map((placa) => placa.tipoVeiculoNome)
            .filter((tipo): tipo is string => Boolean(tipo?.trim())),
        ),
      ].sort((a, b) => a.localeCompare(b, 'pt-BR'));

      setTiposVeiculo(tipos);
    } catch {
      setTiposVeiculo([]);
    }
  }, [unidadeId, visualizandoTodas, transportadoraSelecionadaId]);

  const carregarTransportadoras = useCallback(async () => {
    if (!unidadeId) {
      setTransportadoras([]);
      setIsLoadingTransportadoras(false);
      return;
    }

    setIsLoadingTransportadoras(true);

    try {
      const response = await listTransportadoras({
        unidadeId,
        limit: 100,
        status: 'ativa',
      });

      const items = response.items.map(mapTransportadoraToListaItem);
      setTransportadoras(items);

      setTransportadoraSelecionadaId((atual) => {
        if (atual === TODAS_TRANSPORTADORAS_ID) {
          return atual;
        }

        if (atual && items.some((item) => item.id === atual)) {
          return atual;
        }

        return TODAS_TRANSPORTADORAS_ID;
      });
    } catch (error) {
      toast.error(
        getErrorMessage(error, 'Não foi possível carregar as transportadoras.'),
      );
      setTransportadoras([]);
    } finally {
      setIsLoadingTransportadoras(false);
    }
  }, [unidadeId]);

  const carregarPlacas = useCallback(async () => {
    if (!unidadeId) {
      setPlacas([]);
      setTotal(0);
      return;
    }

    if (!visualizandoTodas && !transportadoraSelecionadaId) {
      setPlacas([]);
      setTotal(0);
      return;
    }

    setIsLoading(true);

    try {
      const params = {
        page: pagina,
        limit: PLACAS_PAGE_SIZE,
        search: buscaDebounced,
        tipoVeiculo:
          tipoVeiculoFiltro === TODOS_TIPOS_VEICULO_ID
            ? undefined
            : tipoVeiculoFiltro,
      };

      const response = visualizandoTodas
        ? await listPlacasUnidade(unidadeId, params)
        : await listPlacas(transportadoraSelecionadaId, params);

      setPlacas(response.items);
      setTotal(response.total);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível carregar as placas.'));
      setPlacas([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    unidadeId,
    visualizandoTodas,
    transportadoraSelecionadaId,
    pagina,
    buscaDebounced,
    tipoVeiculoFiltro,
  ]);

  useEffect(() => {
    void carregarTransportadoras();
    void carregarPerfisTarifas();
  }, [carregarTransportadoras, carregarPerfisTarifas]);

  useEffect(() => {
    void carregarTiposVeiculo();
  }, [carregarTiposVeiculo]);

  useEffect(() => {
    void carregarPlacas();
  }, [carregarPlacas]);

  const selecionarTransportadora = useCallback((id: string) => {
    setTransportadoraSelecionadaId(id);
    setPagina(1);
    setBusca('');
    setBuscaDebounced('');
    setTipoVeiculoFiltro(TODOS_TIPOS_VEICULO_ID);
    setSelectedIds(new Set());
    setPerfilMassaId('');
  }, []);

  const selecionarTipoVeiculo = useCallback((tipo: string) => {
    setTipoVeiculoFiltro(tipo);
    setPagina(1);
    setSelectedIds(new Set());
  }, []);

  const toggleSelect = useCallback((placaId: string) => {
    setSelectedIds((atual) => {
      const proximo = new Set(atual);

      if (proximo.has(placaId)) {
        proximo.delete(placaId);
      } else {
        proximo.add(placaId);
      }

      return proximo;
    });
  }, []);

  const toggleSelectAllPagina = useCallback(() => {
    setSelectedIds((atual) => {
      const proximo = new Set(atual);

      if (todasPaginaSelecionadas) {
        placas.forEach((placa) => proximo.delete(placa.id));
      } else {
        placas.forEach((placa) => proximo.add(placa.id));
      }

      return proximo;
    });
  }, [placas, todasPaginaSelecionadas]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setPerfilMassaId('');
  }, []);

  const sincronizarComRavex = useCallback(async () => {
    if (visualizandoTodas || !transportadoraSelecionadaId) {
      toast.error('Selecione uma transportadora específica para sincronizar.');
      return;
    }

    setIsSyncing(true);

    try {
      const response = await sincronizarPlacas(transportadoraSelecionadaId);

      setPlacas(response.items);
      setTotal(response.total);
      setPagina(1);
      clearSelection();

      const partes: string[] = [];

      if (response.inseridas > 0) {
        partes.push(`${response.inseridas} inserida(s)`);
      }

      if (response.atualizadas > 0) {
        partes.push(`${response.atualizadas} atualizada(s)`);
      }

      if (response.removidas > 0) {
        partes.push(`${response.removidas} removida(s)`);
      }

      toast.success(
        partes.length > 0
          ? `Sincronização concluída: ${partes.join(', ')}.`
          : 'Sincronização concluída. Nenhuma alteração encontrada.',
      );

      await carregarTransportadoras();
      await carregarTiposVeiculo();
    } catch (error) {
      toast.error(
        getErrorMessage(error, 'Não foi possível sincronizar as placas com a Ravex.'),
      );
    } finally {
      setIsSyncing(false);
    }
  }, [
    visualizandoTodas,
    transportadoraSelecionadaId,
    carregarTransportadoras,
    carregarTiposVeiculo,
    clearSelection,
  ]);

  const atualizarPerfil = useCallback(
    async (placaId: string, perfilTarifaId: string | null) => {
      setIsUpdatingPerfil(true);

      try {
        const atualizada = await atualizarPerfilPlaca(placaId, perfilTarifaId);

        setPlacas((atual) =>
          atual.map((placa) => (placa.id === placaId ? atualizada : placa)),
        );

        toast.success(
          perfilTarifaId
            ? 'Perfil associado à placa com sucesso.'
            : 'Perfil removido da placa com sucesso.',
        );
      } catch (error) {
        toast.error(
          getErrorMessage(error, 'Não foi possível atualizar o perfil da placa.'),
        );
      } finally {
        setIsUpdatingPerfil(false);
      }
    },
    [],
  );

  const atualizarPerfilMassa = useCallback(async () => {
    if (selectedIds.size === 0) {
      toast.error('Selecione ao menos uma placa.');
      return;
    }

    const perfilTarifaId = perfilMassaId || null;

    setIsUpdatingPerfil(true);

    try {
      const response = await atualizarPerfilPlacasMassa(
        [...selectedIds],
        perfilTarifaId,
      );

      await carregarPlacas();
      clearSelection();

      toast.success(
        perfilTarifaId
          ? `${response.atualizadas} placa(s) associada(s) ao perfil.`
          : `Perfil removido de ${response.atualizadas} placa(s).`,
      );
    } catch (error) {
      toast.error(
        getErrorMessage(error, 'Não foi possível atualizar as placas em massa.'),
      );
    } finally {
      setIsUpdatingPerfil(false);
    }
  }, [selectedIds, perfilMassaId, carregarPlacas, clearSelection]);

  return {
    transportadoras,
    transportadoraSelecionada,
    transportadoraSelecionadaId,
    visualizandoTodas,
    selecionarTransportadora,
    perfisTarifas,
    isLoadingPerfis,
    tiposVeiculo,
    tipoVeiculoFiltro,
    selecionarTipoVeiculo,
    placas,
    total,
    totalFiltrados: total,
    pagina,
    setPagina,
    totalPaginas,
    itemsInicio,
    pageSize: PLACAS_PAGE_SIZE,
    busca,
    setBusca,
    isLoadingTransportadoras,
    isLoading,
    isSyncing,
    isUpdatingPerfil,
    sincronizarComRavex,
    recarregarPlacas: carregarPlacas,
    selectedIds,
    selectedCount,
    todasPaginaSelecionadas,
    algumaPaginaSelecionada,
    toggleSelect,
    toggleSelectAllPagina,
    clearSelection,
    perfilMassaId,
    setPerfilMassaId,
    atualizarPerfil,
    atualizarPerfilMassa,
  };
}
