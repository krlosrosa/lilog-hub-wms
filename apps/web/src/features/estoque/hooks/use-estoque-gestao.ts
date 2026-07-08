'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { listDepositos } from '@/features/depositos/lib/deposito-api';
import type { DepositoListaItem } from '@/features/depositos/types/depositos-gestao.schema';
import {
  listDisponibilidadeEstoqueAgrupado,
  listGruposDisponibilidadeEstoque,
  mapDisponibilidadeAgrupadoToProdutoItem,
} from '@/features/estoque/lib/estoque-api';
import type {
  EstoqueProdutoAgrupadoItem,
  EstoqueSummary,
  FiltroNaturezaSaldo,
  FiltroStatusSaldo,
} from '@/features/estoque/types/estoque-gestao.schema';
import { ApiClientError } from '@/lib/api';

const PAGE_SIZE = 20;

const EMPTY_SUMMARY: EstoqueSummary = {
  saldoFisico: 0,
  saldoBloqueado: 0,
  saldoDebito: 0,
  saldoReservado: 0,
  saldoDisponivel: 0,
  pesoLiquidoTotalKg: 0,
};

export function useEstoqueGestao() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [lotes, setLotes] = useState<EstoqueProdutoAgrupadoItem[]>([]);
  const [summary, setSummary] = useState<EstoqueSummary>(EMPTY_SUMMARY);
  const [depositos, setDepositos] = useState<DepositoListaItem[]>([]);
  const [busca, setBuscaState] = useState('');
  const [depositoId, setDepositoId] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<FiltroStatusSaldo>('todos');
  const [naturezaFiltro, setNaturezaFiltro] =
    useState<FiltroNaturezaSaldo>('todos');
  const [loteFiltro, setLoteFiltro] = useState('');
  const [gruposFiltro, setGruposFiltro] = useState<string[]>([]);
  const [grupos, setGrupos] = useState<string[]>([]);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);

  const carregarDepositos = useCallback(async () => {
    if (!unidadeId) {
      setDepositos([]);
      return;
    }

    try {
      const response = await listDepositos(unidadeId);
      setDepositos(
        response.items.map((item) => ({
          id: item.id,
          codigo: item.codigo,
          nome: item.nome,
          finalidade: item.finalidade,
          permiteVenda: item.permiteVenda,
          permitePicking: item.permitePicking,
          exigeEndereco: item.exigeEndereco,
          contaDisponivel: item.contaDisponivel,
          sistema: item.sistema,
          ativo: item.ativo,
        })),
      );
    } catch {
      setDepositos([]);
    }
  }, [unidadeId]);

  const carregarGrupos = useCallback(async () => {
    if (!unidadeId) {
      setGrupos([]);
      return;
    }

    try {
      const response = await listGruposDisponibilidadeEstoque(unidadeId);
      setGrupos(response.items);
    } catch {
      setGrupos([]);
    }
  }, [unidadeId]);

  const carregar = useCallback(async () => {
    if (!unidadeId) {
      setLotes([]);
      setSummary(EMPTY_SUMMARY);
      setTotal(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await listDisponibilidadeEstoqueAgrupado({
        unidadeId,
        depositoId: depositoId || undefined,
        status: statusFiltro === 'todos' ? undefined : statusFiltro,
        natureza: naturezaFiltro === 'todos' ? undefined : naturezaFiltro,
        lote: loteFiltro || undefined,
        grupos: gruposFiltro.length > 0 ? gruposFiltro : undefined,
        search: busca || undefined,
        groupBy: 'produto',
        page: pagina,
        limit: PAGE_SIZE,
      });

      setLotes(response.items.map(mapDisponibilidadeAgrupadoToProdutoItem));
      setSummary(response.summary);
      setTotal(response.total);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar o estoque.';
      toast.error(message);
      setLotes([]);
      setSummary(EMPTY_SUMMARY);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    unidadeId,
    depositoId,
    statusFiltro,
    naturezaFiltro,
    loteFiltro,
    gruposFiltro,
    busca,
    pagina,
  ]);

  useEffect(() => {
    void carregarDepositos();
    void carregarGrupos();
  }, [carregarDepositos, carregarGrupos]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = total === 0 ? 0 : (paginaSegura - 1) * PAGE_SIZE + 1;
  const itemsFim = Math.min(paginaSegura * PAGE_SIZE, total);

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
    setPagina(1);
  }, []);

  const filtrosAtivos = useMemo(() => {
    let count = 0;
    if (depositoId) count += 1;
    if (statusFiltro !== 'todos') count += 1;
    if (naturezaFiltro !== 'todos') count += 1;
    if (loteFiltro.trim()) count += 1;
    if (gruposFiltro.length > 0) count += 1;
    return count;
  }, [depositoId, statusFiltro, naturezaFiltro, loteFiltro, gruposFiltro]);

  const limparFiltros = useCallback(() => {
    setDepositoId('');
    setStatusFiltro('todos');
    setNaturezaFiltro('todos');
    setLoteFiltro('');
    setGruposFiltro([]);
    setPagina(1);
  }, []);

  return {
    unidadeId,
    isLoading,
    produtos: lotes,
    summary,
    depositos,
    grupos,
    busca,
    setBusca,
    depositoId,
    setDepositoId,
    statusFiltro,
    setStatusFiltro,
    naturezaFiltro,
    setNaturezaFiltro,
    loteFiltro,
    setLoteFiltro,
    gruposFiltro,
    setGruposFiltro,
    pagina,
    setPagina,
    totalPaginas,
    total,
    itemsInicio,
    itemsFim,
    pageSize: PAGE_SIZE,
    filtrosAtivos,
    limparFiltros,
    recarregar: carregar,
  };
}
