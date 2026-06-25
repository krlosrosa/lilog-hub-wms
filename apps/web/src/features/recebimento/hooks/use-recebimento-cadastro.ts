'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { createPreRecebimento } from '@/features/recebimento/lib/recebimento-api';
import {
  EMPTY_ITEM_PRE_RECEBIMENTO,
  recebimentoCadastroFormSchema,
  type RecebimentoCadastroFormValues,
} from '@/features/recebimento/types/recebimento-cadastro.schema';
import { ApiClientError } from '@/lib/api';

export const RECEBIMENTO_CADASTRO_DEFAULT_VALUES: RecebimentoCadastroFormValues =
  {
    transportadoraId: '',
    placa: '',
    horarioPrevisto: '',
    observacao: '',
    itens: [{ ...EMPTY_ITEM_PRE_RECEBIMENTO }],
  };

function parseOptionalPositiveNumber(value?: string): number | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function useRecebimentoCadastro() {
  const router = useRouter();
  const { unidadeSelecionada } = useUnidadeContext();

  const form = useForm<RecebimentoCadastroFormValues>({
    resolver: zodResolver(recebimentoCadastroFormSchema),
    defaultValues: RECEBIMENTO_CADASTRO_DEFAULT_VALUES,
    mode: 'onSubmit',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = form.handleSubmit(async (data: RecebimentoCadastroFormValues) => {
    if (!unidadeSelecionada) {
      toast.error('Selecione uma unidade antes de cadastrar');
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await createPreRecebimento({
        unidadeId: unidadeSelecionada.id,
        transportadoraId: data.transportadoraId.trim(),
        placa: data.placa.trim().toUpperCase(),
        horarioPrevisto: new Date(data.horarioPrevisto).toISOString(),
        observacao: data.observacao?.trim() || undefined,
        itens: data.itens.map((item) => ({
          produtoId: item.produtoId,
          quantidadeEsperada: item.quantidadeEsperada,
          unidadeMedida: item.unidadeMedida,
          loteEsperado: item.loteEsperado?.trim() || undefined,
          pesoEsperado: parseOptionalPositiveNumber(item.pesoEsperado),
          validadeEsperada: item.validadeEsperada
            ? new Date(item.validadeEsperada).toISOString()
            : undefined,
        })),
      });

      toast.success('Pré-recebimento cadastrado!', {
        description: `${created.placa} · ${data.transportadoraId.trim()}`,
      });

      router.push('/recebimento');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível cadastrar o pré-recebimento';

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  });

  const cancelar = useCallback(() => {
    form.reset(RECEBIMENTO_CADASTRO_DEFAULT_VALUES);
    router.push('/recebimento');
  }, [form, router]);

  return {
    form,
    isSubmitting,
    unidadeSelecionada,
    onSubmit,
    cancelar,
  };
}
