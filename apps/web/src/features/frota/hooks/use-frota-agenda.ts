'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  MOCK_AGENDA_EVENTOS,
  MOCK_FILA_ACOES,
  MOCK_FROTA_ALERTAS,
  MOCK_FROTA_STATS,
} from '@/features/frota/mocks/frota-mock-data';
import type {
  AgendaPeriodo,
  FrotaAlerta,
} from '@/features/frota/types/frota.schema';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useFrotaAgenda() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats] = useState(() => ({ ...MOCK_FROTA_STATS }));
  const [alertas] = useState(() => [...MOCK_FROTA_ALERTAS]);
  const [eventos] = useState(() => [...MOCK_AGENDA_EVENTOS]);
  const [filaAcoes] = useState(() => [...MOCK_FILA_ACOES]);
  const [periodoAgenda, setPeriodoAgenda] = useState<AgendaPeriodo>('mes');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await delay(600);
      if (!cancelled) {
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setPeriodo = useCallback((periodo: AgendaPeriodo) => {
    setPeriodoAgenda(periodo);
    toast.info(
      periodo === 'mes' ? 'Visualização: mês' : 'Visualização: semana',
      { duration: 2000 },
    );
  }, []);

  const onAlertaAcao = useCallback(
    (alerta: FrotaAlerta) => {
      if (alerta.veiculoId) {
        router.push(`/frota/${alerta.veiculoId}`);
        return;
      }
      toast.success(alerta.acaoLabel, {
        description: alerta.titulo,
      });
    },
    [router],
  );

  const onFilaAcaoClick = useCallback(
    (acaoId: string) => {
      const acao = filaAcoes.find((f) => f.id === acaoId);
      if (acao?.veiculoId) {
        router.push(`/frota/${acao.veiculoId}`);
        return;
      }
      toast.info('Ação em fila (mock)', {
        description: acao?.titulo ?? acaoId,
      });
    },
    [filaAcoes, router],
  );

  const onVerTodasAcoes = useCallback(() => {
    toast.info('Fila completa em construção (mock)');
  }, []);

  const onNovoVeiculo = useCallback(() => {
    router.push('/frota/novo');
  }, [router]);

  return {
    isLoading,
    stats,
    alertas,
    eventos,
    filaAcoes,
    periodoAgenda,
    setPeriodo,
    onAlertaAcao,
    onFilaAcaoClick,
    onVerTodasAcoes,
    onNovoVeiculo,
  };
}
