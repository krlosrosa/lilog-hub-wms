'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { toast } from 'sonner';

import {
  getEndereco,
  updateEndereco,
} from '@/features/enderecos/lib/endereco-api';
import {
  enderecoConfiguracaoFormSchema,
  resolveEnderecoCodigo,
  type EnderecoConfiguracaoFormValues,
} from '@/features/enderecos/types/enderecos-configuracao.schema';
import {
  ENDERECO_DIMENSOES_RACK_DEFAULT,
  getDefaultDimensoesEndereco,
  getDefaultTipoEstrutura,
  isEnderecoTipoEstruturado,
} from '@/features/enderecos/types/enderecos-gestao.schema';
import { MOCK_CHANGE_LOG } from '@/features/enderecos/mocks/enderecos-detail-mock-data';
import { ApiClientError } from '@/lib/api';

type UseEnderecosConfiguracaoOptions = {
  enderecoId: string;
};

function mapEnderecoToFormValues(
  endereco: Awaited<ReturnType<typeof getEndereco>>,
): EnderecoConfiguracaoFormValues {
  return {
    enderecoMascarado: endereco.enderecoMascarado,
    zona: endereco.zona,
    rua: endereco.rua,
    posicao: endereco.posicao,
    nivel: endereco.nivel,
    tipo: endereco.tipo,
    tipoEstrutura: endereco.tipoEstrutura,
    larguraMm: endereco.larguraMm,
    alturaMm: endereco.alturaMm,
    profundidadeMm: endereco.profundidadeMm,
    cargaMaxKg: Number(endereco.cargaMaxKg),
    capacidadeVolume: endereco.capacidadeVolume
      ? Number(endereco.capacidadeVolume)
      : null,
    prioridadePicking: endereco.prioridadePicking,
    coordenadaX: endereco.coordenadaX ? Number(endereco.coordenadaX) : null,
    coordenadaY: endereco.coordenadaY ? Number(endereco.coordenadaY) : null,
    coordenadaZ: endereco.coordenadaZ ? Number(endereco.coordenadaZ) : null,
    observacao: endereco.observacao,
    vinculoSkuFixo: endereco.vinculoSkuFixo,
    regraLoteUnico: endereco.regraLoteUnico,
    permiteMisturaValidade: endereco.permiteMisturaValidade,
    permiteFracionado: endereco.permiteFracionado,
    curvaAbc: endereco.curvaAbc,
  };
}

export function useEnderecosConfiguracao({
  enderecoId,
}: UseEnderecosConfiguracaoOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [unidadeLabel, setUnidadeLabel] = useState('—');
  const [enderecoTag, setEnderecoTag] = useState('');
  const [ocupacaoAtualPercent, setOcupacaoAtualPercent] = useState(0);
  const [initialValues, setInitialValues] =
    useState<EnderecoConfiguracaoFormValues | null>(null);

  const form = useForm<EnderecoConfiguracaoFormValues>({
    resolver: zodResolver(enderecoConfiguracaoFormSchema),
    defaultValues: {
      enderecoMascarado: '',
      zona: 'A',
      rua: '001',
      posicao: '0001',
      nivel: '01',
      tipo: 'picking',
      tipoEstrutura: 'porta-palete',
      ...ENDERECO_DIMENSOES_RACK_DEFAULT,
      vinculoSkuFixo: false,
      regraLoteUnico: false,
      permiteMisturaValidade: false,
      permiteFracionado: false,
      curvaAbc: 'B',
    },
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

    form.setValue('tipoEstrutura', getDefaultTipoEstrutura(values.tipo), {
      shouldDirty: true,
    });

    const dimensoes = getDefaultDimensoesEndereco(values.tipo);
    form.setValue('larguraMm', dimensoes.larguraMm, { shouldDirty: true });
    form.setValue('alturaMm', dimensoes.alturaMm, { shouldDirty: true });
    form.setValue('profundidadeMm', dimensoes.profundidadeMm, {
      shouldDirty: true,
    });
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

  const enderecoCodigo = useMemo(
    () => resolveEnderecoCodigo(values),
    [values],
  );

  const labelPreview = useMemo(
    () => ({
      enderecoCurto: enderecoCodigo.split(' ').slice(1).join(' ') || '—',
      enderecoCompleto: enderecoCodigo || '—',
      unidade: enderecoCodigo.split(' ')[0] ?? '—',
      dimensoesLabel: `L-${values.larguraMm} H-${values.alturaMm} P-${values.profundidadeMm}`,
      formato: 'Formato Padrão Zebra ZPL II - 100x150mm',
    }),
    [
      enderecoCodigo,
      values.larguraMm,
      values.alturaMm,
      values.profundidadeMm,
    ],
  );

  const carregar = useCallback(async () => {
    setIsLoading(true);

    try {
      const endereco = await getEndereco(enderecoId);
      const formValues = mapEnderecoToFormValues(endereco);

      setUnidadeLabel(endereco.unidade.nome);
      setEnderecoTag(endereco.enderecoMascarado);
      setOcupacaoAtualPercent(Number(endereco.ocupacaoPercent));
      setInitialValues(formValues);
      form.reset(formValues);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar o endereço';

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [enderecoId, form]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const salvar = form.handleSubmit(async (data) => {
    setIsSaving(true);

    try {
      const updated = await updateEndereco(enderecoId, {
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
        capacidadeVolume: data.capacidadeVolume,
        prioridadePicking: data.prioridadePicking,
        coordenadaX: data.coordenadaX,
        coordenadaY: data.coordenadaY,
        coordenadaZ: data.coordenadaZ,
        observacao: data.observacao,
        vinculoSkuFixo: data.vinculoSkuFixo,
        regraLoteUnico: data.regraLoteUnico,
        permiteMisturaValidade: data.permiteMisturaValidade,
        permiteFracionado: data.permiteFracionado,
        curvaAbc: data.curvaAbc,
        motivoAlteracao: data.motivoAlteracao,
      });

      const formValues = mapEnderecoToFormValues(updated);
      setInitialValues(formValues);
      setEnderecoTag(updated.enderecoMascarado);
      setUnidadeLabel(updated.unidade.nome);
      setOcupacaoAtualPercent(Number(updated.ocupacaoPercent));
      form.reset(formValues);

      toast.success('Alterações salvas', {
        description: `${updated.enderecoMascarado} atualizado com sucesso`,
      });
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível salvar as alterações';

      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  });

  const descartar = useCallback(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [form, initialValues]);

  const imprimirEtiqueta = useCallback(() => {
    toast.info('Impressão de etiqueta', {
      description: `Etiqueta preparada para ${enderecoCodigo}`,
    });
  }, [enderecoCodigo]);

  const verHistoricoCompleto = useCallback(() => {
    toast.info('Histórico completo', {
      description: 'Consulta de histórico em desenvolvimento',
    });
  }, []);

  return {
    form,
    isLoading,
    isSaving,
    unidadeLabel,
    enderecoTag,
    enderecoCodigo,
    ocupacaoAtualPercent,
    volumeTeoricoM3,
    labelPreview,
    changeLog: MOCK_CHANGE_LOG,
    salvar,
    descartar,
    carregar,
    imprimirEtiqueta,
    verHistoricoCompleto,
  };
}
