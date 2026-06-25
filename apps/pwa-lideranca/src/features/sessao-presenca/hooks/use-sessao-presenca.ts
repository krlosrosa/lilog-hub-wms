import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  abrirSessao,
  encerrarSessao,
  getSessao,
  listSessaoFuncionarios,
  updateSessaoFuncionarioPresenca,
} from '../api';
import { calcularPresencaStats, filtrarFuncionarios } from '../lib/presenca-stats';
import type {
  FeatureToast,
  PresencaFiltro,
  SessaoApi,
  SessaoFuncionarioApi,
  SessaoPresencaStatusApi,
} from '../types';

const TOAST_DURATION_MS = 2500;

export function useSessaoPresenca(sessaoId: string) {
  const navigate = useNavigate();

  const [sessao, setSessao] = useState<SessaoApi | null>(null);
  const [funcionarios, setFuncionarios] = useState<SessaoFuncionarioApi[]>([]);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<PresencaFiltro>('pendentes');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<FeatureToast | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, variant: FeatureToast['variant']) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      setToast({ message, variant });
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
      }, TOAST_DURATION_MS);
    },
    [],
  );

  const load = useCallback(async () => {
    setIsLoading(true);

    try {
      const [sessaoResponse, funcionariosResponse] = await Promise.all([
        getSessao(sessaoId),
        listSessaoFuncionarios(sessaoId),
      ]);
      setSessao(sessaoResponse);
      setFuncionarios(funcionariosResponse.items);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível carregar a sessão.';
      showToast(message, 'error');
      setSessao(null);
      setFuncionarios([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessaoId, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(
    () => calcularPresencaStats(funcionarios),
    [funcionarios],
  );

  const funcionariosFiltrados = useMemo(
    () => filtrarFuncionarios(funcionarios, filtro, busca),
    [busca, filtro, funcionarios],
  );

  const editavel = sessao?.status === 'aberta';

  const atualizarPresenca = useCallback(
    async (
      funcionarioId: number,
      status: SessaoPresencaStatusApi,
      observacao?: string | null,
    ) => {
      if (!editavel) return;

      const previous = funcionarios.find(
        (f) => f.funcionarioId === funcionarioId,
      );
      if (!previous) return;

      const optimistic: SessaoFuncionarioApi = {
        ...previous,
        status,
        checkIn:
          status === 'presente' || status === 'atraso'
            ? new Date().toISOString()
            : previous.checkIn,
        observacao: observacao ?? previous.observacao,
      };

      setFuncionarios((prev) =>
        prev.map((f) => (f.funcionarioId === funcionarioId ? optimistic : f)),
      );
      setUpdatingIds((prev) => new Set(prev).add(funcionarioId));

      try {
        const payload: {
          status: SessaoPresencaStatusApi;
          checkIn?: string;
          observacao?: string | null;
        } = { status };

        if (status === 'presente' || status === 'atraso') {
          payload.checkIn = new Date().toISOString();
        }

        if (observacao !== undefined) {
          payload.observacao = observacao;
        }

        const updated = await updateSessaoFuncionarioPresenca(
          sessaoId,
          funcionarioId,
          payload,
        );

        setFuncionarios((prev) =>
          prev.map((f) => (f.funcionarioId === funcionarioId ? updated : f)),
        );
      } catch (error) {
        setFuncionarios((prev) =>
          prev.map((f) => (f.funcionarioId === funcionarioId ? previous : f)),
        );
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível atualizar a presença.';
        showToast(message, 'error');
      } finally {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(funcionarioId);
          return next;
        });
      }
    },
    [editavel, funcionarios, sessaoId, showToast],
  );

  const handleAbrir = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const updated = await abrirSessao(sessaoId);
      setSessao(updated);
      showToast('Sessão aberta.', 'success');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível abrir a sessão.';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [sessaoId, showToast]);

  const handleEncerrar = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const updated = await encerrarSessao(sessaoId);
      setSessao(updated);
      showToast('Sessão encerrada.', 'success');
      void navigate({ to: '/sessao-presenca' });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível encerrar a sessão.';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [navigate, sessaoId, showToast]);

  return {
    state: {
      sessao,
      funcionarios: funcionariosFiltrados,
      stats,
      busca,
      filtro,
      isLoading,
      isSubmitting,
      updatingIds,
      editavel,
      toast,
    },
    actions: {
      setBusca,
      setFiltro,
      atualizarPresenca,
      handleAbrir,
      handleEncerrar,
      refresh: load,
      showToast,
      dismissToast,
    },
  };
}
