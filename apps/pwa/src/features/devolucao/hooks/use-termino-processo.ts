import { useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';

import { getSkuItemsByDemandId } from './use-lista-itens';
import { useDemandById } from './use-demand-by-id';
import type { SkuItem } from '../types/devolucao.schema';

export interface TerminoAvariaItem {
  sku: string;
  name: string;
  quantity: number;
  motivo: string;
}

export interface TerminoDivergenciaItem {
  sku: string;
  name: string;
  label: string;
  esperado: number;
  contado: number;
}

const AVARIA_DETAILS: Record<string, Pick<TerminoAvariaItem, 'quantity' | 'motivo'>> = {
  'SKU-10293': { quantity: 2, motivo: 'Embalagem Molhada' },
  'SKU-77210': { quantity: 1, motivo: 'Dano físico na caixa' },
};

const DIVERGENCIA_DETAILS: Record<
  string,
  Pick<TerminoDivergenciaItem, 'label' | 'esperado' | 'contado'>
> = {
  'SKU-99012': { label: 'Faltando: 2', esperado: 50, contado: 48 },
  'SKU-44501': { label: 'Excedente: 1', esperado: 10, contado: 11 },
};

const NAO_CONFERIDO_DETAILS: Record<
  string,
  Pick<TerminoDivergenciaItem, 'label' | 'esperado' | 'contado'>
> = {
  'SKU-99012': { label: 'Não conferido', esperado: 50, contado: 0 },
  'SKU-88231': { label: 'Não conferido', esperado: 24, contado: 0 },
  'SKU-10293': { label: 'Não conferido', esperado: 12, contado: 0 },
};

function buildAvarias(items: SkuItem[]): TerminoAvariaItem[] {
  return items
    .filter((item) => item.hasAvaria === true)
    .map((item) => {
      const details = AVARIA_DETAILS[item.sku] ?? {
        quantity: 1,
        motivo: 'Avaria registrada',
      };
      return {
        sku: item.sku,
        name: item.name,
        ...details,
      };
    });
}

function buildDivergencias(items: SkuItem[]): TerminoDivergenciaItem[] {
  return items
    .filter((item) => item.hasDivergencia === true)
    .map((item) => {
      const details = DIVERGENCIA_DETAILS[item.sku] ?? {
        label: 'Divergência',
        esperado: 0,
        contado: 0,
      };
      return {
        sku: item.sku,
        name: item.name,
        ...details,
      };
    });
}

function buildNaoConferidos(items: SkuItem[]): TerminoDivergenciaItem[] {
  return items
    .filter((item) => item.status !== 'conferido')
    .map((item) => {
      const details = NAO_CONFERIDO_DETAILS[item.sku] ?? {
        label: 'Não conferido',
        esperado: 0,
        contado: 0,
      };
      return {
        sku: item.sku,
        name: item.name,
        ...details,
      };
    });
}

export function useTerminoProcesso(demandId: string) {
  const navigate = useNavigate();
  const demand = useDemandById(demandId);
  const [isAccordionAvariaOpen, setIsAccordionAvariaOpen] = useState(true);
  const [isAccordionNaoConferidoOpen, setIsAccordionNaoConferidoOpen] = useState(true);
  const [isAccordionDivergenciaOpen, setIsAccordionDivergenciaOpen] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const items = useMemo(() => getSkuItemsByDemandId(), []);
  const avarias = useMemo(() => buildAvarias(items), [items]);
  const naoConferidos = useMemo(() => buildNaoConferidos(items), [items]);
  const divergencias = useMemo(() => buildDivergencias(items), [items]);

  const tempoTotal = '45 min';
  const acuracia = '100%';

  const toggleAvariaAccordion = useCallback(() => {
    setIsAccordionAvariaOpen((open) => !open);
  }, []);

  const toggleNaoConferidoAccordion = useCallback(() => {
    setIsAccordionNaoConferidoOpen((open) => !open);
  }, []);

  const toggleDivergenciaAccordion = useCallback(() => {
    setIsAccordionDivergenciaOpen((open) => !open);
  }, []);

  const openConfirmModal = useCallback(() => {
    hapticMedium();
    setConfirmModalOpen(true);
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModalOpen(false);
  }, []);

  const handleFinalizarDoca = useCallback(async () => {
    if (isFinalizing) return;

    setIsFinalizing(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsFinalizing(false);
    setConfirmModalOpen(false);
    navigate({ to: '/devolucao' });
  }, [isFinalizing, navigate]);

  return {
    state: {
      demandId,
      demand,
      dock: demand?.dock ?? '—',
      avarias,
      naoConferidos,
      divergencias,
      tempoTotal,
      acuracia,
      isAccordionAvariaOpen,
      isAccordionNaoConferidoOpen,
      isAccordionDivergenciaOpen,
      isFinalizing,
      confirmModalOpen,
    },
    actions: {
      toggleAvariaAccordion,
      toggleNaoConferidoAccordion,
      toggleDivergenciaAccordion,
      openConfirmModal,
      closeConfirmModal,
      handleFinalizarDoca,
    },
  };
}
