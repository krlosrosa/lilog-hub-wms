'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  MOCK_ESTIMATED_EXECUTION_MINUTES,
  MOCK_STOCK_ORIGINS,
} from '@/features/op-wms/mocks/op-wms.mock';
import {
  DEFAULT_RESSUPRIMENTO_FORM,
  PICKING_SUGGESTIONS,
  type RessuprimentoForm,
  type RessuprimentoPriority,
  ressuprimentoFormSchema,
} from '@/features/op-wms/types/op-wms.schema';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useRessuprimento() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const stockOrigins = MOCK_STOCK_ORIGINS;
  const pickingSuggestions = PICKING_SUGGESTIONS;
  const estimatedMinutes = MOCK_ESTIMATED_EXECUTION_MINUTES;

  const form = useForm<RessuprimentoForm>({
    resolver: zodResolver(ressuprimentoFormSchema),
    defaultValues: DEFAULT_RESSUPRIMENTO_FORM,
  });

  const priority = form.watch('priority');

  const setPriority = useCallback(
    (value: RessuprimentoPriority) => {
      form.setValue('priority', value, { shouldValidate: true });
    },
    [form],
  );

  const setSelectedOrigin = useCallback(
    (address: string) => {
      form.setValue('selectedOriginAddress', address, { shouldValidate: true });
    },
    [form],
  );

  const setDestination = useCallback(
    (address: string) => {
      form.setValue('destinationAddress', address, { shouldValidate: true });
    },
    [form],
  );

  const dispatchMission = useCallback(async () => {
    const valid = await form.trigger();
    if (!valid) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    setIsSubmitting(true);
    await delay(1500);
    setIsSubmitting(false);
    toast.success('Disparando missão de ressuprimento...');
  }, [form]);

  const onSubmit = form.handleSubmit(async () => {
    await dispatchMission();
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === 'Enter') {
        event.preventDefault();
        void dispatchMission();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatchMission]);

  return {
    form,
    priority,
    setPriority,
    setSelectedOrigin,
    setDestination,
    stockOrigins,
    pickingSuggestions,
    estimatedMinutes,
    isSubmitting,
    onSubmit,
    dispatchMission,
  };
}
