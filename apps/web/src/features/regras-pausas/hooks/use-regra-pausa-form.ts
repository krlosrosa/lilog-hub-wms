'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  atualizarConfiguracaoOperacional,
  criarConfiguracaoOperacional,
  definirPadraoConfiguracaoOperacional,
  obterConfiguracaoOperacional,
} from '@/features/config-operacional/lib/configuracao-operacional-api';
import {
  extractParametrosPausa,
  PAUSAS_CATEGORIA,
  PAUSAS_DOMINIO,
} from '@/features/config-operacional/types/configuracao-operacional.api';
import { regrasPausasListaPath } from '@/features/regras-pausas/lib/regras-pausas-paths';
import {
  getDefaultRegraPausaForm,
  regraPausaFormSchema,
  type RegraPausaForm,
} from '@/features/regras-pausas/types/regra-pausa.schema';
import { parseTipoPausaRegra } from '@/features/regras-pausas/types/tipo-pausa-regra-tabs';
import { ApiClientError } from '@/lib/api';

type UseRegraPausaFormOptions = {
  regraId?: string;
};

export function useRegraPausaForm({ regraId }: UseRegraPausaFormOptions = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tipoInicial = parseTipoPausaRegra(searchParams.get('tipo'));
  const { unidadeSelecionada, isResolved } = useUnidadeContext();
  const isEditing = Boolean(regraId);

  const form = useForm<RegraPausaForm>({
    resolver: zodResolver(regraPausaFormSchema),
    defaultValues: getDefaultRegraPausaForm(tipoInicial),
    mode: 'onSubmit',
  });

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!isEditing || !regraId || !isResolved) return;

    let cancelled = false;

    async function carregarRegra() {
      setIsLoading(true);
      setNotFound(false);

      try {
        const item = await obterConfiguracaoOperacional(regraId!);

        if (cancelled) return;

        if (
          item.categoria !== PAUSAS_CATEGORIA ||
          (item.subtipo !== 'termica' &&
            item.subtipo !== 'refeicao' &&
            item.subtipo !== 'outros')
        ) {
          setNotFound(true);
          return;
        }

        const parametros = extractParametrosPausa(
          item.parametros as Parameters<typeof extractParametrosPausa>[0],
        );

        form.reset({
          nome: item.nome,
          descricao: item.descricao ?? '',
          ativo: item.ativo,
          padrao: item.isPadrao,
          tipo: item.subtipo,
          ...parametros,
        });
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void carregarRegra();

    return () => {
      cancelled = true;
    };
  }, [form, isEditing, isResolved, regraId]);

  const onSubmit = form.handleSubmit(async (data: RegraPausaForm) => {
    if (!unidadeSelecionada) {
      toast.error('Selecione uma unidade para salvar a regra.');
      return;
    }

    setIsSubmitting(true);

    try {
      const parametros = extractParametrosPausa(data);
      const descricao = data.descricao?.trim() || undefined;

      if (isEditing && regraId) {
        await atualizarConfiguracaoOperacional(regraId, {
          nome: data.nome,
          descricao: descricao ?? null,
          parametros,
          ativo: data.ativo,
          isPadrao: data.padrao,
        });

        if (data.padrao) {
          await definirPadraoConfiguracaoOperacional(regraId);
        }
      } else {
        const created = await criarConfiguracaoOperacional({
          unidadeId: unidadeSelecionada.id,
          dominio: PAUSAS_DOMINIO,
          categoria: PAUSAS_CATEGORIA,
          subtipo: data.tipo,
          nome: data.nome,
          descricao,
          parametros,
          ativo: data.ativo,
          isPadrao: data.padrao,
        });

        if (data.padrao && !created.isPadrao) {
          await definirPadraoConfiguracaoOperacional(created.id);
        }
      }

      toast.success(isEditing ? 'Regra atualizada!' : 'Regra criada!', {
        description: data.nome,
      });
      router.push(regrasPausasListaPath(data.tipo));
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível salvar a regra.';

      toast.error('Erro ao salvar regra', { description: message });
    } finally {
      setIsSubmitting(false);
    }
  });

  const cancelar = useCallback(() => {
    router.push(regrasPausasListaPath(form.getValues('tipo')));
  }, [form, router]);

  return {
    form,
    isEditing,
    isLoading,
    isSubmitting,
    notFound,
    onSubmit,
    cancelar,
  };
}
