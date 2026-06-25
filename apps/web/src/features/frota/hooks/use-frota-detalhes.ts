'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { MOCK_VEICULOS_DETALHE } from '@/features/frota/mocks/frota-mock-data';
import type { VeiculoDetalheTab } from '@/features/frota/types/frota.schema';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useFrotaDetalhes(veiculoId: string) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [tabAtiva, setTabAtiva] = useState<VeiculoDetalheTab>('geral');
  const [processandoAcao, setProcessandoAcao] = useState(false);

  const veiculo = useMemo(
    () => MOCK_VEICULOS_DETALHE[veiculoId] ?? null,
    [veiculoId],
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
  }, [veiculoId]);

  const setTab = useCallback((tab: VeiculoDetalheTab) => {
    setTabAtiva(tab);
  }, []);

  const editarInfo = useCallback(() => {
    toast.info('Edição em construção (mock)');
  }, []);

  const despachar = useCallback(async () => {
    if (!veiculo) {
      return;
    }

    setProcessandoAcao(true);
    try {
      await delay(800);
      toast.success('Veículo despachado (mock)', {
        description: veiculo.nome,
      });
    } finally {
      setProcessandoAcao(false);
    }
  }, [veiculo]);

  const registrarManutencao = useCallback(() => {
    toast.info('Registrar manutenção (mock)');
  }, []);

  const uploadDocumento = useCallback((docId: string) => {
    toast.success('Upload de documento (mock)', { description: docId });
  }, []);

  const voltar = useCallback(() => {
    router.push('/frota');
  }, [router]);

  return {
    veiculo,
    isLoading,
    tabAtiva,
    setTab,
    processandoAcao,
    editarInfo,
    despachar,
    registrarManutencao,
    uploadDocumento,
    voltar,
  };
}
