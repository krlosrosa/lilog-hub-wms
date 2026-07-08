import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';
import { clearDemandCache } from '@/lib/offline/demand-cache';
import { isApiConfigured } from '@/lib/offline/api-client';

import { getConferenciaContextStore, ensureConferenciaContext } from '../lib/conferencia-context-store';
import {
  encerrarConferencia,
  listAvarias,
} from '../lib/recebimento-api';
import { getSkuItemsByDemandId } from './use-lista-itens';
import { useDemandById } from './use-demand-by-id';
import type { SkuItem } from '../types/recebimento.schema';

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

function buildDivergencias(items: SkuItem[]): TerminoDivergenciaItem[] {
  return items
    .filter((item) => item.hasDivergencia === true)
    .map((item) => ({
      sku: item.sku,
      name: item.name,
      label: 'Divergência',
      esperado: item.qtdEsperada ?? item.quantidadeEsperada ?? 0,
      contado: item.qtdConferida ?? 0,
    }));
}

export function useTerminoProcesso(demandId: string) {
  const navigate = useNavigate();
  const demand = useDemandById(demandId);
  const [isAccordionAvariaOpen, setIsAccordionAvariaOpen] = useState(true);
  const [isAccordionNaoConferidoOpen, setIsAccordionNaoConferidoOpen] = useState(true);
  const [isAccordionDivergenciaOpen, setIsAccordionDivergenciaOpen] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [avarias, setAvarias] = useState<TerminoAvariaItem[]>([]);
  const [divergencias, setDivergencias] = useState<TerminoDivergenciaItem[]>([]);
  const [encerrado, setEncerrado] = useState(false);
  const [items, setItems] = useState<SkuItem[]>(() => getSkuItemsByDemandId(demandId));

  const context = getConferenciaContextStore(demandId);
  const recebimentoId = context?.recebimentoId ?? demand?.recebimentoId ?? null;

  useEffect(() => {
    void ensureConferenciaContext(demandId).then((loaded) => {
      if (loaded) {
        setItems(loaded.itens);
      }
    });
  }, [demandId]);

  const naoConferidos = useMemo(() => buildNaoConferidos(items), [items]);
  const divergenciasFromItems = useMemo(() => buildDivergencias(items), [items]);
  const divergenciasVisiveis =
    divergenciasFromItems.length > 0 ? divergenciasFromItems : divergencias;

  useEffect(() => {
    if (!recebimentoId || !isApiConfigured()) return;

    void listAvarias(recebimentoId).then((apiAvarias) => {
      const skuByProduto = new Map(
        (context?.itens ?? []).map((item) => [item.sku, item.name]),
      );

      setAvarias(
        apiAvarias.map((avaria) => ({
          sku: avaria.produtoId ?? '—',
          name: skuByProduto.get(avaria.produtoId ?? '') ?? avaria.tipo,
          quantity: avaria.quantidadeCaixas + avaria.quantidadeUnidades,
          motivo: `${avaria.tipo} / ${avaria.causa}`,
        })),
      );
    });
  }, [context?.itens, recebimentoId]);

  const tempoTotal = encerrado ? '—' : 'Em andamento';
  const acuracia =
    items.length > 0
      ? `${Math.round(
          (items.filter((item) => item.status === 'conferido').length / items.length) *
            100,
        )}%`
      : '—';

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
    setFinalizeError(null);

    try {
      if (recebimentoId && isApiConfigured()) {
        const result = await encerrarConferencia(recebimentoId);
        setEncerrado(true);

        const skuByProduto = new Map(
          Object.values(context?.itemMetaBySku ?? {}).map((meta) => [
            meta.produtoId,
            { sku: meta.sku, name: meta.descricao },
          ]),
        );

        setDivergencias(
          (result.divergencias ?? []).map((div) => {
            const produto = div.produtoId
              ? skuByProduto.get(div.produtoId)
              : undefined;

            return {
              sku: produto?.sku ?? div.produtoId ?? '—',
              name: produto?.name ?? div.tipoDivergencia,
              label: 'Divergência',
              esperado: div.quantidadeEsperada ?? 0,
              contado: div.quantidadeRecebida ?? 0,
            };
          }),
        );
      }

      await clearDemandCache(demandId, demand?.routeId);

      setIsFinalizing(false);
      setConfirmModalOpen(false);
      navigate({ to: '/recebimento' });
    } catch (error) {
      setIsFinalizing(false);
      setFinalizeError(
        error instanceof Error ? error.message : 'Falha ao encerrar conferência',
      );
    }
  }, [
    context?.itemMetaBySku,
    demand?.routeId,
    demandId,
    isFinalizing,
    navigate,
    recebimentoId,
  ]);

  return {
    state: {
      demandId,
      demand,
      dock: demand?.dock ?? context?.dock ?? '—',
      avarias,
      naoConferidos,
      divergencias: divergenciasVisiveis,
      tempoTotal,
      acuracia,
      isAccordionAvariaOpen,
      isAccordionNaoConferidoOpen,
      isAccordionDivergenciaOpen,
      isFinalizing,
      confirmModalOpen,
      finalizeError,
      encerrado,
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
