'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { createPreRecebimento } from '@/features/recebimento/lib/recebimento-api';
import {
  buildCreatePreRecebimentoPayloadFromDemanda,
  buildCreatePreRecebimentoPayloadFromForm,
} from '@/features/recebimento/lib/map-recebimento-import-payload';
import {
  aplicarProdutosValidadosNasDemandas,
  validarProdutosImportacao,
} from '@/features/recebimento/lib/validar-produtos-importacao';
import type { RecebimentoXlsxDemanda } from '@/features/recebimento/lib/parse-recebimento-xlsx';
import {
  EMPTY_ITEM_PRE_RECEBIMENTO,
  recebimentoCadastroFormSchema,
  type RecebimentoCadastroFormInput,
  type RecebimentoCadastroFormValues,
} from '@/features/recebimento/types/recebimento-cadastro.schema';
import { ApiClientError } from '@/lib/api';

export const RECEBIMENTO_CADASTRO_DEFAULT_VALUES: RecebimentoCadastroFormInput =
  {
    transportadoraNome: '',
    placa: '',
    numeroOcr: '',
    numeroTransporte: '',
    origemDados: 'manual',
    horarioPrevisto: '',
    observacao: '',
    quantidadePaletesEsperada: undefined,
    itens: [{ ...EMPTY_ITEM_PRE_RECEBIMENTO }],
    notasFiscais: [],
  };

export function useRecebimentoCadastro() {
  const router = useRouter();
  const { unidadeSelecionada } = useUnidadeContext();

  const form = useForm<
    RecebimentoCadastroFormInput,
    unknown,
    RecebimentoCadastroFormValues
  >({
    resolver: zodResolver(recebimentoCadastroFormSchema),
    defaultValues: RECEBIMENTO_CADASTRO_DEFAULT_VALUES,
    mode: 'onSubmit',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingDemandas, setIsSubmittingDemandas] = useState(false);

  const onSubmit = form.handleSubmit(async (data: RecebimentoCadastroFormValues) => {
    if (!unidadeSelecionada) {
      toast.error('Selecione uma unidade antes de cadastrar');
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await createPreRecebimento(
        buildCreatePreRecebimentoPayloadFromForm(unidadeSelecionada.id, data),
      );

      const identificador =
        created.placa ??
        created.numeroTransporte ??
        created.numeroOcr ??
        'Pré-recebimento';

      toast.success('Pré-recebimento cadastrado!', {
        description: `${identificador} · ${created.transportadoraNome ?? data.transportadoraNome?.trim() ?? 'Sem transportadora'}`,
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

  const cadastrarDemandasImportadas = useCallback(
    async (demandas: RecebimentoXlsxDemanda[]) => {
      if (!unidadeSelecionada) {
        toast.error('Selecione uma unidade antes de cadastrar');
        return;
      }

      if (demandas.length === 0) {
        toast.error('Nenhuma demanda para cadastrar');
        return;
      }

      const validacao = await validarProdutosImportacao(demandas);
      if (validacao.naoEncontrados.length > 0) {
        toast.error('Produtos sem cadastro', {
          description: validacao.naoEncontrados.slice(0, 5).join(' · '),
        });
        return;
      }

      const demandasValidadas = aplicarProdutosValidadosNasDemandas(
        demandas,
        validacao.validos,
      );

      setIsSubmittingDemandas(true);

      const falhas: string[] = [];
      let cadastradas = 0;

      try {
        for (const demanda of demandasValidadas) {
          const ocrLabel = demanda.cabecalho.numeroOcr ?? 'sem OCR';

          try {
            await createPreRecebimento(
              buildCreatePreRecebimentoPayloadFromDemanda(
                unidadeSelecionada.id,
                demanda,
              ),
            );
            cadastradas += 1;
          } catch (error) {
            const message =
              error instanceof ApiClientError
                ? error.message
                : error instanceof Error
                  ? error.message
                  : 'Erro desconhecido';

            falhas.push(`OCR ${ocrLabel}: ${message}`);
          }
        }

        if (cadastradas > 0) {
          toast.success(`${cadastradas} demanda(s) cadastrada(s)`, {
            description:
              cadastradas === 1
                ? '1 veículo registrado como pré-recebimento'
                : `${cadastradas} veículos registrados como pré-recebimentos`,
          });
          router.push('/recebimento');
          router.refresh();
        }

        if (falhas.length > 0) {
          toast.error(`${falhas.length} demanda(s) não cadastrada(s)`, {
            description: falhas.slice(0, 3).join(' · '),
          });
        }
      } finally {
        setIsSubmittingDemandas(false);
      }
    },
    [router, unidadeSelecionada],
  );

  const carregarDemandaNoFormulario = useCallback(
    (demanda: RecebimentoXlsxDemanda) => {
      form.reset({
        transportadoraNome: demanda.cabecalho.transportadoraNome ?? '',
        placa: demanda.cabecalho.placa ?? '',
        numeroOcr: demanda.cabecalho.numeroOcr ?? '',
        numeroTransporte: demanda.cabecalho.numeroTransporte ?? '',
        origemDados: 'xlsx',
        horarioPrevisto: demanda.cabecalho.horarioPrevisto ?? '',
        observacao: '',
        itens:
          demanda.itens.length > 0
            ? demanda.itens
            : [{ ...EMPTY_ITEM_PRE_RECEBIMENTO }],
        notasFiscais: demanda.notasFiscais,
      });

      toast.info('Demanda carregada no formulário', {
        description: `OCR ${demanda.cabecalho.numeroOcr ?? '—'} · ${demanda.itens.length} item(ns)`,
      });
    },
    [form],
  );

  const cancelar = useCallback(() => {
    form.reset(RECEBIMENTO_CADASTRO_DEFAULT_VALUES);
    router.push('/recebimento');
  }, [form, router]);

  return {
    form,
    isSubmitting,
    isSubmittingDemandas,
    unidadeSelecionada,
    onSubmit,
    cadastrarDemandasImportadas,
    carregarDemandaNoFormulario,
    cancelar,
  };
}
