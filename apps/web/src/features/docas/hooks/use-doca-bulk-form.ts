'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { bulkCreateDocas } from '@/features/docas/lib/docas-api';
import {
  buildDocaCodigoPreview,
  buildDocaNomePreview,
  DOCA_BULK_FORM_DEFAULT_VALUES,
  docaBulkFormSchema,
  type DocaBulkFormValues,
} from '@/features/docas/types/doca-bulk-form.schema';
import { DOCA_FORM_TIPO_LABELS } from '@/features/docas/types/doca-form.schema';
import { useUnidadeContext } from '@/contexts/unidade-context';
import { ApiClientError } from '@/lib/api';

export function useDocaBulkForm() {
  const router = useRouter();
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const form = useForm<DocaBulkFormValues>({
    resolver: zodResolver(docaBulkFormSchema),
    defaultValues: {
      ...DOCA_BULK_FORM_DEFAULT_VALUES,
      unidadeId: unidadeId ?? '',
    },
    mode: 'onSubmit',
  });

  const numeroInicial = form.watch('numeroInicial');
  const numeroFinal = form.watch('numeroFinal');
  const codigoPrefixo = form.watch('codigoPrefixo');
  const nomePrefixo = form.watch('nomePrefixo');
  const tipo = form.watch('tipo');
  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    if (unidadeId) {
      form.setValue('unidadeId', unidadeId, { shouldValidate: true });
    }
  }, [unidadeId, form]);

  const quantidade = useMemo(() => {
    if (
      !Number.isFinite(numeroInicial) ||
      !Number.isFinite(numeroFinal) ||
      numeroInicial <= 0 ||
      numeroFinal <= 0 ||
      numeroInicial > numeroFinal
    ) {
      return 0;
    }

    return numeroFinal - numeroInicial + 1;
  }, [numeroFinal, numeroInicial]);

  const preview = useMemo(() => {
    if (quantidade === 0) {
      return null;
    }

    const primeiroCodigo = buildDocaCodigoPreview(
      codigoPrefixo,
      numeroInicial,
      numeroFinal,
    );
    const ultimoCodigo = buildDocaCodigoPreview(
      codigoPrefixo,
      numeroFinal,
      numeroFinal,
    );
    const primeiroNome = buildDocaNomePreview(
      nomePrefixo,
      numeroInicial,
      numeroFinal,
    );
    const ultimoNome = buildDocaNomePreview(
      nomePrefixo,
      numeroFinal,
      numeroFinal,
    );

    return {
      primeiroCodigo,
      ultimoCodigo,
      primeiroNome,
      ultimoNome,
    };
  }, [
    codigoPrefixo,
    nomePrefixo,
    numeroFinal,
    numeroInicial,
    quantidade,
  ]);

  const onSubmit = form.handleSubmit(async (data: DocaBulkFormValues) => {
    if (!unidadeId) {
      toast.error('Selecione uma unidade antes de cadastrar as docas');
      return;
    }

    try {
      const result = await bulkCreateDocas({
        unidadeId,
        numeroInicial: data.numeroInicial,
        numeroFinal: data.numeroFinal,
        codigoPrefixo: data.codigoPrefixo.trim(),
        nomePrefixo: data.nomePrefixo.trim(),
        tipo: data.tipo,
        capacidadeVeiculos: data.capacidadeVeiculos,
        observacao: data.observacao?.trim() || undefined,
      });

      if (result.criadas === 0) {
        toast.error('Nenhuma doca foi criada', {
          description:
            result.duplicadas > 0
              ? `${result.duplicadas} doca(s) já existiam nesta unidade`
              : 'Verifique o intervalo informado',
        });
        return;
      }

      const duplicadasMsg =
        result.duplicadas > 0
          ? ` (${result.duplicadas} já existiam e foram ignoradas)`
          : '';

      toast.success(`${result.criadas} doca(s) cadastrada(s)!`, {
        description: `${DOCA_FORM_TIPO_LABELS[data.tipo]}${duplicadasMsg}`,
      });

      router.push('/docas');
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível cadastrar as docas em massa';

      toast.error(message);
    }
  });

  const cancelar = useCallback(() => {
    router.push('/docas');
  }, [router]);

  return {
    form,
    isSubmitting,
    unidadeSelecionada,
    onSubmit,
    cancelar,
    quantidade,
    preview,
    tipo,
  };
}
