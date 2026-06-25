'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { toast } from 'sonner';

import {
  createProduto,
  getProduto,
  mapFormValuesToCreatePayload,
  mapProdutoApiToFormValues,
  updateProduto,
} from '@/features/produto/lib/produto-api';
import {
  CATEGORIA_OPTIONS,
  EMPRESA_OPTIONS,
  produtoFormSchema,
  type ProdutoFormValues,
} from '@/features/produto/types/produto.schema';
import { ApiClientError } from '@/lib/api';

export const PRODUTO_FORM_DEFAULT_VALUES: ProdutoFormValues = {
  produtoId: '',
  sku: '',
  descricao: '',
  empresa: '',
  categoria: '',
  shelfLife: '',
  ean: '',
  dum: '',
  tipo: 'PVAR',
  pesoBrutoUnidade: '',
  pesoBrutoCaixa: '',
  pesoBrutoPalete: '',
  unidadesPorCaixa: '',
  caixasPorPalete: '',
};

type UseProdutoFormOptions = {
  produtoId?: string;
};

export function useProdutoForm(options?: UseProdutoFormOptions) {
  const produtoId = options?.produtoId;
  const isEditMode = Boolean(produtoId);
  const router = useRouter();
  const form = useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoFormSchema),
    defaultValues: PRODUTO_FORM_DEFAULT_VALUES,
    mode: 'onSubmit',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  useEffect(() => {
    if (!produtoId) {
      return;
    }

    let ativo = true;

    async function carregarProduto(currentId: string) {
      setIsLoading(true);

      try {
        const produto = await getProduto(currentId);

        if (!ativo) {
          return;
        }

        form.reset(mapProdutoApiToFormValues(produto));
      } catch (error) {
        if (!ativo) {
          return;
        }

        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível carregar o produto';

        toast.error(message);
        router.push('/produtos');
      } finally {
        if (ativo) {
          setIsLoading(false);
        }
      }
    }

    void carregarProduto(produtoId);

    return () => {
      ativo = false;
    };
  }, [form, produtoId, router]);

  const onSubmit = form.handleSubmit(async (data: ProdutoFormValues) => {
    setIsSubmitting(true);

    try {
      const payload = mapFormValuesToCreatePayload(data);
      const empresaLabel =
        EMPRESA_OPTIONS.find((option) => option.value === data.empresa)?.label ??
        data.empresa;
      const categoriaLabel =
        CATEGORIA_OPTIONS.find((option) => option.value === data.categoria)
          ?.label ?? data.categoria;

      if (isEditMode && produtoId) {
        const updated = await updateProduto(produtoId, payload);

        if (!updated?.id) {
          throw new ApiClientError(
            'A API não retornou o produto atualizado. Tente novamente.',
            500,
          );
        }

        toast.success('Produto atualizado!', {
          description: `${updated.sku} — ${empresaLabel} • ${categoriaLabel}`,
        });
      } else {
        const created = await createProduto(payload);

        if (!created?.id) {
          throw new ApiClientError(
            'A API não retornou o produto criado. Tente novamente.',
            500,
          );
        }

        toast.success('Produto salvo!', {
          description: `${created.sku} — ${empresaLabel} • ${categoriaLabel}`,
        });
      }

      router.push('/produtos');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : isEditMode
            ? 'Não foi possível atualizar o produto'
            : 'Não foi possível salvar o produto';

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  });

  const cancelar = useCallback(() => {
    router.push('/produtos');
  }, [router]);

  return {
    form,
    isSubmitting,
    isLoading,
    isEditMode,
    onSubmit,
    cancelar,
  };
}
