'use client';

import { useCallback, useState } from 'react';

import {
  MOCK_AUDITORIA,
  MOCK_CHECKLIST_AREAS,
  MOCK_EVIDENCIAS,
  MOCK_HANDOVER_NOTA,
  MOCK_KPIS,
  MOCK_RACKS,
} from '@/features/passagem-bastao/mocks/passagem-bastao.mock';
import type { HandoverNota } from '@/features/passagem-bastao/types/passagem-bastao.schema';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function usePassagemBastaoRelatorios() {
  const [isLoading, setIsLoading] = useState(false);
  const [handoverNota, setHandoverNota] = useState<HandoverNota | null>(
    MOCK_HANDOVER_NOTA,
  );

  const anexarEvidencias = useCallback(async () => {
    setIsLoading(true);
    await delay(800);
    setIsLoading(false);
    return { success: true as const };
  }, []);

  const gerarPdf = useCallback(async () => {
    setIsLoading(true);
    await delay(900);
    setIsLoading(false);
    return { success: true as const, format: 'pdf' as const };
  }, []);

  const confirmarCondicoes = useCallback(async () => {
    setIsLoading(true);
    await delay(1000);
    setIsLoading(false);
    return { success: true as const };
  }, []);

  const responderNota = useCallback(async () => {
    setIsLoading(true);
    await delay(600);
    setIsLoading(false);
    return { success: true as const };
  }, []);

  const arquivarNota = useCallback(async () => {
    setIsLoading(true);
    await delay(600);
    setHandoverNota(null);
    setIsLoading(false);
    return { success: true as const };
  }, []);

  const chamarManutencao = useCallback(async () => {
    setIsLoading(true);
    await delay(700);
    setIsLoading(false);
    return { success: true as const };
  }, []);

  return {
    isLoading,
    auditoria: MOCK_AUDITORIA,
    kpis: MOCK_KPIS,
    checklistAreas: MOCK_CHECKLIST_AREAS,
    racks: MOCK_RACKS,
    evidencias: MOCK_EVIDENCIAS,
    handoverNota,
    anexarEvidencias,
    gerarPdf,
    confirmarCondicoes,
    responderNota,
    arquivarNota,
    chamarManutencao,
  };
}
