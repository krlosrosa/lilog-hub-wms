'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  createSessao,
  listEscalas,
} from '@/features/sessao-operacao/lib/sessao-operacao-api';
import type { EscalaApi } from '@/features/sessao-operacao/types/escala.api';
import {
  DEFAULT_SESSAO_FORM,
  type SessaoFormValues,
} from '@/features/sessao-operacao/types/sessao.schema';
import { formatHorarioIntervalo } from '@/features/sessao-operacao/types/escala.schema';

export function useSessaoCadastro() {
  const router = useRouter();
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [escalas, setEscalas] = useState<EscalaApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<SessaoFormValues>(DEFAULT_SESSAO_FORM);

  useEffect(() => {
    async function loadEscalas() {
      if (!unidadeId) {
        setEscalas([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const response = await listEscalas({ unidadeId, page: 1, limit: 100 });
        setEscalas(response.items.filter((item) => item.ativo));
      } catch {
        toast.error('Não foi possível carregar as escalas.');
        setEscalas([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadEscalas();
  }, [unidadeId]);

  const escalaSelecionada = useMemo(
    () => escalas.find((item) => item.id === form.escalaId) ?? null,
    [escalas, form.escalaId],
  );

  const previewHorario = useMemo(() => {
    if (!escalaSelecionada) return null;

    return {
      intervalo: formatHorarioIntervalo(
        escalaSelecionada.horaInicioPlanejada,
        escalaSelecionada.horaFimPlanejada,
      ),
      cruzaMeiaNoite: escalaSelecionada.cruzaMeiaNoite,
      equipeNome: escalaSelecionada.equipeNome,
      totalFuncionarios: escalaSelecionada.totalFuncionarios,
    };
  }, [escalaSelecionada]);

  const updateField = useCallback(
    <K extends keyof SessaoFormValues>(field: K, value: SessaoFormValues[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const salvar = async () => {
    if (!form.escalaId) {
      toast.error('Selecione uma escala.');
      return;
    }

    if (!form.dataReferencia) {
      toast.error('Informe a data de referência.');
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await createSessao({
        escalaId: form.escalaId,
        dataReferencia: form.dataReferencia,
      });
      toast.success('Sessão criada com sucesso.');
      router.push(`/sessao-operacao/sessoes/${created.id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível criar a sessão.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    unidadeId,
    escalas,
    form,
    isLoading,
    isSubmitting,
    previewHorario,
    updateField,
    salvar,
  };
}
