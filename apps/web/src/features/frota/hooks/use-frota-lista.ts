'use client';

import { useCallback, useMemo, useState } from 'react';

import { MOCK_VEICULOS_LISTA } from '@/features/frota/mocks/frota-mock-data';
import {
  FROTA_LISTA_PAGE_SIZE,
  type FiltroVeiculoStatus,
  type VeiculoListaItem,
} from '@/features/frota/types/frota.schema';

export function useFrotaLista() {
  const [veiculos] = useState<VeiculoListaItem[]>(() => [...MOCK_VEICULOS_LISTA]);
  const [filtroStatus, setFiltroStatusState] = useState<FiltroVeiculoStatus>('todos');
  const [busca, setBuscaState] = useState('');
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(() => {
    let items = veiculos;

    if (filtroStatus !== 'todos') {
      items = items.filter((v) => v.status === filtroStatus);
    }

    const term = busca.trim().toLowerCase();
    if (term) {
      items = items.filter(
        (v) =>
          v.codigo.toLowerCase().includes(term) ||
          v.placa.toLowerCase().includes(term) ||
          v.marcaModelo.toLowerCase().includes(term) ||
          v.transportadora.toLowerCase().includes(term),
      );
    }

    return items;
  }, [veiculos, filtroStatus, busca]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(filtrados.length / FROTA_LISTA_PAGE_SIZE),
  );
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = (paginaSegura - 1) * FROTA_LISTA_PAGE_SIZE;
  const itemsPagina = filtrados.slice(
    itemsInicio,
    itemsInicio + FROTA_LISTA_PAGE_SIZE,
  );

  const stats = useMemo(() => {
    const total = veiculos.length;
    const ativos = veiculos.filter((v) => v.status === 'ativo').length;
    const bloqueados = veiculos.filter((v) => v.status === 'bloqueado').length;
    const emManutencao = veiculos.filter((v) => v.status === 'manutencao').length;

    return { total, ativos, bloqueados, emManutencao };
  }, [veiculos]);

  const setFiltroStatus = useCallback((value: FiltroVeiculoStatus) => {
    setFiltroStatusState(value);
    setPagina(1);
  }, []);

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
    setPagina(1);
  }, []);

  return {
    filtroStatus,
    setFiltroStatus,
    busca,
    setBusca,
    pagina: paginaSegura,
    setPagina,
    totalPaginas,
    itemsPagina,
    itemsInicio,
    totalFiltrados: filtrados.length,
    pageSize: FROTA_LISTA_PAGE_SIZE,
    stats,
  };
}
