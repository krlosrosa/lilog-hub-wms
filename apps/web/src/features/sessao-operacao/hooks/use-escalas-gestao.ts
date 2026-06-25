'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  createEscala,
  listEscalas,
} from '@/features/sessao-operacao/lib/sessao-operacao-api';
import type { EscalaApi } from '@/features/sessao-operacao/types/escala.api';
import type { EscalaFormValues } from '@/features/sessao-operacao/types/escala.schema';

const PAGE_SIZE = 20;

export function useEscalasGestao() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [escalas, setEscalas] = useState<EscalaApi[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEscala, setSelectedEscala] = useState<EscalaApi | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const loadEscalas = useCallback(async () => {
    if (!unidadeId) {
      setEscalas([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await listEscalas({
        unidadeId,
        page: pagina,
        limit: PAGE_SIZE,
      });
      setEscalas(response.items);
      setTotal(response.total);
    } catch {
      toast.error('Não foi possível carregar as escalas.');
      setEscalas([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [pagina, unidadeId]);

  useEffect(() => {
    void loadEscalas();
  }, [loadEscalas]);

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const openCreateDialog = () => setFormOpen(true);
  const closeCreateDialog = () => setFormOpen(false);

  const openEscalaPanel = (escala: EscalaApi) => {
    setSelectedEscala(escala);
    setPanelOpen(true);
  };

  const closeEscalaPanel = () => {
    setPanelOpen(false);
    setSelectedEscala(null);
  };

  const salvarEscala = async (data: EscalaFormValues) => {
    if (!unidadeId) {
      toast.error('Selecione uma unidade para criar a escala.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createEscala({
        unidadeId,
        nomeEscala: data.nomeEscala.trim(),
        nomeEquipe: data.nomeEquipe.trim(),
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        area: data.area?.trim() || undefined,
      });
      toast.success('Escala criada com sucesso.');
      closeCreateDialog();
      await loadEscalas();
    } catch {
      toast.error('Não foi possível criar a escala.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    unidadeId,
    escalas,
    total,
    pagina,
    setPagina,
    totalPaginas,
    isLoading,
    isSubmitting,
    formOpen,
    selectedEscala,
    panelOpen,
    openCreateDialog,
    closeCreateDialog,
    openEscalaPanel,
    closeEscalaPanel,
    setPanelOpen,
    salvarEscala,
    reloadEscalas: loadEscalas,
  };
}
