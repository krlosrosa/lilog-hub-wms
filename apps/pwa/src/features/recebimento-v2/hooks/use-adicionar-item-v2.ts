import { useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';

import {
  isExactProductCodeMatch,
  normalizeSkuParam,
} from '../lib/resolve-produto-conferencia-v2';
import { recebimentoV2Db } from '../local-db/db';
import type { ExpectedItemRecord } from '../local-db/schema';
import { repairProductCatalogForSku } from '../services/enrich-product-catalog.service';

export function useAdicionarItemV2(demandId: string) {
  const navigate = useNavigate();
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
      const expectedItems = await recebimentoV2Db.expectedItems
        .where('demandId')
        .equals(demandId)
        .toArray();

      const fromCarga = expectedItems.find(
        (item) => normalizeSkuParam(item.sku).toUpperCase() === sku,
      );

      if (fromCarga) {
        hapticMedium();
        setSheetOpen(false);
        resetSheet();
        await navigate({
          to: '/recebimento-v2/$id/',
          params: { id: demandId },
          search: { sku: fromCarga.sku },
        });
        return;
      }

      const process = await recebimentoV2Db.processes.get(demandId);
      const product = await repairProductCatalogForSku(sku, process?.unidadeId ?? '');

      if (
        product &&
        isExactProductCodeMatch(sku, product.sku, product.ean)
      ) {
        hapticMedium();
        const nowMs = Date.now();
        const record: ExpectedItemRecord = {
          id: `${demandId}::${product.produtoId}`,
          demandId,
          produtoId: product.produtoId,
          sku: product.sku,
          descricao: product.description,
          quantidadeEsperada: 0,
          unidadeMedida: 'UN',
          unidadesPorCaixa: product.unidadesPorCaixa,
          isNovo: true,
          updatedAt: nowMs,
        };
        await recebimentoV2Db.expectedItems.put(record);
        setSheetOpen(false);
        resetSheet();
        await navigate({
          to: '/recebimento-v2/$id/',
          params: { id: demandId },
          search: { sku: product.sku },
        });
        return;
      }

      setError('Produto não encontrado no catálogo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao validar SKU');
    } finally {
      setIsValidating(false);
    }
  }, [demandId, navigate, resetSheet, skuInput]);

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
