'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import {
  MOCK_CUSTOS_SEMANA,
  MOCK_MANUTENCAO_KPIS,
  MOCK_MANUTENCAO_PREVENTIVA,
  MOCK_ORDENS_SERVICO,
} from '@/features/equipamento/mocks/equipamento-mock-data';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useEquipamentoManutencao() {
  const [processandoOsId, setProcessandoOsId] = useState<string | null>(null);

  const assumirOs = useCallback(async (osId: string) => {
    setProcessandoOsId(osId);
    try {
      await delay(600);
      toast.success('OS assumida (mock)', { description: osId });
    } finally {
      setProcessandoOsId(null);
    }
  }, []);

  const verDetalhesOs = useCallback((osId: string) => {
    toast.info('Detalhes da OS (mock)', { description: osId });
  }, []);

  return {
    kpis: MOCK_MANUTENCAO_KPIS,
    ordensServico: MOCK_ORDENS_SERVICO,
    preventivas: MOCK_MANUTENCAO_PREVENTIVA,
    custosSemana: MOCK_CUSTOS_SEMANA,
    processandoOsId,
    assumirOs,
    verDetalhesOs,
  };
}
