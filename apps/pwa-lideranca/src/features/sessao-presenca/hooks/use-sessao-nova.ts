import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useUnidade } from '@/features/unidade';

import { abrirSessao, createSessao, listEscalas } from '../api';
import { formatHorarioIntervalo, todayReference } from '../lib/sessao-labels';
import type { EscalaApi, FeatureToast } from '../types';

const TOAST_DURATION_MS = 2500;

export function useSessaoNova() {
  const navigate = useNavigate();
  const { unidadeSelecionada, isLoading: isUnidadeLoading } = useUnidade();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const [escalas, setEscalas] = useState<EscalaApi[]>([]);
  const [escalaId, setEscalaId] = useState('');
  const [dataReferencia, setDataReferencia] = useState(todayReference);
  const [busca, setBusca] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    async function loadEscalas() {
      if (!unidadeId) {
        setEscalas([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const response = await listEscalas({ unidadeId, limit: 100 });
        setEscalas(response.items.filter((item) => item.ativo));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Falha ao carregar escalas';
        showToast(message, 'error');
        setEscalas([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (!isUnidadeLoading) {
      void loadEscalas();
    }
  }, [isUnidadeLoading, showToast, unidadeId]);

  const escalaSelecionada = useMemo(
    () => escalas.find((item) => item.id === escalaId) ?? null,
    [escalas, escalaId],
  );

  const escalasFiltradas = useMemo(() => {
    const term = busca.toLowerCase().trim();
    if (!term) return escalas;
    return escalas.filter(
      (e) =>
        e.nome.toLowerCase().includes(term) ||
        e.equipeNome.toLowerCase().includes(term),
    );
  }, [busca, escalas]);

  const preview = useMemo(() => {
    if (!escalaSelecionada) return null;
    return {
      equipeNome: escalaSelecionada.equipeNome,
      intervalo: formatHorarioIntervalo(
        escalaSelecionada.horaInicioPlanejada,
        escalaSelecionada.horaFimPlanejada,
      ),
      cruzaMeiaNoite: escalaSelecionada.cruzaMeiaNoite,
      totalFuncionarios: escalaSelecionada.totalFuncionarios,
    };
  }, [escalaSelecionada]);

  const criar = useCallback(
    async (abrirAposCriar: boolean) => {
      if (!escalaId) {
        showToast('Selecione uma escala.', 'error');
        return;
      }

      if (!dataReferencia) {
        showToast('Informe a data de referência.', 'error');
        return;
      }

      setIsSubmitting(true);

      try {
        let sessao = await createSessao({ escalaId, dataReferencia });

        if (abrirAposCriar) {
          sessao = await abrirSessao(sessao.id);
          showToast('Sessão criada e aberta.', 'success');
        } else {
          showToast('Sessão criada com sucesso.', 'success');
        }

        void navigate({
          to: '/sessao-presenca/$sessaoId',
          params: { sessaoId: sessao.id },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Não foi possível criar a sessão.';
        showToast(message, 'error');
      } finally {
        setIsSubmitting(false);
      }
    },
    [dataReferencia, escalaId, navigate, showToast],
  );

  return {
    state: {
      unidadeId,
      escalas: escalasFiltradas,
      escalaId,
      dataReferencia,
      busca,
      preview,
      isLoading: isUnidadeLoading || isLoading,
      isSubmitting,
      missingUnidadeId: !isUnidadeLoading && !unidadeId,
      isEmpty: !isLoading && escalas.length === 0,
      toast,
    },
    actions: {
      setEscalaId,
      setDataReferencia,
      setBusca,
      criar,
      showToast,
      dismissToast,
    },
  };
}
