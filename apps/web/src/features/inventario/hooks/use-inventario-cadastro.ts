'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { listCentros, formatCentroLabel } from '@/features/enderecos/lib/endereco-api';
import { createInventario } from '@/features/inventario/lib/inventario-api';
import {
  inventarioCadastroFormSchema,
  type InventarioCadastroFormValues,
} from '@/features/inventario/types/inventario-cadastro.schema';

export const INVENTARIO_CADASTRO_DEFAULT_VALUES: InventarioCadastroFormValues = {
  nome: '',
  dataProgramada: '',
  tipo: 'geral',
  centroId: '',
  responsavelGestorId: '',
};

export function useInventarioCadastro() {
  const router = useRouter();

  const form = useForm<InventarioCadastroFormValues>({
    resolver: zodResolver(inventarioCadastroFormSchema),
    defaultValues: INVENTARIO_CADASTRO_DEFAULT_VALUES,
    mode: 'onSubmit',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [centros, setCentros] = useState<
    Array<{ id: string; label: string }>
  >([]);

  useEffect(() => {
    void listCentros().then((items) => {
      const options = items.map((centro) => ({
        id: centro.id,
        label: formatCentroLabel(centro),
      }));
      setCentros(options);
      if (options[0] && !form.getValues('centroId')) {
        form.setValue('centroId', options[0].id);
      }
    });
  }, [form]);

  const proximoDemandas = form.handleSubmit(
    async (data: InventarioCadastroFormValues) => {
      setIsSubmitting(true);
      try {
        const created = await createInventario(data);

        toast.success('Configuração salva', {
          description: created.nome,
        });

        router.push(`/inventario/${created.id}/demandas`);
      } catch (error) {
        toast.error('Não foi possível criar o inventário', {
          description:
            error instanceof Error ? error.message : 'Tente novamente.',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  );

  const voltarLista = useCallback(() => {
    router.push('/inventario');
  }, [router]);

  return {
    form,
    isSubmitting,
    proximoDemandas,
    voltarLista,
    centros,
  };
}
