import { useNavigate } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';
import { clearDemandaDetalhe } from '@/lib/offline/demand-detail-cache';
import { useUnidade } from '@/features/unidade';

import { getAvariasRegistradas } from '../lib/conferencia-avarias-store';
import { getSkuItemsByDemandId } from '../lib/devolucao-sku-items';
import {
  flushDevolucaoOutboxForDemanda,
  syncDevolucaoConferencia,
  syncDevolucaoStatus,
} from '../lib/devolucao-sync';
import { useDemandaDetalhe, useDemandById } from './use-demand-by-id';
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

function buildAvarias(items: SkuItem[]): TerminoAvariaItem[] {
  return items
    .filter((item) => item.hasAvaria === true || item.condicao === 'avariado')
    .map((item) => ({
      sku: item.sku,
      name: item.name,
      quantity: item.qtdConferida ?? 1,
      motivo: 'Avaria registrada',
    }));
}

function buildDivergencias(items: SkuItem[]): TerminoDivergenciaItem[] {
  return items
    .filter((item) => item.hasDivergencia === true)
    .map((item) => {
      const esperado = item.qtdEsperada ?? item.quantidadeEsperada ?? 0;
      const contado = item.qtdConferida ?? 0;
      const diff = contado - esperado;

      return {
        sku: item.sku,
        name: item.name,
        label: diff < 0 ? `Faltando: ${Math.abs(diff)}` : `Excedente: ${diff}`,
        esperado,
        contado,
      };
    });
}

function buildNaoConferidos(items: SkuItem[]): TerminoDivergenciaItem[] {
  return items
    .filter((item) => item.status !== 'conferido')
    .map((item) => ({
      sku: item.sku,
      name: item.name,
      label: 'Não conferido',
      esperado: item.qtdEsperada ?? item.quantidadeEsperada ?? 0,
      contado: item.qtdConferida ?? 0,
    }));
}

export function useTerminoProcesso(demandId: string) {
  const navigate = useNavigate();
  const demand = useDemandById(demandId);
  const detalhe = useDemandaDetalhe(demandId);
  const { unidadeSelecionada } = useUnidade();
  const [isAccordionAvariaOpen, setIsAccordionAvariaOpen] = useState(true);
  const [isAccordionNaoConferidoOpen, setIsAccordionNaoConferidoOpen] =
    useState(true);
  const [isAccordionDivergenciaOpen, setIsAccordionDivergenciaOpen] =
    useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const items =
    useLiveQuery(
      () => getSkuItemsByDemandId(demandId),
      [demandId, detalhe?.cachedAt],
    ) ?? [];

  const avariasStore = getAvariasRegistradas(demandId);
  const avariasFromItems = useMemo(() => buildAvarias(items), [items]);
  const avarias = useMemo(() => {
    if (avariasFromItems.length > 0) {
      return avariasFromItems;
    }

    return avariasStore.map((avaria) => ({
      sku: '—',
      name: `${avaria.tipo} · ${avaria.natureza}`,
      quantity: avaria.quantidadeUnidade || avaria.quantidadeCaixa,
      motivo: avaria.causa,
    }));
  }, [avariasFromItems, avariasStore]);

  const naoConferidos = useMemo(() => buildNaoConferidos(items), [items]);
  const divergencias = useMemo(() => buildDivergencias(items), [items]);

  const progress = useMemo(() => {
    const total = items.length;
    const counted = items.filter((item) => item.status === 'conferido').length;
    const percent = total > 0 ? Math.round((counted / total) * 100) : 0;
    return { total, counted, percent };
  }, [items]);

  const tempoTotal = detalhe?.updatedAt
    ? new Date(detalhe.updatedAt).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';
  const acuracia = `${progress.percent}%`;

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
    if (isFinalizing || !unidadeSelecionada?.id) {
      return;
    }

    setIsFinalizing(true);

    const itensPendentes = items
      .filter((item) => item.itemId && item.qtdConferida != null)
      .map((item) => ({
        itemId: item.itemId!,
        qtdConferida: item.qtdConferida ?? 0,
        condicao: item.condicao,
        lote: null,
      }));

    if (itensPendentes.length > 0) {
      await syncDevolucaoConferencia(
        demandId,
        {
          unidadeId: unidadeSelecionada.id,
          status: 'conferida',
          itens: itensPendentes,
        },
        `Flush conferência ${demand?.id ?? demandId}`,
      );
    } else {
      await syncDevolucaoStatus(
        demandId,
        unidadeSelecionada.id,
        { status: 'conferida' },
        `Conferência concluída ${demand?.id ?? demandId}`,
      );
    }

    await flushDevolucaoOutboxForDemanda(demandId);

    if (demand) {
      await clearDemandaDetalhe(demandId);
    }

    setIsFinalizing(false);
    setConfirmModalOpen(false);
    navigate({ to: '/devolucao' });
  }, [
    demand,
    demandId,
    isFinalizing,
    items,
    navigate,
    unidadeSelecionada?.id,
  ]);

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
