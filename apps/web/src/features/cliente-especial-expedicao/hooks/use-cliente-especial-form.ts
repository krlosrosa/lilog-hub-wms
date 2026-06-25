'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  createClienteEspecial,
  getClienteEspecial,
  mapClienteEspecialApiToFormValues,
  updateClienteEspecial,
} from '@/features/cliente-especial-expedicao/lib/cliente-especial-api';
import {
  CLIENTE_ESPECIAL_FORM_DEFAULT_VALUES,
  clienteEspecialFormSchema,
  type ClienteEspecialFormValues,
} from '@/features/cliente-especial-expedicao/types/cliente-especial.schema';
import { useUnidadeContext } from '@/contexts/unidade-context';
import { ApiClientError } from '@/lib/api';

type UseClienteEspecialFormOptions = {
  clienteId?: string;
};

export function useClienteEspecialForm(options?: UseClienteEspecialFormOptions) {
  const clienteId = options?.clienteId;
  const isEditMode = Boolean(clienteId);
  const router = useRouter();
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const form = useForm<ClienteEspecialFormValues>({
    resolver: zodResolver(clienteEspecialFormSchema),
    defaultValues: CLIENTE_ESPECIAL_FORM_DEFAULT_VALUES,
    mode: 'onSubmit',
  });

  const [isLoading, setIsLoading] = useState(isEditMode);

  useEffect(() => {
    if (!clienteId) {
      return;
    }

    let ativo = true;

    const id = clienteId;

    async function carregarCliente() {
      setIsLoading(true);

      try {
        const cliente = await getClienteEspecial(id);

        if (!ativo) {
          return;
        }

        form.reset(mapClienteEspecialApiToFormValues(cliente));
      } catch (error) {
        if (!ativo) {
          return;
        }

        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível carregar o cliente especial';

        toast.error(message);
        router.push('/expedicao/clientes-especiais');
      } finally {
        if (ativo) {
          setIsLoading(false);
        }
      }
    }

    void carregarCliente();

    return () => {
      ativo = false;
    };
  }, [clienteId, form, router]);

  const onSubmit = form.handleSubmit(async (data: ClienteEspecialFormValues) => {
    if (!unidadeId) {
      toast.error('Selecione uma unidade antes de salvar');
      return;
    }

    try {
      if (isEditMode && clienteId) {
        await updateClienteEspecial(clienteId, data);
        toast.success('Cliente especial atualizado!');
      } else {
        await createClienteEspecial({ ...data, unidadeId });
        toast.success('Cliente especial cadastrado!');
      }

      router.push('/expedicao/clientes-especiais');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : isEditMode
            ? 'Não foi possível atualizar o cliente especial'
            : 'Não foi possível cadastrar o cliente especial';

      toast.error(message);
    }
  });

  const cancelar = useCallback(() => {
    router.push('/expedicao/clientes-especiais');
  }, [router]);

  return {
    form,
    isEditMode,
    isLoading,
    isSubmitting: form.formState.isSubmitting,
    unidadeSelecionada,
    onSubmit,
    cancelar,
  };
}
