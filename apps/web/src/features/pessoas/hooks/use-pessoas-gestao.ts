'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { updateFuncionario } from '@/features/funcionarios/lib/funcionario-api';
import {
  buildPessoaKpi,
  listPessoas,
  mapPessoaToRecord,
} from '@/features/pessoas/lib/pessoa-api';
import type {
  PessoaFiltroAcesso,
  PessoaFiltroCargo,
  PessoaFiltroEquipe,
  PessoaFiltroSituacao,
  PessoaRecord,
} from '@/features/pessoas/types/pessoa.schema';
import { listEquipes } from '@/features/sessao-operacao/lib/sessao-operacao-api';
import type { EquipeApi } from '@/features/sessao-operacao/types/equipe.api';
import {
  blockUser,
  resetUserPassword,
  unblockUser,
} from '@/features/usuarios/lib/usuario-api';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

const SITUACAO_FILTRO_OPCOES = [
  { value: 'todos' as const, label: 'Todas situações' },
  { value: 'ativo' as const, label: 'Ativos' },
  { value: 'inativo' as const, label: 'Inativos' },
];

const ACESSO_FILTRO_OPCOES = [
  { value: 'todos' as const, label: 'Todo acesso' },
  { value: 'com_acesso' as const, label: 'Com acesso' },
  { value: 'sem_acesso' as const, label: 'Sem acesso' },
];

function mapSituacaoFiltroToApi(
  status: PessoaFiltroSituacao,
): string | undefined {
  if (status === 'todos') return undefined;
  if (status === 'ativo') return 'ativo';
  return 'desligado';
}

function mapAcessoFiltroToApi(
  filtro: PessoaFiltroAcesso,
): boolean | undefined {
  if (filtro === 'com_acesso') return true;
  if (filtro === 'sem_acesso') return false;
  return undefined;
}

function mapEquipeFiltroToApi(filtro: PessoaFiltroEquipe): {
  equipeId?: string;
  semEquipe?: boolean;
} {
  if (filtro === 'todos') return {};
  if (filtro === 'sem_equipe') return { semEquipe: true };
  return { equipeId: filtro };
}

type ResetSenhaModalState = {
  open: boolean;
  userId: number | null;
  pessoaNome: string;
};

export function usePessoasGestao() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [pessoas, setPessoas] = useState<PessoaRecord[]>([]);
  const [rawItems, setRawItems] = useState<PessoaRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [equipesOpcoes, setEquipesOpcoes] = useState<EquipeApi[]>([]);
  const [situacaoFiltro, setSituacaoFiltroState] =
    useState<PessoaFiltroSituacao>('todos');
  const [acessoFiltro, setAcessoFiltroState] =
    useState<PessoaFiltroAcesso>('todos');
  const [equipeFiltro, setEquipeFiltroState] =
    useState<PessoaFiltroEquipe>('todos');
  const [cargoFiltro, setCargoFiltroState] =
    useState<PessoaFiltroCargo>('todos');
  const [busca, setBuscaState] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [pagina, setPagina] = useState(1);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSenhaModal, setResetSenhaModal] = useState<ResetSenhaModalState>({
    open: false,
    userId: null,
    pessoaNome: '',
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBuscaDebounced(busca);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    if (!unidadeId) {
      setEquipesOpcoes([]);
      return;
    }

    void listEquipes({ unidadeId, page: 1, limit: 100 })
      .then((response) => setEquipesOpcoes(response.items))
      .catch(() => setEquipesOpcoes([]));
  }, [unidadeId]);

  const equipeFiltroOpcoes = useMemo(
    () => [
      { value: 'todos' as const, label: 'Todas equipes' },
      { value: 'sem_equipe' as const, label: 'Sem equipe' },
      ...equipesOpcoes.map((equipe) => ({
        value: equipe.id as PessoaFiltroEquipe,
        label: equipe.nome,
      })),
    ],
    [equipesOpcoes],
  );

  const loadPessoas = useCallback(async () => {
    setIsLoading(true);

    try {
      const equipeParams = mapEquipeFiltroToApi(equipeFiltro);

      const response = await listPessoas({
        page: pagina,
        limit: PAGE_SIZE,
        unidadeId,
        situacao: mapSituacaoFiltroToApi(situacaoFiltro),
        cargo: cargoFiltro === 'todos' ? undefined : cargoFiltro,
        temAcesso: mapAcessoFiltroToApi(acessoFiltro),
        search: buscaDebounced.trim() || undefined,
        ...equipeParams,
      });

      const mapped = response.items.map(mapPessoaToRecord);
      setRawItems(mapped);
      setPessoas(mapped);
      setTotal(response.total);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao carregar pessoas';
      toast.error(message);
      setPessoas([]);
      setRawItems([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    acessoFiltro,
    buscaDebounced,
    cargoFiltro,
    equipeFiltro,
    pagina,
    situacaoFiltro,
    unidadeId,
  ]);

  useEffect(() => {
    void loadPessoas();
  }, [loadPessoas]);

  const kpi = useMemo(
    () =>
      buildPessoaKpi(
        rawItems.map((item) => ({
          funcionarioId: item.funcionarioId,
          matricula: item.matricula,
          nome: item.nome,
          cargo: 'separador',
          situacao:
            item.situacao === 'ativo'
              ? 'ativo'
              : item.situacao === 'bloqueado'
                ? 'bloqueado'
                : 'desligado',
          unidadeId: item.unidadeId,
          dataAdmissao: new Date().toISOString(),
          equipeId: item.equipeId,
          equipeNome: item.equipeNome,
          userId: item.userId,
          userStatus:
            item.acesso === 'sem_acesso'
              ? null
              : item.acesso === 'ativo'
                ? 'ativo'
                : item.acesso === 'bloqueado'
                  ? 'bloqueado'
                  : item.acesso === 'pendente'
                    ? 'pendente'
                    : 'inativo',
          userRole:
            item.perfil === 'admin'
              ? 'admin'
              : item.perfil === 'lider'
                ? 'leader'
              : item.perfil === 'operador'
                ? 'operator'
                : null,
          mustChangePassword: null,
          userEmail: null,
        })),
        total,
      ),
    [rawItems, total],
  );

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = (paginaSegura - 1) * PAGE_SIZE;

  const temFiltrosAtivos =
    situacaoFiltro !== 'todos' ||
    acessoFiltro !== 'todos' ||
    equipeFiltro !== 'todos' ||
    cargoFiltro !== 'todos' ||
    busca.trim().length > 0;

  const resetFiltros = useCallback(() => {
    setSituacaoFiltroState('todos');
    setAcessoFiltroState('todos');
    setEquipeFiltroState('todos');
    setCargoFiltroState('todos');
    setBuscaState('');
    setBuscaDebounced('');
    setPagina(1);
  }, []);

  const setSituacaoFiltro = useCallback((status: PessoaFiltroSituacao) => {
    setSituacaoFiltroState(status);
    setPagina(1);
  }, []);

  const setAcessoFiltro = useCallback((filtro: PessoaFiltroAcesso) => {
    setAcessoFiltroState(filtro);
    setPagina(1);
  }, []);

  const setEquipeFiltro = useCallback((filtro: PessoaFiltroEquipe) => {
    setEquipeFiltroState(filtro);
    setPagina(1);
  }, []);

  const setCargoFiltro = useCallback((filtro: PessoaFiltroCargo) => {
    setCargoFiltroState(filtro);
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

  const abrirResetSenha = useCallback(
    (funcionarioId: string) => {
      const pessoa = pessoas.find((item) => item.id === funcionarioId);

      if (!pessoa?.userId) {
        toast.error('Esta pessoa não possui acesso ao sistema');
        return;
      }

      setResetSenhaModal({
        open: true,
        userId: pessoa.userId,
        pessoaNome: pessoa.nome,
      });
    },
    [pessoas],
  );

  const fecharResetSenha = useCallback((open: boolean) => {
    if (!open) {
      setResetSenhaModal({
        open: false,
        userId: null,
        pessoaNome: '',
      });
    }
  }, []);

  const confirmarResetSenha = useCallback(
    async (password: string) => {
      if (!resetSenhaModal.userId) {
        throw new Error('Usuário não selecionado');
      }

      setIsResettingPassword(true);

      try {
        await resetUserPassword(resetSenhaModal.userId, password);
        toast.success('Senha temporária definida', {
          description: 'O usuário precisará trocar a senha no próximo login.',
        });
        await loadPessoas();
      } finally {
        setIsResettingPassword(false);
      }
    },
    [loadPessoas, resetSenhaModal.userId],
  );

  const bloquearAcesso = useCallback(
    async (funcionarioId: string) => {
      const pessoa = pessoas.find((item) => item.id === funcionarioId);

      if (!pessoa?.userId) {
        toast.error('Esta pessoa não possui acesso ao sistema');
        return;
      }

      setIsLoading(true);
      try {
        await blockUser(pessoa.userId);
        toast.warning('Acesso bloqueado');
        await loadPessoas();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro ao bloquear acesso';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [loadPessoas, pessoas],
  );

  const desbloquearAcesso = useCallback(
    async (funcionarioId: string) => {
      const pessoa = pessoas.find((item) => item.id === funcionarioId);

      if (!pessoa?.userId) {
        toast.error('Esta pessoa não possui acesso ao sistema');
        return;
      }

      setIsLoading(true);
      try {
        await unblockUser(pessoa.userId);
        toast.success('Acesso desbloqueado');
        await loadPessoas();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro ao desbloquear acesso';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [loadPessoas, pessoas],
  );

  const desligar = useCallback(
    async (funcionarioId: string) => {
      setIsLoading(true);
      try {
        await updateFuncionario(Number(funcionarioId), {
          situacao: 'desligado',
        });
        toast.success('Pessoa desligada');
        await loadPessoas();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro ao desligar pessoa';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [loadPessoas],
  );

  const exportarCsv = useCallback(async () => {
    toast.success('Exportação iniciada', {
      description: `${total} registros`,
    });
  }, [total]);

  return {
    isLoading,
    kpi,
    pessoas,
    situacaoFiltro,
    setSituacaoFiltro,
    situacaoFiltroOpcoes: SITUACAO_FILTRO_OPCOES,
    acessoFiltro,
    setAcessoFiltro,
    acessoFiltroOpcoes: ACESSO_FILTRO_OPCOES,
    equipeFiltro,
    setEquipeFiltro,
    equipeFiltroOpcoes,
    cargoFiltro,
    setCargoFiltro,
    busca,
    setBusca,
    temFiltrosAtivos,
    resetFiltros,
    pagina: paginaSegura,
    setPagina: setPaginaSafe,
    totalPaginas,
    totalFiltrados: total,
    itemsInicio,
    pageSize: PAGE_SIZE,
    resetSenhaModal,
    isResettingPassword,
    abrirResetSenha,
    fecharResetSenha,
    confirmarResetSenha,
    bloquearAcesso,
    desbloquearAcesso,
    desligar,
    exportarCsv,
    recarregar: loadPessoas,
  };
}
