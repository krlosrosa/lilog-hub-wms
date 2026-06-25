'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  DEFAULT_EQUIPAMENTO_CADASTRO,
  equipamentoCadastroFormSchema,
  type AreaOperacao,
  type EquipamentoCadastroForm,
} from '@/features/equipamento/types/equipamento.schema';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useEquipamentoCadastro() {
  const router = useRouter();
  const form = useForm<EquipamentoCadastroForm>({
    resolver: zodResolver(equipamentoCadastroFormSchema),
    defaultValues: DEFAULT_EQUIPAMENTO_CADASTRO,
    mode: 'onSubmit',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagemFileName, setImagemFileName] = useState<string | null>(null);

  const onSubmit = form.handleSubmit(async (data: EquipamentoCadastroForm) => {
    setIsSubmitting(true);

    try {
      await delay(1200);
      toast.success('Equipamento cadastrado!', {
        description: `${data.marca} ${data.modelo} — ${data.serialNumber}`,
      });
      router.push('/equipamento');
    } finally {
      setIsSubmitting(false);
    }
  });

  const cancelar = useCallback(() => {
    router.push('/equipamento');
  }, [router]);

  const toggleArea = useCallback(
    (area: AreaOperacao) => {
      const current = form.getValues('areasOperacao');
      const next = current.includes(area)
        ? current.filter((a) => a !== area)
        : [...current, area];
      form.setValue('areasOperacao', next, { shouldValidate: true });
    },
    [form],
  );

  const onImagemSelect = useCallback((file: File | null) => {
    if (!file) {
      setImagemFileName(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo excede o limite de 5MB');
      return;
    }

    setImagemFileName(file.name);
    toast.success('Imagem anexada (mock)', { description: file.name });
  }, []);

  const baixarEtiqueta = useCallback(() => {
    toast.info('Download de etiqueta PDF (mock)');
  }, []);

  return {
    form,
    isSubmitting,
    imagemFileName,
    onSubmit,
    cancelar,
    toggleArea,
    onImagemSelect,
    baixarEtiqueta,
  };
}
