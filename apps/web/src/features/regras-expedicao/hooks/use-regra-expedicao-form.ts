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

  extractParametrosSeparacao,

  PRODUTIVIDADE_CATEGORIA,

  PRODUTIVIDADE_DOMINIO,

} from '@/features/config-operacional/types/configuracao-operacional.api';

import {

  DEFAULT_REGRA_EXPEDICAO_FORM,

  regraExpedicaoFormSchema,

  type RegraExpedicaoForm,

} from '@/features/regras-expedicao/types/regra-expedicao.schema';

import { ApiClientError } from '@/lib/api';



type UseRegraExpedicaoFormOptions = {

  regraId?: string;

};



export function useRegraExpedicaoForm({ regraId }: UseRegraExpedicaoFormOptions = {}) {

  const router = useRouter();

  const { unidadeSelecionada, isResolved } = useUnidadeContext();

  const isEditing = Boolean(regraId);



  const form = useForm<RegraExpedicaoForm>({

    resolver: zodResolver(regraExpedicaoFormSchema),

    defaultValues: DEFAULT_REGRA_EXPEDICAO_FORM,

    mode: 'onSubmit',

  });



  const [isLoading, setIsLoading] = useState(isEditing);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [notFound, setNotFound] = useState(false);

  const [simQtdItens, setSimQtdItens] = useState(10);

  const [simQtdEnderecos, setSimQtdEnderecos] = useState(5);

  const [simQtdItensSemEndereco, setSimQtdItensSemEndereco] = useState(2);



  useEffect(() => {

    if (!isEditing || !regraId || !isResolved) return;



    let cancelled = false;



    async function carregarRegra() {

      setIsLoading(true);

      setNotFound(false);



      try {

        const item = await obterConfiguracaoOperacional(regraId!);



        if (cancelled) return;



        if (item.subtipo !== 'separacao') {

          setNotFound(true);

          return;

        }



        const parametros = extractParametrosSeparacao(

          item.parametros as Parameters<typeof extractParametrosSeparacao>[0],

        );



        form.reset({

          nome: item.nome,

          descricao: item.descricao ?? '',

          ativo: item.ativo,

          padrao: item.isPadrao,

          ...parametros,

          deslocamentoItensSemEnderecoSeg:
            parametros.deslocamentoItensSemEnderecoSeg ?? 0,

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



  const onSubmit = form.handleSubmit(async (data: RegraExpedicaoForm) => {

    if (!unidadeSelecionada) {

      toast.error('Selecione uma unidade para salvar a regra.');

      return;

    }



    setIsSubmitting(true);



    try {

      const parametros = extractParametrosSeparacao(data);

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

          subtipo: 'separacao',

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

      router.push(regrasProdutividadeListaPath('separacao'));

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

    router.push(regrasProdutividadeListaPath('separacao'));

  }, [router]);



  return {

    form,

    isEditing,

    isLoading,

    isSubmitting,

    notFound,

    onSubmit,

    cancelar,

    simQtdItens,

    setSimQtdItens,

    simQtdEnderecos,

    setSimQtdEnderecos,

    simQtdItensSemEndereco,

    setSimQtdItensSemEndereco,

  };

}

