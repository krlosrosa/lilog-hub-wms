'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  blockUser,
  buildUsuarioKpi,
  listUsers,
  mapUserToRecord,
  resetUserPassword,
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

type ResetSenhaModalState = {
  open: boolean;
  usuarioId: string | null;
  usuarioNome: string;
};

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
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSenhaModal, setResetSenhaModal] = useState<ResetSenhaModalState>({
    open: false,
    usuarioId: null,
    usuarioNome: '',
  });

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
              : usuario.perfil === 'lider'
                ? 'leader'
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

  const abrirResetSenha = useCallback(
    (id: string) => {
      const usuario = usuarios.find((item) => item.id === id);

      setResetSenhaModal({
        open: true,
        usuarioId: id,
        usuarioNome: usuario?.nome ?? 'usuário',
      });
    },
    [usuarios],
  );

  const fecharResetSenha = useCallback((open: boolean) => {
    if (!open) {
      setResetSenhaModal({
        open: false,
        usuarioId: null,
        usuarioNome: '',
      });
    }
  }, []);

  const confirmarResetSenha = useCallback(
    async (password: string) => {
      if (!resetSenhaModal.usuarioId) {
        throw new Error('Usuário não selecionado');
      }

      setIsResettingPassword(true);

      try {
        await resetUserPassword(Number(resetSenhaModal.usuarioId), password);
        toast.success('Senha temporária definida', {
          description:
            'O usuário precisará trocar a senha no próximo login.',
        });
        await loadUsuarios();
      } finally {
        setIsResettingPassword(false);
      }
    },
    [loadUsuarios, resetSenhaModal.usuarioId],
  );

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
    resetSenhaModal,
    isResettingPassword,
    abrirResetSenha,
    fecharResetSenha,
    confirmarResetSenha,
    suspender,
    desbloquear,
    excluir,
    exportarCsv,
  };
}
