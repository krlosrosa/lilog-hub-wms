import type { ExpectedItemView } from '@lilog/contracts';
import { useMemo } from 'react';

import {
  useDemandasReplicache,
} from '@/lib/replicache/hooks';

import { findExpectedItemBySku, mapExpectedItemToProduct } from '../lib/map-expected-item-to-product';
import { resolveProductForConferenciaRcAsync } from '../lib/resolve-product-conferencia-rc';
export function useDemandaRc(preRecebimentoId: string) {
  const demandas = useDemandasReplicache();

  return useMemo(
    () => demandas.find((demanda) => demanda.preRecebimentoId === preRecebimentoId) ?? null,
    [demandas, preRecebimentoId],
  );
}

export function useProcessLikeRc(preRecebimentoId: string) {
  const demanda = useDemandaRc(preRecebimentoId);

  return useMemo(() => {
    if (!demanda) return null;

    return {
      id: demanda.preRecebimentoId,
      unidadeId: demanda.unidadeId,
      recebimentoId: demanda.recebimentoId ?? undefined,
      supplier: demanda.transportadoraNome ?? undefined,
      dock: demanda.dock ?? undefined,
      placa: demanda.placa ?? undefined,
      conferente: demanda.conferente ?? undefined,
      atribuidoAMim: demanda.atribuidoAMim,
    };
  }, [demanda]);
}

export function resolveProductForConferenciaRc(
  expectedItems: ExpectedItemView[],
  sku: string | undefined,
  unidadeId: string | undefined,
) {
  if (!sku?.trim() || !unidadeId) {
    return null;
  }

  const item = findExpectedItemBySku(expectedItems, sku);
  if (!item) {
    return null;
  }

  return mapExpectedItemToProduct(item, unidadeId);
}

export { resolveProductForConferenciaRcAsync };
