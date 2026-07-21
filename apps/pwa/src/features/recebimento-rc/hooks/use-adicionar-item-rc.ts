import { useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';

import {
  isExactProductCodeMatch,
  normalizeSkuParam,
} from '@/features/recebimento-v2/lib/resolve-produto-conferencia-v2';
import { repairProductCatalogForSku } from '@/features/recebimento-v2/services/enrich-product-catalog.service';
import { hapticMedium } from '@/lib/haptics';
import {
  isValidationPushError,
  parsePushErrorMessage,
} from '@/lib/replicache/parse-push-error';
import {
  useExpectedItemsReplicache,
  useReplicache,
} from '@/lib/replicache/hooks';

import { findExpectedItemBySku } from '../lib/map-expected-item-to-product';
import { useDemandaRc } from './use-demanda-rc';

export function useAdicionarItemRc(preRecebimentoId: string) {
  const navigate = useNavigate();
  const { rep } = useReplicache();
  const demanda = useDemandaRc(preRecebimentoId);
  const expectedItems = useExpectedItemsReplicache(preRecebimentoId);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [skuInput, setSkuInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const resetSheet = useCallback(() => {
    setSkuInput('');
    setError(null);
  }, []);

  const handleSkuInputChange = useCallback((value: string) => {
    setSkuInput(value);
    setError(null);
  }, []);

  const conferirSku = useCallback(async () => {
    const sku = normalizeSkuParam(skuInput).toUpperCase();
    if (!sku) {
      setError('Informe o SKU');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const fromCarga = findExpectedItemBySku(expectedItems, sku);

      if (fromCarga) {
        hapticMedium();
        setSheetOpen(false);
        resetSheet();
        await navigate({
          to: '/recebimento-rc/$id',
          params: { id: preRecebimentoId },
          search: { sku: fromCarga.sku },
        });
        return;
      }

      const unidadeId = demanda?.unidadeId;
      if (!unidadeId) {
        setError('Demanda não encontrada');
        return;
      }

      if (!rep) {
        setError('Sincronização indisponível');
        return;
      }

      let product: Awaited<ReturnType<typeof repairProductCatalogForSku>> = null;
      try {
        product = await repairProductCatalogForSku(sku, unidadeId);
      } catch {
        const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
        setError(
          isOffline
            ? 'Sem conexão: produto não encontrado localmente'
            : 'Produto não encontrado no catálogo',
        );
        return;
      }

      if (!product || !isExactProductCodeMatch(sku, product.sku, product.ean)) {
        setError('Produto não encontrado no catálogo');
        return;
      }

      await rep.mutate.adicionarItemManual({
        preRecebimentoId,
        produtoId: product.produtoId,
        sku: product.sku,
        clientRecordId: crypto.randomUUID(),
      });

      try {
        await rep.push({ now: true });
      } catch (pushError) {
        const message = parsePushErrorMessage(pushError);
        if (isValidationPushError(message)) {
          throw new Error(message);
        }
        throw pushError;
      }

      hapticMedium();
      setSheetOpen(false);
      resetSheet();
      await navigate({
        to: '/recebimento-rc/$id',
        params: { id: preRecebimentoId },
        search: { sku: product.sku },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao validar SKU');
    } finally {
      setIsValidating(false);
    }
  }, [
    demanda?.unidadeId,
    expectedItems,
    navigate,
    preRecebimentoId,
    rep,
    resetSheet,
    skuInput,
  ]);

  return {
    sheetOpen,
    setSheetOpen,
    skuInput,
    handleSkuInputChange,
    error,
    isValidating,
    conferirSku,
    resetSheet,
  };
}
