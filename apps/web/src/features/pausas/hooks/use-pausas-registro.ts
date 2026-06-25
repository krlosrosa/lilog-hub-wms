'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { toast } from 'sonner';

import { ApiClientError } from '@/lib/api';
import {
  formatMatriculaDisplay,
  getElapsedSeconds,
  normalizeMatricula,
} from '@/features/pausas/lib/pausas-mappers';
import { useSessaoAtivaPausas } from '@/features/pausas/hooks/use-sessao-ativa-pausas';
import {
  PAUSA_TIPO_REGISTRO_LABELS,
  type PausaTipoRegistro,
  type RegistroOperador,
} from '@/features/pausas/types/pausas.schema';
import {
  finalizarSessaoFuncionarioPausa,
  iniciarSessaoFuncionarioPausa,
  listSessaoFuncionarioPausas,
} from '@/features/sessao-operacao/lib/sessao-operacao-api';

export type RegistroStep = 'idle' | 'selecting' | 'active';

function formatTimer(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function usePausasRegistro() {
  const {
    sessaoAtiva,
    funcionarios,
    isLoading: isLoadingSessao,
    semUnidade,
    semSessaoAberta,
    reload: reloadSessao,
  } = useSessaoAtivaPausas();

  const [step, setStep] = useState<RegistroStep>('idle');
  const [operatorId, setOperatorIdState] = useState('');
  const [selectedType, setSelectedType] = useState<PausaTipoRegistro | null>(
    null,
  );
  const [operador, setOperador] = useState<RegistroOperador | null>(null);
  const [pausaInicioIso, setPausaInicioIso] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const normalizedId = normalizeMatricula(operatorId);
  const displayId = formatMatriculaDisplay(operatorId);

  const activeLabel = selectedType
    ? `${PAUSA_TIPO_REGISTRO_LABELS[selectedType]} Ativa`
    : 'Pausa Ativa';

  const resetForm = useCallback(() => {
    setStep('idle');
    setOperatorIdState('');
    setSelectedType(null);
    setOperador(null);
    setPausaInicioIso(null);
    setTimerSeconds(0);
  }, []);

  const resolveOperador = useCallback(
    (matricula: string): RegistroOperador | null => {
      const digits = normalizeMatricula(matricula);
      if (digits.length < 3) return null;

      const found = funcionarios.find(
        (f) => normalizeMatricula(f.matricula) === digits,
      );

      if (!found) return null;

      return {
        id: String(found.funcionarioId),
        funcionarioId: found.funcionarioId,
        nome: found.nome,
        matricula: found.matricula,
      };
    },
    [funcionarios],
  );

  const checkPausaAberta = useCallback(
    async (funcionarioId: number) => {
      if (!sessaoAtiva) return null;

      const pausas = await listSessaoFuncionarioPausas(
        sessaoAtiva.id,
        funcionarioId,
      );

      return pausas.emPausaAgora;
    },
    [sessaoAtiva],
  );

  const setOperatorId = useCallback(
    async (value: string) => {
      setOperatorIdState(value);
      const id = normalizeMatricula(value);

      if (id.length < 3) {
        setStep('idle');
        setSelectedType(null);
        setOperador(null);
        setPausaInicioIso(null);
        return;
      }

      const resolved = resolveOperador(value);
      if (!resolved) {
        setOperador(null);
        setStep('idle');
        return;
      }

      setOperador(resolved);

      if (!sessaoAtiva) return;

      try {
        const pausaAberta = await checkPausaAberta(resolved.funcionarioId);
        if (pausaAberta) {
          setSelectedType(pausaAberta.tipo);
          setPausaInicioIso(pausaAberta.inicio);
          setStep('active');
          return;
        }
      } catch {
        toast.error('Não foi possível verificar pausas do operador.');
        return;
      }

      setStep('selecting');
      setSelectedType(null);
      setPausaInicioIso(null);
    },
    [resolveOperador, sessaoAtiva, checkPausaAberta],
  );

  const selectTipo = useCallback((tipo: PausaTipoRegistro) => {
    setSelectedType(tipo);
  }, []);

  const startPause = useCallback(async () => {
    if (!selectedType) {
      return { success: false as const, error: 'Selecione um tipo de pausa.' };
    }

    if (!operador || !sessaoAtiva) {
      return { success: false as const, error: 'Operador ou sessão inválidos.' };
    }

    setIsSubmitting(true);

    try {
      const pausa = await iniciarSessaoFuncionarioPausa(
        sessaoAtiva.id,
        operador.funcionarioId,
        { tipo: selectedType },
      );
      setPausaInicioIso(pausa.inicio);
      setStep('active');
      return { success: true as const };
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 403) {
          toast.error('Sem permissão para gerenciar pausas.');
        } else if (error.status === 409) {
          toast.error('Operador já possui uma pausa em andamento.');
          const pausaAberta = await checkPausaAberta(operador.funcionarioId);
          if (pausaAberta) {
            setSelectedType(pausaAberta.tipo);
            setPausaInicioIso(pausaAberta.inicio);
            setStep('active');
          }
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Não foi possível iniciar a pausa.');
      }
      return { success: false as const, error: 'Falha ao iniciar pausa.' };
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedType, operador, sessaoAtiva, checkPausaAberta]);

  const finishPause = useCallback(async () => {
    if (!operador || !sessaoAtiva) {
      return { success: false as const };
    }

    setIsSubmitting(true);

    try {
      await finalizarSessaoFuncionarioPausa(
        sessaoAtiva.id,
        operador.funcionarioId,
      );
      resetForm();
      await reloadSessao();
      return { success: true as const };
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 403) {
          toast.error('Sem permissão para gerenciar pausas.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Não foi possível finalizar a pausa.');
      }
      return { success: false as const };
    } finally {
      setIsSubmitting(false);
    }
  }, [operador, sessaoAtiva, resetForm, reloadSessao]);

  useEffect(() => {
    if (step !== 'active' || !pausaInicioIso) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const updateTimer = () => {
      setTimerSeconds(getElapsedSeconds(pausaInicioIso));
    };

    updateTimer();
    intervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [step, pausaInicioIso]);

  const showSelection = step === 'selecting' && operador != null;
  const showActive = step === 'active';
  const showIdEntry = !showActive;

  return {
    step,
    operatorId,
    setOperatorId,
    normalizedId,
    operador,
    displayId,
    selectedType,
    selectTipo,
    startPause,
    finishPause,
    timerDisplay: formatTimer(timerSeconds),
    activeLabel,
    showSelection,
    showActive,
    showIdEntry,
    isLoading: isLoadingSessao,
    isSubmitting,
    semUnidade,
    semSessaoAberta,
    sessaoAtiva,
  };
}
