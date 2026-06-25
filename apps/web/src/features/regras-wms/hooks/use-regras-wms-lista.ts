'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { cloneArvoreCondicoes } from '@/features/regras-wms/lib/arvore-condicoes-utils';
import {
  MOCK_REGRAS_WMS,
  MOCK_REGRAS_WMS_STATS,
} from '@/features/regras-wms/mocks/regras-wms-mock-data';
import {
  REGRAS_WMS_PAGE_SIZE,
  type FiltroAtivo,
  type FiltroGatilho,
} from '@/features/regras-wms/types/regra-wms.schema';
import type { RegraWmsV2 } from '@/features/regras-wms/types/regra-wms-tree.schema';

export function useRegrasWmsLista() {
  const [regras, setRegras] = useState<RegraWmsV2[]>(() => [
    ...MOCK_REGRAS_WMS,
  ]);
  const [filtroGatilho, setFiltroGatilhoState] =
    useState<FiltroGatilho>('todos');
  const [filtroAtivo, setFiltroAtivoState] = useState<FiltroAtivo>('todos');
  const [busca, setBuscaState] = useState('');
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(() => {
    let items = regras;

    if (filtroGatilho !== 'todos') {
      items = items.filter((r) => r.gatilho === filtroGatilho);
    }

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
  }, [regras, filtroGatilho, filtroAtivo, busca]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(filtrados.length / REGRAS_WMS_PAGE_SIZE),
  );
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = (paginaSegura - 1) * REGRAS_WMS_PAGE_SIZE;
  const itemsPagina = filtrados.slice(
    itemsInicio,
    itemsInicio + REGRAS_WMS_PAGE_SIZE,
  );

  const stats = useMemo(
    () => ({
      total: regras.length,
      ativas: regras.filter((r) => r.ativo).length,
      inativas: regras.filter((r) => !r.ativo).length,
      conflitosPotenciais: MOCK_REGRAS_WMS_STATS.conflitosPotenciais,
    }),
    [regras],
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

  const toggleAtivo = useCallback((id: string) => {
    setRegras((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const novoAtivo = !r.ativo;
        toast.success(novoAtivo ? 'Regra ativada' : 'Regra desativada', {
          description: r.nome,
        });
        return { ...r, ativo: novoAtivo, atualizadoEm: new Date().toISOString() };
      }),
    );
  }, []);

  const duplicarRegra = useCallback((id: string) => {
    setRegras((prev) => {
      const original = prev.find((r) => r.id === id);
      if (!original) return prev;

      const copia: RegraWmsV2 = {
        ...original,
        id: `rw-${Date.now()}`,
        nome: `${original.nome} (cópia)`,
        ativo: false,
        arvoreCondicoes: cloneArvoreCondicoes(original.arvoreCondicoes),
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };

      toast.success('Regra duplicada', { description: copia.nome });
      return [copia, ...prev];
    });
  }, []);

  const excluirRegra = useCallback((id: string) => {
    setRegras((prev) => {
      const regra = prev.find((r) => r.id === id);
      if (regra) {
        toast.success('Regra excluída', { description: regra.nome });
      }
      return prev.filter((r) => r.id !== id);
    });
  }, []);

  return {
    regras,
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
    totalFiltrados: filtrados.length,
    pageSize: REGRAS_WMS_PAGE_SIZE,
    stats,
    toggleAtivo,
    duplicarRegra,
    excluirRegra,
  };
}
