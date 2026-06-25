'use client';

import { useCallback, useMemo, useState } from 'react';

import type { FinalizarDevolucaoOpcoes } from '@/features/devolucao/components/modal-confirmar-finalizar-devolucao';
import {
  getDemandaDetalheById,
  MOCK_CONFERENCE_ITEMS,
  MOCK_EVIDENCES,
  MOCK_TIMELINE,
} from '@/features/devolucao/mocks/devolucao-mock-data';
import type { DemandaDetalhe } from '@/features/devolucao/types/devolucao-detalhes.schema';

const PAGE_SIZE = 5;

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useDevolucaoDetalhes(id: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [detalhe, setDetalhe] = useState<DemandaDetalhe>(() =>
    getDemandaDetalheById(id),
  );
  const [conferenceItems] = useState(() => [...MOCK_CONFERENCE_ITEMS]);
  const [timeline, setTimeline] = useState(() => [...MOCK_TIMELINE]);
  const [evidences, setEvidences] = useState(() => [...MOCK_EVIDENCES]);
  const [isFinalizarOpen, setIsFinalizarOpen] = useState(false);

  const totalPaginas = Math.max(
    1,
    Math.ceil(conferenceItems.length / PAGE_SIZE),
  );

  const itemsPagina = useMemo(() => {
    const start = (pagina - 1) * PAGE_SIZE;
    return conferenceItems.slice(start, start + PAGE_SIZE);
  }, [conferenceItems, pagina]);

  const totalSkus = 42;

  const finalizarProcesso = useCallback(async (opcoes: FinalizarDevolucaoOpcoes) => {
    setIsLoading(true);
    await delay(1000);
    setDetalhe((prev) => ({ ...prev, status: 'finalizado' }));
    setTimeline((prev) =>
      prev.map((step) =>
        step.id === 'tl-4'
          ? { ...step, status: 'completed' as const, progressoPercent: 100 }
          : step,
      ),
    );
    setIsFinalizarOpen(false);
    setIsLoading(false);
    return { success: true as const, ...opcoes };
  }, []);

  const openFinalizar = useCallback(() => {
    setIsFinalizarOpen(true);
  }, []);

  const closeFinalizar = useCallback(() => {
    if (!isLoading) setIsFinalizarOpen(false);
  }, [isLoading]);

  const confirmarFinalizar = useCallback(
    async (opcoes: FinalizarDevolucaoOpcoes) => finalizarProcesso(opcoes),
    [finalizarProcesso],
  );

  const reabrirDemanda = useCallback(async () => {
    setIsLoading(true);
    await delay(800);
    setDetalhe((prev) => ({ ...prev, status: 'em-conferencia' }));
    setTimeline((prev) =>
      prev.map((step) =>
        step.id === 'tl-4'
          ? { ...step, status: 'active' as const, progressoPercent: 65 }
          : step,
      ),
    );
    setIsLoading(false);
    return { success: true as const };
  }, []);

  const imprimirRelatorio = useCallback(async () => {
    setIsLoading(true);
    await delay(600);
    setIsLoading(false);
    return { success: true as const };
  }, []);

  const reportarIncidente = useCallback(async () => {
    setIsLoading(true);
    await delay(800);
    setIsLoading(false);
    return { success: true as const };
  }, []);

  const liberarDoca = useCallback(async () => {
    setIsLoading(true);
    await delay(800);
    setIsLoading(false);
    return { success: true as const };
  }, []);

  const anexarEvidencia = useCallback(async () => {
    setIsLoading(true);
    await delay(500);
    setEvidences((prev) => [
      ...prev.filter((e) => !e.isPlaceholder),
      {
        id: `ev-${Date.now()}`,
        alt: 'Nova evidência anexada',
        isPlaceholder: false,
      },
      {
        id: 'ev-placeholder',
        alt: 'Anexar nova evidência',
        isPlaceholder: true,
      },
    ]);
    setIsLoading(false);
    return { success: true as const };
  }, []);

  return {
    isLoading,
    detalhe,
    conferenceItems: itemsPagina,
    allConferenceItems: conferenceItems,
    timeline,
    evidences,
    pagina,
    setPagina,
    totalPaginas,
    totalSkus,
    pageSize: PAGE_SIZE,
    isFinalizarOpen,
    openFinalizar,
    closeFinalizar,
    confirmarFinalizar,
    reabrirDemanda,
    imprimirRelatorio,
    reportarIncidente,
    liberarDoca,
    anexarEvidencia,
  };
}
