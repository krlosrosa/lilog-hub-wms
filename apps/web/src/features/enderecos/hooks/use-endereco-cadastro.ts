'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  createEndereco,
  formatCentroLabel,
  listCentros,
} from '@/features/enderecos/lib/endereco-api';
import {
  ENDERECO_CADASTRO_DEFAULT_VALUES,
  enderecoCadastroFormSchema,
  type EnderecoCadastroFormValues,
} from '@/features/enderecos/types/endereco-cadastro.schema';
import type { CentroOptionApi } from '@/features/enderecos/types/endereco.api';
import { buildEnderecoCodigo } from '@/features/enderecos/types/enderecos-gestao.schema';
import type { LabelPreview } from '@/features/enderecos/types/enderecos-configuracao.schema';
import { useUnidadeContext } from '@/contexts/unidade-context';
import { ApiClientError } from '@/lib/api';

export function useEnderecoCadastro() {
  const router = useRouter();
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCentros, setIsLoadingCentros] = useState(true);
  const [centros, setCentros] = useState<CentroOptionApi[]>([]);

  const form = useForm<EnderecoCadastroFormValues>({
    resolver: zodResolver(enderecoCadastroFormSchema),
    defaultValues: ENDERECO_CADASTRO_DEFAULT_VALUES,
    mode: 'onSubmit',
  });

  useEffect(() => {
    async function loadCentros() {
      setIsLoadingCentros(true);

      try {
        const response = await listCentros(unidadeId);
        setCentros(response);

        if (response.length > 0) {
          form.setValue('centroId', response[0]!.id);
        }
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível carregar os centros';

        toast.error(message);
      } finally {
        setIsLoadingCentros(false);
      }
    }

    void loadCentros();
  }, [form, unidadeId]);

  const values = form.watch();

  const volumeTeoricoM3 = useMemo(() => {
    const { larguraMm, alturaMm, profundidadeMm } = values;
    if (!larguraMm || !alturaMm || !profundidadeMm) return 0;
    return (larguraMm * alturaMm * profundidadeMm) / 1_000_000_000;
  }, [values]);

  const enderecoCodigo = useMemo(() => {
    if (!values.zona || !values.rua || !values.posicao || !values.nivel) {
      return 'A 0001 001 01';
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
      enderecoCurto: parts.slice(1).join(' ') || '—',
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

  const centroOpcoes = useMemo(
    () =>
      centros.map((centro) => ({
        value: centro.id,
        label: formatCentroLabel(centro),
      })),
    [centros],
  );

  const onSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);

    try {
      const created = await createEndereco({
        centroId: data.centroId,
        zona: data.zona.trim(),
        rua: data.rua.trim(),
        posicao: data.posicao.trim(),
        nivel: data.nivel.trim(),
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
    isLoadingCentros,
    centroOpcoes,
    onSubmit,
    cancelar,
    volumeTeoricoM3,
    labelPreview,
    enderecoCodigo,
  };
}
