'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { MOCK_REGRAS_WMS } from '@/features/regras-wms/mocks/regras-wms-mock-data';
import { regraV2ToEngineRule } from '@/features/regras-wms/types/regra-wms-mapping';
import {
  DEFAULT_REGRA_WMS_V2_FORM,
  regraWmsV2FormSchema,
  type RegraWmsV2Form,
} from '@/features/regras-wms/types/regra-wms-tree.schema';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

type UseRegraWmsFormOptions = {
  regraId?: string;
};

export function useRegraWmsForm({ regraId }: UseRegraWmsFormOptions = {}) {
  const router = useRouter();
  const isEditing = Boolean(regraId);

  const existingRegra = regraId
    ? MOCK_REGRAS_WMS.find((r) => r.id === regraId)
    : undefined;

  const form = useForm<RegraWmsV2Form>({
    resolver: zodResolver(regraWmsV2FormSchema),
    defaultValues: existingRegra
      ? {
          nome: existingRegra.nome,
          descricao: existingRegra.descricao ?? '',
          ativo: existingRegra.ativo,
          prioridade: existingRegra.prioridade,
          gatilho: existingRegra.gatilho,
          arvoreCondicoes: existingRegra.arvoreCondicoes,
          acao: existingRegra.acao,
        }
      : DEFAULT_REGRA_WMS_V2_FORM,
    mode: 'onSubmit',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (isEditing && !existingRegra) {
      setNotFound(true);
    }
  }, [isEditing, existingRegra]);

  const onSubmit = form.handleSubmit(async (data: RegraWmsV2Form) => {
    setIsSubmitting(true);

    try {
      regraV2ToEngineRule({
        nome: data.nome,
        prioridade: data.prioridade,
        arvoreCondicoes: data.arvoreCondicoes,
        acao: data.acao,
      });
      await delay(1000);
      toast.success(isEditing ? 'Regra atualizada!' : 'Regra criada!', {
        description: data.nome,
      });
      router.push('/regras-wms');
    } finally {
      setIsSubmitting(false);
    }
  });

  const cancelar = useCallback(() => {
    router.push('/regras-wms');
  }, [router]);

  return {
    form,
    isSubmitting,
    isEditing,
    notFound,
    existingRegra,
    onSubmit,
    cancelar,
  };
}
