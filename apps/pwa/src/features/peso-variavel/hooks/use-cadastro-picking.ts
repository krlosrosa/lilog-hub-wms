import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { hapticMedium } from '@/lib/haptics';

import {
  getEtiquetaByCodigo,
  getEtiquetasByTarefaId,
  getTarefaById,
} from '../data/peso-variavel-seed';
import {
  cadastroPickingSchema,
  type CadastroPickingForm,
  type CaixaRegistrada,
  type Etiqueta,
} from '../types/peso-variavel.schema';

export type CadastroPickingToast = {
  message: string;
  variant: 'success' | 'error';
};

const TOAST_DURATION_MS = 2500;
const SCAN_PROCESSING_MS = 300;
const PESO_VAZIO = '';

export function useCadastroPicking(tarefaId: string) {
  const navigate = useNavigate();
  const etiquetas = useMemo(
    () => getEtiquetasByTarefaId(tarefaId),
    [tarefaId],
  );
  const tarefa = useMemo(() => getTarefaById(tarefaId), [tarefaId]);

  const [conferidas, setConferidas] = useState<CaixaRegistrada[]>([]);
  const [etiquetaAtual, setEtiquetaAtual] = useState<Etiqueta | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isListMode, setIsListMode] = useState(false);
  const [toast, setToast] = useState<CadastroPickingToast | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalEtiquetas = etiquetas.length;
  const conferidasCount = conferidas.length;
  const todasConferidas = conferidasCount >= totalEtiquetas && totalEtiquetas > 0;

  const form = useForm<CadastroPickingForm>({
    resolver: zodResolver(cadastroPickingSchema),
    defaultValues: { pesoCaixaAtual: PESO_VAZIO },
    mode: 'onChange',
  });

  const pesoAcumulado = useMemo(
    () => conferidas.reduce((acc, c) => acc + c.pesoKg, 0),
    [conferidas],
  );

  const progressPercent = useMemo(
    () =>
      totalEtiquetas > 0 ? (conferidasCount / totalEtiquetas) * 100 : 0,
    [conferidasCount, totalEtiquetas],
  );

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, variant: CadastroPickingToast['variant']) => {
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

  const goToResumo = useCallback(() => {
    void navigate({
      to: '/peso-variavel/$id/resumo',
      params: { id: tarefaId },
    });
  }, [navigate, tarefaId]);

  const toggleListMode = useCallback(() => {
    setIsListMode((prev) => !prev);
  }, []);

  const setListMode = useCallback((open: boolean) => {
    setIsListMode(open);
  }, []);

  const handleScanLabel = useCallback(
    async (codigo: string) => {
      const trimmed = codigo.trim();
      if (!trimmed || isScanning || etiquetaAtual != null) return;

      setIsScanning(true);
      hapticMedium();
      await new Promise((resolve) => setTimeout(resolve, SCAN_PROCESSING_MS));
      setIsScanning(false);

      const etiqueta = getEtiquetaByCodigo(tarefaId, trimmed);
      if (!etiqueta) {
        showToast('Etiqueta não encontrada nesta tarefa.', 'error');
        return;
      }

      const jaConferida = conferidas.some((c) => c.etiquetaId === etiqueta.id);
      if (jaConferida) {
        showToast('Esta etiqueta já foi conferida.', 'error');
        return;
      }

      setEtiquetaAtual(etiqueta);
      form.setValue('pesoCaixaAtual', PESO_VAZIO, {
        shouldValidate: false,
      });
      showToast(
        `${etiqueta.nome} · ${etiqueta.lote} — informe o peso.`,
        'success',
      );
    },
    [isScanning, etiquetaAtual, tarefaId, conferidas, form, showToast],
  );

  const handleCancelarEtiqueta = useCallback(() => {
    setEtiquetaAtual(null);
    form.setValue('pesoCaixaAtual', PESO_VAZIO, {
      shouldValidate: false,
    });
    showToast('Conferência cancelada. Bipe outra etiqueta.', 'success');
  }, [form, showToast]);

  const handleConfirmarPeso = useCallback(
    form.handleSubmit(async (data) => {
      if (!etiquetaAtual) {
        showToast('Bipe uma etiqueta antes de confirmar.', 'error');
        return;
      }

      hapticMedium();
      const pesoKg = Number(data.pesoCaixaAtual.replace(',', '.'));
      const novaConferida: CaixaRegistrada = {
        etiquetaId: etiquetaAtual.id,
        etiquetaCodigo: etiquetaAtual.codigo,
        sku: etiquetaAtual.sku,
        nome: etiquetaAtual.nome,
        lote: etiquetaAtual.lote,
        pesoKg,
      };

      const novasConferidas = [...conferidas, novaConferida];
      setConferidas(novasConferidas);
      setEtiquetaAtual(null);
      form.setValue('pesoCaixaAtual', PESO_VAZIO, {
        shouldValidate: false,
      });

      if (novasConferidas.length >= totalEtiquetas) {
        showToast('Todas as etiquetas conferidas. Abrindo resumo...', 'success');
        window.setTimeout(() => goToResumo(), 600);
        return;
      }

      const restantes = totalEtiquetas - novasConferidas.length;
      showToast(
        `Caixa registrada (${pesoKg.toFixed(2)} kg). ${restantes} etiqueta(s) restante(s).`,
        'success',
      );
    }),
    [
      etiquetaAtual,
      conferidas,
      totalEtiquetas,
      form,
      showToast,
      goToResumo,
    ],
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  return {
    state: {
      tarefa,
      etiquetas,
      conferidas,
      etiquetaAtual,
      totalEtiquetas,
      conferidasCount,
      todasConferidas,
      progressPercent,
      pesoAcumulado,
      isScanning,
      isListMode,
      form,
      toast,
      isSubmitting: form.formState.isSubmitting,
    },
    actions: {
      handleScanLabel,
      handleConfirmarPeso,
      handleCancelarEtiqueta,
      toggleListMode,
      setListMode,
      dismissToast,
    },
  };
}
