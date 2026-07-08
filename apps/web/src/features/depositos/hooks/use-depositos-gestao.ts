'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  createDeposito,
  listDepositos,
  mapDepositoToListaItem,
  updateDeposito,
} from '@/features/depositos/lib/deposito-api';
import type {
  DepositoFormValues,
  DepositoListaItem,
} from '@/features/depositos/types/depositos-gestao.schema';
import { ApiClientError } from '@/lib/api';

export type DepositoDialogMode = 'create' | 'edit';

export function useDepositosGestao() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositos, setDepositos] = useState<DepositoListaItem[]>([]);
  const [busca, setBusca] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DepositoDialogMode>('create');
  const [depositoEmEdicao, setDepositoEmEdicao] =
    useState<DepositoListaItem | null>(null);

  const recarregar = useCallback(async () => {
    if (!unidadeId) {
      setDepositos([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await listDepositos(unidadeId);
      setDepositos(response.items.map(mapDepositoToListaItem));
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar os depósitos.';
      toast.error(message);
      setDepositos([]);
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const depositosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) {
      return depositos;
    }

    return depositos.filter(
      (item) =>
        item.codigo.toLowerCase().includes(termo) ||
        item.nome.toLowerCase().includes(termo),
    );
  }, [busca, depositos]);

  const stats = useMemo(() => {
    return {
      total: depositos.length,
      ativos: depositos.filter((item) => item.ativo).length,
      sistema: depositos.filter((item) => item.sistema).length,
      customizados: depositos.filter((item) => !item.sistema).length,
    };
  }, [depositos]);

  const abrirCriacao = useCallback(() => {
    setDialogMode('create');
    setDepositoEmEdicao(null);
    setDialogOpen(true);
  }, []);

  const abrirEdicao = useCallback((deposito: DepositoListaItem) => {
    setDialogMode('edit');
    setDepositoEmEdicao(deposito);
    setDialogOpen(true);
  }, []);

  const fecharDialog = useCallback((open: boolean) => {
    setDialogOpen(open);

    if (!open) {
      setDepositoEmEdicao(null);
    }
  }, []);

  const salvarDeposito = useCallback(
    async (values: DepositoFormValues) => {
      if (!unidadeId) {
        toast.error('Selecione uma unidade para continuar.');
        return;
      }

      setIsSubmitting(true);

      try {
        if (dialogMode === 'create') {
          await createDeposito({
            unidadeId,
            codigo: values.codigo.trim().toUpperCase(),
            nome: values.nome.trim(),
            finalidade: values.finalidade,
            permiteVenda: values.permiteVenda,
            permitePicking: values.permitePicking,
            exigeEndereco: values.exigeEndereco,
            contaDisponivel: values.contaDisponivel,
          });
          toast.success('Depósito criado com sucesso.');
        } else if (depositoEmEdicao) {
          await updateDeposito(depositoEmEdicao.id, {
            nome: depositoEmEdicao.sistema ? undefined : values.nome.trim(),
            permiteVenda: values.permiteVenda,
            permitePicking: values.permitePicking,
            exigeEndereco: values.exigeEndereco,
            contaDisponivel: values.contaDisponivel,
          });
          toast.success('Depósito atualizado com sucesso.');
        }

        setDialogOpen(false);
        setDepositoEmEdicao(null);
        await recarregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível salvar o depósito.';
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [depositoEmEdicao, dialogMode, recarregar, unidadeId],
  );

  const alternarAtivo = useCallback(
    async (deposito: DepositoListaItem) => {
      if (deposito.sistema) {
        toast.error('Depósitos de sistema não podem ser inativados.');
        return;
      }

      setIsSubmitting(true);

      try {
        await updateDeposito(deposito.id, { ativo: !deposito.ativo });
        toast.success(
          deposito.ativo
            ? 'Depósito inativado com sucesso.'
            : 'Depósito reativado com sucesso.',
        );
        await recarregar();
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível alterar o status do depósito.';
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [recarregar],
  );

  return {
    unidadeId,
    isLoading,
    isSubmitting,
    depositos: depositosFiltrados,
    stats,
    busca,
    setBusca,
    dialogOpen,
    dialogMode,
    depositoEmEdicao,
    abrirCriacao,
    abrirEdicao,
    fecharDialog,
    salvarDeposito,
    alternarAtivo,
    recarregar,
  };
}
