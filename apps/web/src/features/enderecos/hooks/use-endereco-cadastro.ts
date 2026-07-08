'use client';



import { zodResolver } from '@hookform/resolvers/zod';

import { useRouter } from 'next/navigation';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useForm } from 'react-hook-form';

import { toast } from 'sonner';



import { createEndereco } from '@/features/enderecos/lib/endereco-api';

import {

  ENDERECO_CADASTRO_DEFAULT_VALUES,

  enderecoCadastroFormSchema,

  type EnderecoCadastroFormValues,

} from '@/features/enderecos/types/endereco-cadastro.schema';

import {

  buildEnderecoCodigo,

  getDefaultDimensoesEndereco,

  getDefaultTipoEstrutura,

  isEnderecoTipoEstruturado,

} from '@/features/enderecos/types/enderecos-gestao.schema';

import type { LabelPreview } from '@/features/enderecos/types/enderecos-configuracao.schema';

import { useUnidadeContext } from '@/contexts/unidade-context';

import { ApiClientError } from '@/lib/api';



export function useEnderecoCadastro() {

  const router = useRouter();

  const { unidadeSelecionada } = useUnidadeContext();

  const unidadeId = unidadeSelecionada?.id;

  const [isSubmitting, setIsSubmitting] = useState(false);



  const form = useForm<EnderecoCadastroFormValues>({

    resolver: zodResolver(enderecoCadastroFormSchema),

    defaultValues: ENDERECO_CADASTRO_DEFAULT_VALUES,

    mode: 'onSubmit',

  });



  const values = form.watch();

  const tipoAnteriorRef = useRef(values.tipo);



  useEffect(() => {

    const tipoAnterior = tipoAnteriorRef.current;

    tipoAnteriorRef.current = values.tipo;



    if (tipoAnterior === values.tipo) {

      return;

    }



    const defaultTipoEstrutura = getDefaultTipoEstrutura(values.tipo);

    form.setValue('tipoEstrutura', defaultTipoEstrutura, { shouldDirty: true });



    const dimensoes = getDefaultDimensoesEndereco(values.tipo);

    form.setValue('larguraMm', dimensoes.larguraMm, { shouldDirty: true });

    form.setValue('alturaMm', dimensoes.alturaMm, { shouldDirty: true });

    form.setValue('profundidadeMm', dimensoes.profundidadeMm, { shouldDirty: true });

    form.setValue('cargaMaxKg', dimensoes.cargaMaxKg, { shouldDirty: true });



    if (!isEnderecoTipoEstruturado(values.tipo)) {

      form.setValue('rua', '', { shouldDirty: true });

      form.setValue('posicao', '', { shouldDirty: true });

      form.setValue('nivel', '', { shouldDirty: true });

    }

  }, [form, values.tipo]);



  const volumeTeoricoM3 = useMemo(() => {

    const { larguraMm, alturaMm, profundidadeMm } = values;

    if (!larguraMm || !alturaMm || !profundidadeMm) return 0;

    return (larguraMm * alturaMm * profundidadeMm) / 1_000_000_000;

  }, [values]);



  const enderecoCodigo = useMemo(() => {

    if (!values.zona) {

      return 'A 001 0001 01';

    }



    return buildEnderecoCodigo(

      values.zona,

      values.rua,

      values.posicao,

      values.nivel,

    );

  }, [values.zona, values.rua, values.posicao, values.nivel]);



  const labelPreview = useMemo((): LabelPreview => {

    const parts = enderecoCodigo.split(' ');



    return {

      enderecoCurto: parts.length > 1 ? parts.slice(1).join(' ') : enderecoCodigo,

      enderecoCompleto: enderecoCodigo,

      unidade: parts[0] ?? 'A',

      dimensoesLabel: `L-${values.larguraMm} H-${values.alturaMm} P-${values.profundidadeMm}`,

      formato: 'Formato Padrão Zebra ZPL II - 100x150mm',

    };

  }, [

    enderecoCodigo,

    values.larguraMm,

    values.alturaMm,

    values.profundidadeMm,

  ]);



  const onSubmit = form.handleSubmit(async (data) => {

    if (!unidadeId) {

      toast.error('Selecione uma unidade antes de cadastrar endereços');

      return;

    }



    setIsSubmitting(true);



    try {

      const created = await createEndereco({

        unidadeId,

        zona: data.zona.trim(),

        rua: data.rua?.trim() ?? '',

        posicao: data.posicao?.trim() ?? '',

        nivel: data.nivel?.trim() ?? '',

        tipo: data.tipo,

        tipoEstrutura: data.tipoEstrutura,

        larguraMm: data.larguraMm,

        alturaMm: data.alturaMm,

        profundidadeMm: data.profundidadeMm,

        cargaMaxKg: data.cargaMaxKg,

        capacidadeVolume: data.capacidadeVolume ?? undefined,

        prioridadePicking: data.prioridadePicking ?? undefined,

        coordenadaX: data.coordenadaX ?? undefined,

        coordenadaY: data.coordenadaY ?? undefined,

        coordenadaZ: data.coordenadaZ ?? undefined,

        observacao: data.observacao ?? undefined,

        vinculoSkuFixo: data.vinculoSkuFixo,

        regraLoteUnico: data.regraLoteUnico,

        permiteMisturaValidade: data.permiteMisturaValidade,

        permiteFracionado: data.permiteFracionado,

        curvaAbc: data.curvaAbc,

      });



      toast.success('Endereço criado!', {

        description: created.enderecoMascarado,

      });



      router.push('/enderecos');

    } catch (error) {

      const message =

        error instanceof ApiClientError

          ? error.message

          : 'Não foi possível criar o endereço';



      toast.error(message);

    } finally {

      setIsSubmitting(false);

    }

  });



  const cancelar = useCallback(() => {

    router.push('/enderecos');

  }, [router]);



  return {

    form,

    isSubmitting,

    unidadeLabel: unidadeSelecionada?.nome ?? '—',

    onSubmit,

    cancelar,

    volumeTeoricoM3,

    labelPreview,

    enderecoCodigo,

  };

}


