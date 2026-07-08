'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  createRegraWms,
  findRegraWms,
  updateRegraWms,
} from '@/features/regras-wms/lib/regras-wms-api';
import { mapRegraProcessoToRegraWmsV2 } from '@/features/regras-wms/types/regra-wms.api';
import { regraV2ToEngineRule } from '@/features/regras-wms/types/regra-wms-mapping';
import {
  DEFAULT_REGRA_WMS_V2_FORM,
  regraWmsV2FormSchema,
  type RegraWmsV2Form,
} from '@/features/regras-wms/types/regra-wms-tree.schema';
import { ApiClientError } from '@/lib/api';
import type { TipoAcao } from '@/features/regras-wms/types/regra-wms.schema';

type UseRegraWmsFormOptions = {
  regraId?: string;
};

function inferDepositoCodigoFromAcao(acao: RegraWmsV2Form['acao']) {
  if (acao.parametros.depositoCodigo?.trim()) {
    return acao.parametros.depositoCodigo.trim();
  }

  const tipo: TipoAcao = acao.tipo;

  // Ação de quarentena sempre envia para o depósito lógico QUARENTENA
  if (tipo === 'quarentena') {
    return 'QUARENTENA' as const;
  }

  if (tipo !== 'mover_deposito') {
    return undefined;
  }

  const zona = acao.parametros.zonaDestino?.trim().toLowerCase();
  if (!zona) {
    return undefined;
  }

  // Mantém o mesmo mapeamento usado no backend em resolver-deposito-por-acao-regra
  if (zona === 'quarentena' || zona === 'área de bloqueio' || zona === 'area de bloqueio') {
    return 'QUARENTENA' as const;
  }

  if (
    zona === 'depósito a' ||
    zona === 'deposito a' ||
    zona === 'depósito b' ||
    zona === 'deposito b' ||
    zona.startsWith('staging expedi')
  ) {
    return 'AGUARD_ARM' as const;
  }

  return undefined;
}

export function useRegraWmsForm({ regraId }: UseRegraWmsFormOptions = {}) {
  const router = useRouter();
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;
  const isEditing = Boolean(regraId);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const form = useForm<RegraWmsV2Form>({
    resolver: zodResolver(regraWmsV2FormSchema),
    defaultValues: DEFAULT_REGRA_WMS_V2_FORM,
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (!regraId) {
      return;
    }

    let cancelled = false;

    async function loadRegra() {
      setIsLoading(true);

      try {
        const response = await findRegraWms(regraId!);
        if (cancelled) {
          return;
        }

        const regra = mapRegraProcessoToRegraWmsV2(response);
        form.reset({
          nome: regra.nome,
          descricao: regra.descricao ?? '',
          ativo: regra.ativo,
          prioridade: regra.prioridade,
          gatilho: regra.gatilho,
          arvoreCondicoes: regra.arvoreCondicoes,
          acao: regra.acao,
        });
      } catch (error) {
        if (!cancelled) {
          setNotFound(true);
          const message =
            error instanceof ApiClientError
              ? error.message
              : 'Não foi possível carregar a regra.';
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadRegra();

    return () => {
      cancelled = true;
    };
  }, [form, regraId]);

  const onSubmit = form.handleSubmit(async (data: RegraWmsV2Form) => {
    if (!unidadeId) {
      toast.error('Selecione uma unidade para continuar.');
      return;
    }

    setIsSubmitting(true);

    try {
      const acaoComDeposito = (() => {
        const depositoCodigo = inferDepositoCodigoFromAcao(data.acao);
        const depositoId = data.acao.parametros.depositoId?.trim();

        if (!depositoCodigo && !depositoId) {
          return data.acao;
        }

        return {
          ...data.acao,
          parametros: {
            ...data.acao.parametros,
            ...(depositoId ? { depositoId } : {}),
            ...(depositoCodigo ? { depositoCodigo } : {}),
          },
        };
      })();

      regraV2ToEngineRule({
        nome: data.nome,
        prioridade: data.prioridade,
        arvoreCondicoes: data.arvoreCondicoes,
        acao: acaoComDeposito,
      });

      const payload = {
        nome: data.nome,
        descricao: data.descricao?.trim() || undefined,
        gatilho: data.gatilho,
        prioridade: data.prioridade,
        arvoreCondicoes: data.arvoreCondicoes,
        acoes: [acaoComDeposito],
        ativo: data.ativo,
      };

      if (isEditing && regraId) {
        await updateRegraWms(regraId, payload);
        toast.success('Regra atualizada!', { description: data.nome });
      } else {
        await createRegraWms({
          unidadeId,
          ...payload,
        });
        toast.success('Regra criada!', { description: data.nome });
      }

      router.push('/regras-wms');
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível salvar a regra.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  });

  const cancelar = useCallback(() => {
    router.push('/regras-wms');
  }, [router]);

  return {
    form,
    isLoading,
    isSubmitting,
    isEditing,
    notFound,
    onSubmit,
    cancelar,
  };
}
