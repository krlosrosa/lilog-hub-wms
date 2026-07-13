'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  atualizarConfiguracaoOperacional,
  criarConfiguracaoOperacional,
  listarConfiguracoesOperacionais,
} from '@/features/config-operacional/lib/configuracao-operacional-api';
import {
  DEFAULT_CONDICOES_CHECKLIST,
  DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA,
  RECEBIMENTO_CONFERENCIA_CATEGORIA,
  RECEBIMENTO_DOMINIO,
  RECEBIMENTO_PARAMETROS_SUBTIPO,
  type ParametrosRecebimentoConferenciaApi,
} from '@/features/config-operacional/types/configuracao-operacional.api';
import { ApiClientError } from '@/lib/api';

const CONFIG_NOME = 'Parâmetros padrão';

const condicaoChecklistItemSchema = z.object({
  id: z.string().min(1, 'Informe o identificador'),
  label: z.string().min(1, 'Informe o rótulo'),
});

const parametrosRecebimentoFormSchema = z.object({
  quantidadeModo: z.enum(['caixa', 'unidade', 'ambos']),
  loteModo: z.enum(['lote', 'fabricacao', 'ambos']),
  controlaPalete: z.boolean(),
  solicitarPesoPvar: z.boolean(),
  exigirEtiquetaPesoVariavel: z.boolean(),
  displayUnidadePadrao: z.enum(['CX', 'UN']),
  displayDecimaisCaixa: z.number().int().min(0).max(4),
  displayDecimaisUnidade: z.number().int().min(0).max(3),
  condicoesChecklist: z
    .array(condicaoChecklistItemSchema)
    .min(1, 'Adicione ao menos uma condição')
    .max(20, 'Máximo de 20 condições'),
});

export type ParametrosRecebimentoForm = z.infer<typeof parametrosRecebimentoFormSchema>;

export function useParametrosRecebimento() {
  const { unidadeSelecionada, isResolved } = useUnidadeContext();
  const [configId, setConfigId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ParametrosRecebimentoForm>({
    resolver: zodResolver(parametrosRecebimentoFormSchema),
    defaultValues: DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA,
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (!isResolved || !unidadeSelecionada?.id) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function carregarConfig() {
      setIsLoading(true);

      try {
        const response = await listarConfiguracoesOperacionais({
          unidadeId: unidadeSelecionada!.id,
          dominio: RECEBIMENTO_DOMINIO,
          categoria: RECEBIMENTO_CONFERENCIA_CATEGORIA,
          subtipo: RECEBIMENTO_PARAMETROS_SUBTIPO,
          ativo: true,
        });

        if (cancelled) return;

        const padrao =
          response.items.find((item) => item.isPadrao) ?? response.items[0];

        if (padrao) {
          const parametros =
            padrao.parametros as ParametrosRecebimentoConferenciaApi;
          setConfigId(padrao.id);
          form.reset({
            quantidadeModo: parametros.quantidadeModo,
            loteModo: parametros.loteModo,
            controlaPalete: parametros.controlaPalete ?? false,
            solicitarPesoPvar: parametros.solicitarPesoPvar ?? true,
            exigirEtiquetaPesoVariavel:
              parametros.exigirEtiquetaPesoVariavel ?? false,
            displayUnidadePadrao:
              parametros.displayUnidadePadrao ?? 'UN',
            displayDecimaisCaixa: parametros.displayDecimaisCaixa ?? 2,
            displayDecimaisUnidade: parametros.displayDecimaisUnidade ?? 0,
            condicoesChecklist:
              parametros.condicoesChecklist?.length > 0
                ? parametros.condicoesChecklist
                : DEFAULT_CONDICOES_CHECKLIST,
          });
        } else {
          setConfigId(null);
          form.reset(DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA);
        }
      } catch {
        if (!cancelled) {
          form.reset(DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void carregarConfig();

    return () => {
      cancelled = true;
    };
  }, [form, isResolved, unidadeSelecionada?.id]);

  const onSubmit = form.handleSubmit(
    useCallback(
      async (values) => {
        if (!unidadeSelecionada?.id) {
          toast.error('Selecione uma unidade');
          return;
        }

        setIsSubmitting(true);

        try {
          const parametros: ParametrosRecebimentoConferenciaApi = {
            quantidadeModo: values.quantidadeModo,
            loteModo: values.loteModo,
            controlaPalete: values.controlaPalete,
            solicitarPesoPvar: values.solicitarPesoPvar,
            exigirEtiquetaPesoVariavel: values.exigirEtiquetaPesoVariavel,
            displayUnidadePadrao: values.displayUnidadePadrao,
            displayDecimaisCaixa: values.displayDecimaisCaixa,
            displayDecimaisUnidade: values.displayDecimaisUnidade,
            condicoesChecklist: values.condicoesChecklist.map((item) => ({
              id: item.id.trim(),
              label: item.label.trim(),
            })),
          };

          if (configId) {
            await atualizarConfiguracaoOperacional(configId, {
              parametros,
              isPadrao: true,
              ativo: true,
            });
          } else {
            const created = await criarConfiguracaoOperacional({
              unidadeId: unidadeSelecionada.id,
              dominio: RECEBIMENTO_DOMINIO,
              categoria: RECEBIMENTO_CONFERENCIA_CATEGORIA,
              subtipo: RECEBIMENTO_PARAMETROS_SUBTIPO,
              nome: CONFIG_NOME,
              descricao:
                'Define quais campos de quantidade e rastreabilidade são exibidos na conferência de recebimento no PWA.',
              parametros,
              isPadrao: true,
              ativo: true,
            });
            setConfigId(created.id);
          }

          toast.success('Parâmetros de conferência salvos');
        } catch (error) {
          const message =
            error instanceof ApiClientError
              ? error.message
              : 'Erro ao salvar parâmetros';
          toast.error(message);
        } finally {
          setIsSubmitting(false);
        }
      },
      [configId, unidadeSelecionada?.id],
    ),
  );

  return {
    form,
    isLoading,
    isSubmitting,
    onSubmit,
    unidadeSelecionada,
  };
}
