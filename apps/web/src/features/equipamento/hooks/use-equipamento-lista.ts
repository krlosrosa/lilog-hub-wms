'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  MOCK_EQUIPAMENTO_STATS,
  MOCK_EQUIPAMENTOS_LISTA,
} from '@/features/equipamento/mocks/equipamento-mock-data';
import {
  EQUIPAMENTO_LISTA_PAGE_SIZE,
  type EquipamentoListaItem,
  type FiltroEquipamentoStatus,
  type TipoEquipamento,
} from '@/features/equipamento/types/equipamento.schema';

export function useEquipamentoLista() {
  const [equipamentos] = useState<EquipamentoListaItem[]>(() => [
    ...MOCK_EQUIPAMENTOS_LISTA,
  ]);
  const [filtroStatus, setFiltroStatusState] =
    useState<FiltroEquipamentoStatus>('todos');
  const [filtroTipo, setFiltroTipoState] = useState<TipoEquipamento | 'todos'>(
    'todos',
  );
  const [busca, setBuscaState] = useState('');
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(() => {
    let items = equipamentos;

    if (filtroStatus !== 'todos') {
      items = items.filter((e) => e.status === filtroStatus);
    }

    if (filtroTipo !== 'todos') {
      items = items.filter((e) => e.tipo === filtroTipo);
    }

    const term = busca.trim().toLowerCase();
    if (term) {
      items = items.filter(
        (e) =>
          e.tag.toLowerCase().includes(term) ||
          e.nome.toLowerCase().includes(term) ||
          e.modelo.toLowerCase().includes(term) ||
          e.localizacao.toLowerCase().includes(term),
      );
    }

    return items;
  }, [equipamentos, filtroStatus, filtroTipo, busca]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(filtrados.length / EQUIPAMENTO_LISTA_PAGE_SIZE),
  );
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = (paginaSegura - 1) * EQUIPAMENTO_LISTA_PAGE_SIZE;
  const itemsPagina = filtrados.slice(
    itemsInicio,
    itemsInicio + EQUIPAMENTO_LISTA_PAGE_SIZE,
  );

  const setFiltroStatus = useCallback((value: FiltroEquipamentoStatus) => {
    setFiltroStatusState(value);
    setPagina(1);
  }, []);

  const setFiltroTipo = useCallback((value: TipoEquipamento | 'todos') => {
    setFiltroTipoState(value);
    setPagina(1);
  }, []);

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
    setPagina(1);
  }, []);

  return {
    filtroStatus,
    setFiltroStatus,
    filtroTipo,
    setFiltroTipo,
    busca,
    setBusca,
    pagina: paginaSegura,
    setPagina,
    totalPaginas,
    itemsPagina,
    itemsInicio,
    totalFiltrados: filtrados.length,
    pageSize: EQUIPAMENTO_LISTA_PAGE_SIZE,
    stats: MOCK_EQUIPAMENTO_STATS,
  };
}
