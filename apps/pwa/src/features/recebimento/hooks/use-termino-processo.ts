import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';
import { db } from '@/lib/offline/db';
import { isApiConfigured } from '@/lib/offline/api-client';

import { getAvariasRegistradas } from '../lib/conferencia-avarias-store';
import { getConferenciaContextStore, ensureConferenciaContext } from '../lib/conferencia-context-store';
import { listAvarias } from '../lib/recebimento-api';
import { submitConferenciaBackground } from '../lib/submit-conferencia';
import { triggerAutoSyncIfPending } from '@/lib/offline/sync-engine';
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

function mapLocalAvariasToTermino(
  demandId: string,
  skuByProduto: Map<string, string>,
): TerminoAvariaItem[] {
  return getAvariasRegistradas(demandId).map((avaria) => ({
    sku: avaria.sku ?? avaria.produtoId ?? '—',
    name:
      (avaria.sku ? skuByProduto.get(avaria.sku) : undefined) ??
      (avaria.produtoId ? skuByProduto.get(avaria.produtoId) : undefined) ??
      avaria.tipo,
    quantity: avaria.quantidadeCaixa + avaria.quantidadeUnidade,
    motivo: `${avaria.tipo} / ${avaria.causa}`,
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
  const divergencias = useMemo(() => buildDivergencias(items), [items]);

  useEffect(() => {
    const skuByProduto = new Map(
      (context?.itens ?? []).map((item) => [item.sku, item.name]),
    );
    for (const meta of Object.values(context?.itemMetaBySku ?? {})) {
      skuByProduto.set(meta.produtoId, meta.descricao);
      skuByProduto.set(meta.sku, meta.descricao);
    }

    const local = mapLocalAvariasToTermino(demandId, skuByProduto);
    if (local.length > 0) {
      setAvarias(local);
    }

    if (!recebimentoId || !isApiConfigured() || !navigator.onLine) {
      return;
    }

    void listAvarias(recebimentoId)
      .then((apiAvarias) => {
        if (apiAvarias.length < local.length) {
          return;
        }

        setAvarias(
          apiAvarias.map((avaria) => ({
            sku: avaria.produtoId ?? '—',
            name: skuByProduto.get(avaria.produtoId ?? '') ?? avaria.tipo,
            quantity: avaria.quantidadeCaixas + avaria.quantidadeUnidades,
            motivo: `${avaria.tipo} / ${avaria.causa}`,
          })),
        );
      })
      .catch(() => {
        // Mantém avarias locais quando a API falha.
      });
  }, [context?.itemMetaBySku, context?.itens, demandId, recebimentoId]);

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

  const handleFinalizarDoca = useCallback(() => {
    if (isFinalizing) return;

    setIsFinalizing(true);
    setFinalizeError(null);
    setEncerrado(true);
    setConfirmModalOpen(false);

    // Marca a demanda como conferida localmente e dispara o envio em segundo
    // plano. O usuário não fica travado esperando a sincronização terminar.
    void (async () => {
      const cachedDemand = await db.demands.get(demandId);
      if (cachedDemand) {
        await db.demands.put({
          ...cachedDemand,
          status: 'conferido',
          statusLabel: 'Aguardando sincronização',
          preRecebimentoSituacao: 'conferido',
          pendingOfflineSync: true,
        });
      }

      void submitConferenciaBackground(demandId).then((result) => {
        if (result.status !== 'success') {
          triggerAutoSyncIfPending();
        }
      });
    })();

    setIsFinalizing(false);
    navigate({ to: '/recebimento' });
  }, [demandId, isFinalizing, navigate]);

  return {
    state: {
      demandId,
      demand,
      dock: demand?.dock ?? context?.dock ?? '—',
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
