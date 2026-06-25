'use client';



import { zodResolver } from '@hookform/resolvers/zod';

import { useRouter } from 'next/navigation';

import { useCallback, useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';

import { toast } from 'sonner';



import { useUnidadeContext } from '@/contexts/unidade-context';

import { regrasProdutividadeListaPath } from '@/features/config-operacional/lib/regras-produtividade-paths';

import {

  atualizarConfiguracaoOperacional,

  criarConfiguracaoOperacional,

  definirPadraoConfiguracaoOperacional,

  obterConfiguracaoOperacional,

} from '@/features/config-operacional/lib/configuracao-operacional-api';

import {

  extractParametrosConferencia,

  PRODUTIVIDADE_CATEGORIA,

  PRODUTIVIDADE_DOMINIO,

} from '@/features/config-operacional/types/configuracao-operacional.api';

import {

  DEFAULT_REGRA_CONFERENCIA_FORM,

  regraConferenciaFormSchema,

  type RegraConferenciaForm,

} from '@/features/regras-conferencia/types/regra-conferencia.schema';

import { ApiClientError } from '@/lib/api';



type UseRegraConferenciaFormOptions = {

  regraId?: string;

};



export function useRegraConferenciaForm({ regraId }: UseRegraConferenciaFormOptions = {}) {

  const router = useRouter();

  const { unidadeSelecionada, isResolved } = useUnidadeContext();

  const isEditing = Boolean(regraId);



  const form = useForm<RegraConferenciaForm>({

    resolver: zodResolver(regraConferenciaFormSchema),

    defaultValues: DEFAULT_REGRA_CONFERENCIA_FORM,

    mode: 'onSubmit',

  });



  const [isLoading, setIsLoading] = useState(isEditing);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [notFound, setNotFound] = useState(false);

  const [simQtdLinhas, setSimQtdLinhas] = useState(10);

  const [simQtdPaletes, setSimQtdPaletes] = useState(3);

  const [simQtdClientes, setSimQtdClientes] = useState(2);



  useEffect(() => {

    if (!isEditing || !regraId || !isResolved) return;



    let cancelled = false;



    async function carregarRegra() {

      setIsLoading(true);

      setNotFound(false);



      try {

        const item = await obterConfiguracaoOperacional(regraId!);



        if (cancelled) return;



        if (item.subtipo !== 'conferencia') {

          setNotFound(true);

          return;

        }



        const parametros = extractParametrosConferencia(

          item.parametros as Parameters<typeof extractParametrosConferencia>[0],

        );



        form.reset({

          nome: item.nome,

          descricao: item.descricao ?? '',

          ativo: item.ativo,

          padrao: item.isPadrao,

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



  const onSubmit = form.handleSubmit(async (data: RegraConferenciaForm) => {

    if (!unidadeSelecionada) {

      toast.error('Selecione uma unidade para salvar a regra.');

      return;

    }



    setIsSubmitting(true);



    try {

      const parametros = extractParametrosConferencia(data);

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

          dominio: PRODUTIVIDADE_DOMINIO,

          categoria: PRODUTIVIDADE_CATEGORIA,

          subtipo: 'conferencia',

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

      router.push(regrasProdutividadeListaPath('conferencia'));

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

    router.push(regrasProdutividadeListaPath('conferencia'));

  }, [router]);



  return {

    form,

    isEditing,

    isLoading,

    isSubmitting,

    notFound,

    onSubmit,

    cancelar,

    simQtdLinhas,

    setSimQtdLinhas,

    simQtdPaletes,

    setSimQtdPaletes,

    simQtdClientes,

    setSimQtdClientes,

  };

}

