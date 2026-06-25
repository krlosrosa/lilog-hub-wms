'use client';

import { useCallback, useMemo, useState } from 'react';

import { toast } from 'sonner';

import {
  MOCK_MOVIMENTACAO_SUMMARY,
  MOCK_MOVIMENTACOES,
} from '@/features/aprovacao-movimentacao/mocks/aprovacao-movimentacao-mock-data';
import type {
  FiltroPrioridadeMovimentacao,
  FiltroTipoMovimentacao,
  MovimentacaoItem,
} from '@/features/aprovacao-movimentacao/types/aprovacao-movimentacao.schema';

const PAGE_SIZE = 8;

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function filtrarPorTipo(
  items: MovimentacaoItem[],
  filtro: FiltroTipoMovimentacao,
): MovimentacaoItem[] {
  if (filtro === 'todos') {
    return items;
  }

  return items.filter((item) => item.tipo === filtro);
}

function filtrarPorPrioridade(
  items: MovimentacaoItem[],
  filtro: FiltroPrioridadeMovimentacao,
): MovimentacaoItem[] {
  if (filtro === 'todas') {
    return items;
  }

  return items.filter((item) => item.prioridade === filtro);
}

function filtrarPorData(
  items: MovimentacaoItem[],
  data: string,
): MovimentacaoItem[] {
  if (!data.trim()) {
    return items;
  }

  return items.filter((item) => item.dataSolicitacao === data);
}

export function useAprovacaoMovimentacao() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoItem[]>(() => [
    ...MOCK_MOVIMENTACOES,
  ]);
  const [busca, setBuscaState] = useState('');
  const [filtroTipo, setFiltroTipoState] =
    useState<FiltroTipoMovimentacao>('todos');
  const [filtroPrioridade, setFiltroPrioridadeState] =
    useState<FiltroPrioridadeMovimentacao>('todas');
  const [filtroData, setFiltroDataState] = useState('');
  const [selecionados, setSelecionados] = useState<Set<string>>(() => new Set());
  const [pagina, setPagina] = useState(1);
  const [processando, setProcessando] = useState(false);

  const summary = MOCK_MOVIMENTACAO_SUMMARY;

  const filtrados = useMemo(() => {
    let items = movimentacoes;

    items = filtrarPorTipo(items, filtroTipo);
    items = filtrarPorPrioridade(items, filtroPrioridade);
    items = filtrarPorData(items, filtroData);

    const term = busca.trim().toLowerCase();
    if (term) {
      items = items.filter(
        (item) =>
          item.codigo.toLowerCase().includes(term) ||
          item.sku.toLowerCase().includes(term) ||
          item.produto.toLowerCase().includes(term) ||
          item.lote.toLowerCase().includes(term),
      );
    }

    return items;
  }, [movimentacoes, filtroTipo, filtroPrioridade, filtroData, busca]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = (paginaSegura - 1) * PAGE_SIZE;
  const itemsPagina = filtrados.slice(itemsInicio, itemsInicio + PAGE_SIZE);

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
    setPagina(1);
  }, []);

  const setFiltroTipo = useCallback((value: FiltroTipoMovimentacao) => {
    setFiltroTipoState(value);
    setPagina(1);
  }, []);

  const setFiltroPrioridade = useCallback(
    (value: FiltroPrioridadeMovimentacao) => {
      setFiltroPrioridadeState(value);
      setPagina(1);
    },
    [],
  );

  const setFiltroData = useCallback((value: string) => {
    setFiltroDataState(value);
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

  const toggleSelecionarTodos = useCallback(() => {
    setSelecionados((prev) => {
      const idsPagina = itemsPagina.map((item) => item.id);
      const todosSelecionados = idsPagina.every((id) => prev.has(id));

      if (todosSelecionados) {
        const next = new Set(prev);
        idsPagina.forEach((id) => next.delete(id));
        return next;
      }

      return new Set([...prev, ...idsPagina]);
    });
  }, [itemsPagina]);

  const removerMovimentacoes = useCallback((ids: string[]) => {
    const idsSet = new Set(ids);
    setMovimentacoes((prev) => prev.filter((item) => !idsSet.has(item.id)));
    setSelecionados((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const aprovar = useCallback(
    async (id: string) => {
      const item = movimentacoes.find((m) => m.id === id);
      if (!item) {
        return;
      }

      setProcessando(true);
      try {
        await delay(400);
        removerMovimentacoes([id]);
        toast.success('Movimentação aprovada', {
          description: `${item.codigo} foi aprovada com sucesso.`,
        });
      } finally {
        setProcessando(false);
      }
    },
    [movimentacoes, removerMovimentacoes],
  );

  const reprovar = useCallback(
    async (id: string) => {
      const item = movimentacoes.find((m) => m.id === id);
      if (!item) {
        return;
      }

      setProcessando(true);
      try {
        await delay(400);
        removerMovimentacoes([id]);
        toast.error('Movimentação reprovada', {
          description: `${item.codigo} foi reprovada.`,
        });
      } finally {
        setProcessando(false);
      }
    },
    [movimentacoes, removerMovimentacoes],
  );

  const aprovarSelecionados = useCallback(async () => {
    if (selecionados.size === 0) {
      toast.info('Selecione ao menos uma movimentação');
      return;
    }

    const ids = [...selecionados];
    setProcessando(true);
    try {
      await delay(600);
      removerMovimentacoes(ids);
      toast.success(`${ids.length} movimentação(ões) aprovada(s)`, {
        description: 'As solicitações selecionadas foram processadas.',
      });
    } finally {
      setProcessando(false);
    }
  }, [selecionados, removerMovimentacoes]);

  const aprovarEmMassa = useCallback(async () => {
    if (filtrados.length === 0) {
      toast.info('Nenhuma movimentação pendente para aprovar');
      return;
    }

    setProcessando(true);
    try {
      await delay(800);
      const ids = filtrados.map((item) => item.id);
      removerMovimentacoes(ids);
      toast.success('Aprovação em massa concluída', {
        description: `${ids.length} movimentação(ões) aprovada(s) automaticamente.`,
      });
    } finally {
      setProcessando(false);
    }
  }, [filtrados, removerMovimentacoes]);

  const verDetalhes = useCallback((id: string) => {
    const item = movimentacoes.find((m) => m.id === id);
    toast.info('Detalhes em construção (mock)', {
      description: item
        ? `Visualizando ${item.codigo} — ${item.produto}`
        : undefined,
    });
  }, [movimentacoes]);

  const todosPaginaSelecionados =
    itemsPagina.length > 0 &&
    itemsPagina.every((item) => selecionados.has(item.id));

  return {
    summary,
    busca,
    setBusca,
    filtroTipo,
    setFiltroTipo,
    filtroPrioridade,
    setFiltroPrioridade,
    filtroData,
    setFiltroData,
    selecionados,
    toggleSelecionado,
    toggleSelecionarTodos,
    todosPaginaSelecionados,
    pagina: paginaSegura,
    setPagina,
    totalPaginas,
    itemsPagina,
    itemsInicio,
    totalFiltrados: filtrados.length,
    totalPendentes: movimentacoes.length,
    pageSize: PAGE_SIZE,
    processando,
    actions: {
      aprovar,
      reprovar,
      aprovarSelecionados,
      aprovarEmMassa,
      verDetalhes,
    },
  };
}
