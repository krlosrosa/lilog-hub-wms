import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { hapticMedium } from '@/lib/haptics';
import { submitContagemValidacao } from '@/lib/offline/api-client';

import {
  calcularQuantidadeContadaUnidades,
  quantidadeContadaDivergeDoEsperado,
} from '../lib/calcular-quantidade-contagem';
import {
  contagemValidacaoFormSchema,
  type ContagemValidacaoForm,
  type SaldoEsperadoEndereco,
} from '../types/estoque.schema';

export type ContagemValidacaoToast = {
  message: string;
  variant: 'success' | 'error';
};

export type ProdutoValidacaoEsperado = {
  localizacao: string;
  nome: string;
  sku: string;
  lote: string;
  pesoTotal: string;
  quantidadeEsperada: number;
  unidadeMedida: string;
  ssccEsperado: string;
  instrucao: string;
  saldoEnderecoId?: string;
};

const TOAST_DURATION_MS = 2500;

const DEFAULT_VALUES: ContagemValidacaoForm = {
  enderecoConfirmado: '',
  sscc: '',
  enderecoVazio: false,
  anomaliaEncontrada: false,
  quantidadeCaixas: 0,
  quantidadeUnidades: 0,
  lote: '',
  peso: undefined,
};

export function mapSaldoEsperadoToProduto(
  endereco: string,
  saldo?: SaldoEsperadoEndereco,
): ProdutoValidacaoEsperado {
  if (!saldo) {
    return {
      localizacao: endereco,
      nome: 'Sem saldo registrado',
      sku: '—',
      lote: '—',
      pesoTotal: '—',
      quantidadeEsperada: 0,
      unidadeMedida: 'un',
      ssccEsperado: '',
      instrucao:
        'Não há saldo sistêmico neste endereço. Marque como vazio ou anomalia.',
    };
  }

  return {
    localizacao: endereco,
    nome: saldo.nome,
    sku: saldo.sku,
    lote: saldo.lote || '—',
    pesoTotal: '—',
    quantidadeEsperada: saldo.quantidade,
    unidadeMedida: saldo.unidadeMedida,
    ssccEsperado: saldo.numeroSerie || '',
    instrucao:
      'Confira fisicamente se o produto, lote e quantidade correspondem ao saldo do sistema.',
    saldoEnderecoId: saldo.saldoEnderecoId,
  };
}

export interface UseContagemValidacaoOptions {
  onComplete?: () => void;
  demandaId?: string;
  demandaEnderecoId?: string;
  endereco?: string;
  saldoEsperado?: SaldoEsperadoEndereco[];
}

export function useContagemValidacao(options: UseContagemValidacaoOptions = {}) {
  const {
    onComplete,
    demandaId,
    demandaEnderecoId,
    endereco = '',
    saldoEsperado = [],
  } = options;

  const produto = mapSaldoEsperadoToProduto(endereco, saldoEsperado[0]);
  const unidadesPorCaixa = saldoEsperado[0]?.unidadesPorCaixa ?? null;

  const [toast, setToast] = useState<ContagemValidacaoToast | null>(null);
  const [matchConfirmed, setMatchConfirmed] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<ContagemValidacaoForm>({
    resolver: zodResolver(contagemValidacaoFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  });

  const { reset } = form;

  useEffect(() => {
    reset(DEFAULT_VALUES);
  }, [demandaEnderecoId, endereco, reset]);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, variant: ContagemValidacaoToast['variant']) => {
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
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const onEnderecoVazio = useCallback(async () => {
    hapticMedium();
    try {
      if (demandaId && demandaEnderecoId) {
        await submitContagemValidacao(demandaId, demandaEnderecoId, {
          enderecoVazio: true,
          anomaliaEncontrada: false,
          correspondeAoEsperado: false,
          quantidadeCaixas: 0,
          quantidadeUnidades: 0,
        });
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }
      showToast('Endereço vazio registrado com sucesso.', 'success');
      reset(DEFAULT_VALUES);
      onComplete?.();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Erro ao registrar endereço vazio',
        'error',
      );
    }
  }, [demandaEnderecoId, demandaId, onComplete, reset, showToast]);

  const onAnomalia = useCallback(async () => {
    hapticMedium();
    try {
      if (demandaId && demandaEnderecoId) {
        await submitContagemValidacao(demandaId, demandaEnderecoId, {
          enderecoVazio: false,
          anomaliaEncontrada: true,
          correspondeAoEsperado: false,
          quantidadeCaixas: 0,
          quantidadeUnidades: 0,
        });
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }
      showToast('Anomalia registrada para revisão posterior.', 'success');
      reset(DEFAULT_VALUES);
      onComplete?.();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Erro ao registrar anomalia',
        'error',
      );
    }
  }, [demandaEnderecoId, demandaId, onComplete, reset, showToast]);

  const onCorresponde = useCallback(async () => {
    const data = form.getValues();
    if (
      quantidadeContadaDivergeDoEsperado(
        Number(data.quantidadeCaixas) || 0,
        Number(data.quantidadeUnidades) || 0,
        produto.quantidadeEsperada,
        unidadesPorCaixa,
      )
    ) {
      showToast(
        'A quantidade informada difere do esperado. Use "Registrar divergência".',
        'error',
      );
      return;
    }

    hapticMedium();
    setMatchConfirmed(true);
    try {
      if (demandaId && demandaEnderecoId) {
        await submitContagemValidacao(demandaId, demandaEnderecoId, {
          enderecoVazio: false,
          anomaliaEncontrada: false,
          correspondeAoEsperado: true,
          quantidadeCaixas: 0,
          quantidadeUnidades: 0,
          saldoEnderecoId: produto.saldoEnderecoId,
        });
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }
      showToast(
        `Contagem confirmada: ${produto.quantidadeEsperada} ${produto.unidadeMedida}.`,
        'success',
      );
      setMatchConfirmed(false);
      reset(DEFAULT_VALUES);
      onComplete?.();
    } catch (error) {
      setMatchConfirmed(false);
      showToast(
        error instanceof Error ? error.message : 'Erro ao confirmar contagem',
        'error',
      );
    }
  }, [
    demandaEnderecoId,
    demandaId,
    form,
    onComplete,
    produto.quantidadeEsperada,
    produto.saldoEnderecoId,
    produto.unidadeMedida,
    reset,
    showToast,
    unidadesPorCaixa,
  ]);

  const onCorrigir = useCallback(
    form.handleSubmit(async (data) => {
      const totalContado = calcularQuantidadeContadaUnidades(
        Number(data.quantidadeCaixas) || 0,
        Number(data.quantidadeUnidades) || 0,
        unidadesPorCaixa,
      );

      if (totalContado <= 0 && !data.lote?.trim() && !data.peso) {
        showToast('Informe a quantidade real encontrada.', 'error');
        return;
      }

      const confirmed = window.confirm(
        `Deseja registrar divergência de ${totalContado || 0} unidades?`,
      );
      if (!confirmed) return;

      hapticMedium();
      try {
        if (demandaId && demandaEnderecoId) {
          await submitContagemValidacao(demandaId, demandaEnderecoId, {
            enderecoConfirmado: data.enderecoConfirmado,
            sscc: data.sscc,
            enderecoVazio: false,
            anomaliaEncontrada: false,
            correspondeAoEsperado: false,
            quantidadeCaixas: Number(data.quantidadeCaixas) || 0,
            quantidadeUnidades: Number(data.quantidadeUnidades) || 0,
            lote: data.lote,
            peso: data.peso,
            saldoEnderecoId: produto.saldoEnderecoId,
          });
        } else {
          await new Promise((r) => setTimeout(r, 400));
        }
        showToast('Divergência registrada. O inventário foi atualizado.', 'success');
        reset(DEFAULT_VALUES);
        onComplete?.();
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Erro ao registrar divergência',
          'error',
        );
      }
    }),
    [
      demandaEnderecoId,
      demandaId,
      form,
      onComplete,
      produto.saldoEnderecoId,
      reset,
      showToast,
      unidadesPorCaixa,
    ],
  );

  return {
    state: {
      produto,
      form,
      isSubmitting: form.formState.isSubmitting,
      matchConfirmed,
      toast,
      temSaldoEsperado: saldoEsperado.length > 0,
    },
    actions: {
      onEnderecoVazio,
      onAnomalia,
      onCorresponde,
      onCorrigir,
      dismissToast,
    },
  };
}
