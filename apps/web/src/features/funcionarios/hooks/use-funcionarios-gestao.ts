'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  buildFuncionarioKpi,
  listFuncionarios,
  mapFuncionarioToRecord,
} from '@/features/funcionarios/lib/funcionario-api';
import type { FuncionarioSituacaoApi } from '@/features/funcionarios/types/funcionario.api';
import type {
  FuncionarioFiltroDepartamento,
  FuncionarioFiltroStatus,
  FuncionarioFiltroTurno,
  FuncionarioRecord,
} from '@/features/funcionarios/types/funcionarios-gestao.schema';

const PAGE_SIZE = 10;

const STATUS_FILTRO_OPCOES = [
  { value: 'todos' as const, label: 'Todos' },
  { value: 'ativo' as const, label: 'Ativos' },
  { value: 'inativo' as const, label: 'Inativos' },
];

const DEPARTAMENTO_FILTRO_OPCOES = [
  { value: 'todos' as const, label: 'Todos' },
  { value: 'logistica' as const, label: 'Logística' },
  { value: 'montagem' as const, label: 'Montagem' },
  { value: 'qualidade' as const, label: 'Qualidade' },
  { value: 'triagem' as const, label: 'Triagem' },
  { value: 'manutencao' as const, label: 'Manutenção' },
  { value: 'recebimento' as const, label: 'Recebimento' },
];

const TURNO_FILTRO_OPCOES = [
  { value: 'todos' as const, label: 'Todos' },
  { value: 'manha' as const, label: 'Manhã' },
  { value: 'tarde' as const, label: 'Tarde' },
  { value: 'noite' as const, label: 'Noite' },
];

function mapFiltroToApiSituacao(
  status: FuncionarioFiltroStatus,
): FuncionarioSituacaoApi | undefined {
  if (status === 'todos') return undefined;
  if (status === 'ativo') return 'ativo';
  return 'desligado';
}

export function useFuncionariosGestao() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [funcionarios, setFuncionarios] = useState<FuncionarioRecord[]>([]);
  const [rawItems, setRawItems] = useState<
    ReturnType<typeof mapFuncionarioToRecord>[]
  >([]);
  const [total, setTotal] = useState(0);
  const [statusFiltro, setStatusFiltroState] =
    useState<FuncionarioFiltroStatus>('todos');
  const [departamentoFiltro, setDepartamentoFiltroState] =
    useState<FuncionarioFiltroDepartamento>('todos');
  const [turnoFiltro, setTurnoFiltroState] =
    useState<FuncionarioFiltroTurno>('todos');
  const [busca, setBuscaState] = useState('');
  const [pagina, setPagina] = useState(1);

  const loadFuncionarios = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await listFuncionarios({
        page: pagina,
        limit: PAGE_SIZE,
        unidadeId,
        situacao: mapFiltroToApiSituacao(statusFiltro),
        search: busca.trim() || undefined,
      });

      const mapped = response.items.map(mapFuncionarioToRecord);
      setRawItems(mapped);
      setFuncionarios(mapped);
      setTotal(response.total);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao carregar funcionários';
      toast.error(message);
      setFuncionarios([]);
      setRawItems([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [busca, pagina, statusFiltro, unidadeId]);

  useEffect(() => {
    void loadFuncionarios();
  }, [loadFuncionarios]);

  const filtrados = useMemo(() => {
    let items = funcionarios;

    if (departamentoFiltro !== 'todos') {
      items = items.filter((f) => f.departamento === departamentoFiltro);
    }

    if (turnoFiltro !== 'todos') {
      items = items.filter((f) => f.turno === turnoFiltro);
    }

    return items;
  }, [departamentoFiltro, funcionarios, turnoFiltro]);

  const kpi = useMemo(
    () =>
      buildFuncionarioKpi(
        rawItems.map((item, index) => ({
          id: Number(item.id),
          unidadeId: '',
          matricula: item.matricula,
          nome: item.nome,
          cargo: 'separador',
          situacao: item.status === 'ativo' ? 'ativo' : 'desligado',
          dataAdmissao: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        })),
        total,
      ),
    [rawItems, total],
  );

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = (paginaSegura - 1) * PAGE_SIZE;

  const setStatusFiltro = useCallback((status: FuncionarioFiltroStatus) => {
    setStatusFiltroState(status);
    setPagina(1);
  }, []);

  const setDepartamentoFiltro = useCallback(
    (departamento: FuncionarioFiltroDepartamento) => {
      setDepartamentoFiltroState(departamento);
      setPagina(1);
    },
    [],
  );

  const setTurnoFiltro = useCallback((turno: FuncionarioFiltroTurno) => {
    setTurnoFiltroState(turno);
    setPagina(1);
  }, []);

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
    setPagina(1);
  }, []);

  const setPaginaSafe = useCallback(
    (novaPagina: number) => {
      setPagina(Math.max(1, Math.min(novaPagina, totalPaginas)));
    },
    [totalPaginas],
  );

  const verHistorico = useCallback(async (id: string) => {
    const funcionario = funcionarios.find((f) => f.id === id);
    toast.info('Histórico de produtividade', {
      description: funcionario?.nome ?? id,
    });
  }, [funcionarios]);

  const exportarCsv = useCallback(async () => {
    toast.success('Exportação iniciada', {
      description: `${total} registros`,
    });
  }, [total]);

  return {
    isLoading,
    kpi,
    funcionarios: filtrados,
    statusFiltro,
    setStatusFiltro,
    statusFiltroOpcoes: STATUS_FILTRO_OPCOES,
    departamentoFiltro,
    setDepartamentoFiltro,
    departamentoFiltroOpcoes: DEPARTAMENTO_FILTRO_OPCOES,
    turnoFiltro,
    setTurnoFiltro,
    turnoFiltroOpcoes: TURNO_FILTRO_OPCOES,
    busca,
    setBusca,
    pagina: paginaSegura,
    setPagina: setPaginaSafe,
    totalPaginas,
    totalFiltrados: total,
    itemsInicio,
    pageSize: PAGE_SIZE,
    verHistorico,
    exportarCsv,
  };
}
