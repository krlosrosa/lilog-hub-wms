'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import {
  abrirSessao,
  cancelarSessao,
  encerrarSessao,
  getSessao,
  listSessaoFuncionarios,
  updateSessaoFuncionarioPresenca,
} from '@/features/sessao-operacao/lib/sessao-operacao-api';
import type {
  SessaoApi,
  SessaoFuncionarioApi,
  SessaoPresencaStatusApi,
} from '@/features/sessao-operacao/types/sessao.api';

export function useSessaoDetalhe(sessaoId: string) {
  const router = useRouter();
  const [sessao, setSessao] = useState<SessaoApi | null>(null);
  const [funcionarios, setFuncionarios] = useState<SessaoFuncionarioApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);

    try {
      const [sessaoResponse, funcionariosResponse] = await Promise.all([
        getSessao(sessaoId),
        listSessaoFuncionarios(sessaoId),
      ]);
      setSessao(sessaoResponse);
      setFuncionarios(funcionariosResponse.items);
    } catch {
      toast.error('Não foi possível carregar a sessão.');
      setSessao(null);
      setFuncionarios([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessaoId]);

  useEffect(() => {
    void load();
  }, [load]);

  const executarAcao = async (
    action: () => Promise<SessaoApi>,
    successMessage: string,
  ) => {
    setIsSubmitting(true);

    try {
      const updated = await action();
      setSessao(updated);
      toast.success(successMessage);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível executar a ação.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAbrir = () =>
    executarAcao(() => abrirSessao(sessaoId), 'Sessão aberta.');

  const handleEncerrar = () =>
    executarAcao(() => encerrarSessao(sessaoId), 'Sessão encerrada.');

  const handleCancelar = async () => {
    setIsSubmitting(true);

    try {
      await cancelarSessao(sessaoId);
      toast.success('Sessão cancelada.');
      router.push('/sessao-operacao/sessoes');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível cancelar.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const atualizarPresenca = async (
    funcionarioId: number,
    status: SessaoPresencaStatusApi,
  ) => {
    setIsSubmitting(true);

    try {
      const payload: {
        status: SessaoPresencaStatusApi;
        checkIn?: string;
      } = { status };

      if (status === 'presente' || status === 'atraso') {
        payload.checkIn = new Date().toISOString();
      }

      const updated = await updateSessaoFuncionarioPresenca(
        sessaoId,
        funcionarioId,
        payload,
      );

      setFuncionarios((prev) =>
        prev.map((item) =>
          item.funcionarioId === funcionarioId ? updated : item,
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a presença.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    sessao,
    funcionarios,
    pendentesCount: funcionarios.filter((f) => f.status === 'esperado').length,
    isLoading,
    isSubmitting,
    handleAbrir,
    handleEncerrar,
    handleCancelar,
    atualizarPresenca,
    reload: load,
  };
}
