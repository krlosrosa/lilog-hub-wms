'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  DEFAULT_VEICULO_CADASTRO,
  veiculoCadastroFormSchema,
  type VeiculoCadastroForm,
} from '@/features/frota/types/frota.schema';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useFrotaCadastro() {
  const router = useRouter();
  const form = useForm<VeiculoCadastroForm>({
    resolver: zodResolver(veiculoCadastroFormSchema),
    defaultValues: DEFAULT_VEICULO_CADASTRO,
    mode: 'onSubmit',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [crlvFileName, setCrlvFileName] = useState<string | null>(null);
  const [isDraggingCrlv, setIsDraggingCrlv] = useState(false);

  const onSubmit = form.handleSubmit(async (data: VeiculoCadastroForm) => {
    setIsSubmitting(true);

    try {
      await delay(1200);
      toast.success('Veículo cadastrado!', {
        description: `${data.marcaModelo} — ${data.placa}`,
      });
      router.push('/frota');
    } finally {
      setIsSubmitting(false);
    }
  });

  const cancelar = useCallback(() => {
    router.push('/frota');
  }, [router]);

  const onCrlvSelect = useCallback((file: File | null) => {
    if (!file) {
      setCrlvFileName(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo excede o limite de 10MB');
      return;
    }

    setCrlvFileName(file.name);
    toast.success('CRLV anexado (mock)', { description: file.name });
  }, []);

  const onCrlvDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCrlv(true);
  }, []);

  const onCrlvDragLeave = useCallback(() => {
    setIsDraggingCrlv(false);
  }, []);

  const onCrlvDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingCrlv(false);
      const file = e.dataTransfer.files[0] ?? null;
      onCrlvSelect(file);
    },
    [onCrlvSelect],
  );

  return {
    form,
    isSubmitting,
    crlvFileName,
    isDraggingCrlv,
    onSubmit,
    cancelar,
    onCrlvSelect,
    onCrlvDragOver,
    onCrlvDragLeave,
    onCrlvDrop,
  };
}
