'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  blockUser,
  buildUsuarioKpi,
  listUsers,
  mapUserToRecord,
  unblockUser,
} from '@/features/usuarios/lib/usuario-api';
import type { UserStatusApi } from '@/features/usuarios/types/usuario.api';
import type {
  UsuarioFiltroStatus,
  UsuarioRecord,
} from '@/features/usuarios/types/usuarios-gestao.schema';

const PAGE_SIZE = 10;

const STATUS_FILTRO_OPCOES = [
  { value: 'todos' as const, label: 'Todos' },
  { value: 'ativo' as const, label: 'Ativos' },
  { value: 'inativo' as const, label: 'Inativos' },
  { value: 'bloqueado' as const, label: 'Bloqueados' },
];

function mapFiltroToApiStatus(
  status: UsuarioFiltroStatus,
): UserStatusApi | undefined {
  if (status === 'todos') return undefined;
  if (status === 'inativo') return 'inativo';
  return status;
}

export function useUsuariosGestao() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<UsuarioRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFiltro, setStatusFiltroState] =
    useState<UsuarioFiltroStatus>('todos');
  const [busca, setBuscaState] = useState('');
  const [pagina, setPagina] = useState(1);

  const loadUsuarios = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await listUsers({
        page: pagina,
        limit: PAGE_SIZE,
        unidadeId,
        status: mapFiltroToApiStatus(statusFiltro),
        search: busca.trim() || undefined,
      });

      setUsuarios(response.items.map(mapUserToRecord));
      setTotal(response.total);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao carregar usuários';
      toast.error(message);
      setUsuarios([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [busca, pagina, statusFiltro, unidadeId]);

  useEffect(() => {
    void loadUsuarios();
  }, [loadUsuarios]);

  const kpi = useMemo(
    () =>
      buildUsuarioKpi(
        usuarios.map((usuario) => ({
          id: Number(usuario.id),
          name: usuario.nome,
          email: usuario.email,
          role:
            usuario.perfil === 'admin'
              ? 'admin'
              : usuario.perfil === 'gerente'
                ? 'manager'
                : 'operator',
          status:
            usuario.status === 'bloqueado'
              ? 'bloqueado'
              : usuario.status === 'ativo'
                ? 'ativo'
                : 'inativo',
          funcionarioId: null,
          createdAt: new Date().toISOString(),
        })),
        total,
      ),
    [total, usuarios],
  );

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = (paginaSegura - 1) * PAGE_SIZE;

  const setStatusFiltro = useCallback((status: UsuarioFiltroStatus) => {
    setStatusFiltroState(status);
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

  const resetPermissoes = useCallback(async (id: string) => {
    toast.info('Reset de permissões', {
      description: 'Funcionalidade disponível em Perfis e Permissões.',
    });
  }, []);

  const suspender = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        await blockUser(Number(id));
        toast.warning('Usuário suspenso');
        await loadUsuarios();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro ao suspender usuário';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [loadUsuarios],
  );

  const desbloquear = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        await unblockUser(Number(id));
        toast.success('Usuário desbloqueado');
        await loadUsuarios();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro ao desbloquear usuário';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [loadUsuarios],
  );

  const excluir = useCallback(async (id: string) => {
    toast.info('Exclusão indisponível', {
      description: 'Utilize a inativação do usuário pelo cadastro.',
    });
  }, []);

  const exportarCsv = useCallback(async () => {
    toast.success('Exportação iniciada', {
      description: `${total} registros`,
    });
  }, [total]);

  return {
    isLoading,
    kpi,
    usuarios,
    statusFiltro,
    setStatusFiltro,
    statusFiltroOpcoes: STATUS_FILTRO_OPCOES,
    busca,
    setBusca,
    pagina: paginaSegura,
    setPagina: setPaginaSafe,
    totalPaginas,
    totalFiltrados: total,
    itemsInicio,
    pageSize: PAGE_SIZE,
    resetPermissoes,
    suspender,
    desbloquear,
    excluir,
    exportarCsv,
  };
}
