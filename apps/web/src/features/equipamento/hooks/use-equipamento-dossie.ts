'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { MOCK_EQUIPAMENTOS_DOSSIE } from '@/features/equipamento/mocks/equipamento-mock-data';
import type { EquipamentoDossieTab } from '@/features/equipamento/types/equipamento.schema';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useEquipamentoDossie(equipamentoId: string) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [tabAtiva, setTabAtiva] = useState<EquipamentoDossieTab>('geral');
  const [processandoAcao, setProcessandoAcao] = useState(false);

  const equipamento = useMemo(
    () => MOCK_EQUIPAMENTOS_DOSSIE[equipamentoId] ?? null,
    [equipamentoId],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      await delay(500);
      if (!cancelled) {
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [equipamentoId]);

  const setTab = useCallback((tab: EquipamentoDossieTab) => {
    setTabAtiva(tab);
  }, []);

  const abrirChamado = useCallback(async () => {
    if (!equipamento) {
      return;
    }

    setProcessandoAcao(true);
    try {
      await delay(800);
      toast.success('Chamado de manutenção aberto (mock)', {
        description: equipamento.nome,
      });
    } finally {
      setProcessandoAcao(false);
    }
  }, [equipamento]);

  const voltar = useCallback(() => {
    router.push('/equipamento');
  }, [router]);

  return {
    equipamento,
    isLoading,
    tabAtiva,
    setTab,
    processandoAcao,
    abrirChamado,
    voltar,
  };
}
