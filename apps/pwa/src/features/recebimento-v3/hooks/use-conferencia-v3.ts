import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect } from 'react';

import type { QuantidadeModo } from '@/features/recebimento/types/recebimento.schema';
import type { ConferirItemV2Input } from '@/features/recebimento-v2/hooks/use-conferencia-v2';
import {
  calcConferenceBaseUnitsFromRecord,
  normalizeSkuParam,
  resolveUnidadesPorCaixa,
} from '@/features/recebimento-v2/lib/resolve-produto-conferencia-v2';
import { recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';
import type { ConferenceRecord } from '@/features/recebimento-v2/local-db/schema';
import { enrichDemandItemMetadata } from '@/features/recebimento-v2/services/enrich-demand-items.service';
import { enrichDemandProductCatalog } from '@/features/recebimento-v2/services/enrich-product-catalog.service';
import type { DivergenciaItem } from '@/features/recebimento-v2/types/recebimento-v2.schema';

import { useConferenceExecutorV3 } from '../context/conference-executor.context';

export type { ConferirItemV2Input };

export function useConferenciaV3(demandId: string) {
  const { executor } = useConferenceExecutorV3();

  useEffect(() => {
    void enrichDemandItemMetadata(demandId);
    void recebimentoV2Db.processes.get(demandId).then((process) => {
      void enrichDemandProductCatalog(demandId, process?.unidadeId);
    });
  }, [demandId]);

  const result = useLiveQuery(async () => {
    const [allConferences, expectedItems, damages] = await Promise.all([
      recebimentoV2Db.conferences.where('demandId').equals(demandId).toArray(),
      recebimentoV2Db.expectedItems.where('demandId').equals(demandId).toArray(),
      recebimentoV2Db.damages
        .where('demandId')
        .equals(demandId)
        .and((d) => !d.deletedAt)
        .toArray(),
    ]);

    const produtoIds = new Set(expectedItems.map((item) => item.produtoId));
    const productsById =
      produtoIds.size > 0
        ? await recebimentoV2Db.products.bulkGet([...produtoIds])
        : [];
    const productByProdutoId = new Map(
      productsById
        .filter((product): product is NonNullable<typeof product> =>
          Boolean(product && product.deletedAt === null),
        )
        .map((product) => [product.produtoId, product]),
    );

    const conferences = allConferences.filter((c) => c.deletedAt == null);
    const skus = new Set([
      ...expectedItems.map((item) => item.sku),
      ...conferences.map((c) => c.sku),
    ]);
    const productsBySku =
      skus.size > 0
        ? await recebimentoV2Db.products
            .where('sku')
            .anyOf([...skus])
            .filter((p) => p.deletedAt === null)
            .toArray()
        : [];
    const productBySku = new Map(productsBySku.map((p) => [p.sku, p]));

    return { conferences, expectedItems, damages, productByProdutoId, productBySku };
  }, [demandId]);

  const conferences = result?.conferences ?? [];
  const expectedItems = result?.expectedItems ?? [];
  const damages = result?.damages ?? [];
  const productByProdutoId = result?.productByProdutoId ?? new Map();
  const productBySku = result?.productBySku ?? new Map();

  const conferirItem = useCallback(
    async (input: ConferirItemV2Input) => executor.conferirItem(input),
    [executor],
  );

  const deletarConferencia = useCallback(
    async (conferenceId: string) => executor.removeConference(conferenceId),
    [executor],
  );

  const removerItemAdicionado = useCallback(
    async (sku: string) => executor.removeAddedItem(demandId, sku),
    [demandId, executor],
  );

  const getConferenciasBySku = useCallback(
    (sku: string): ConferenceRecord[] => {
      const normalized = normalizeSkuParam(sku).toUpperCase();
      return conferences.filter(
        (c) => normalizeSkuParam(c.sku).toUpperCase() === normalized,
      );
    },
    [conferences],
  );

  const findExpectedItemBySku = useCallback(
    (sku: string) => {
      const normalized = normalizeSkuParam(sku).toUpperCase();
      return expectedItems.find(
        (entry) => normalizeSkuParam(entry.sku).toUpperCase() === normalized,
      );
    },
    [expectedItems],
  );

  const getDivergencias = useCallback(
    (quantidadeModo: QuantidadeModo = 'ambos'): DivergenciaItem[] => {
      const conferencedBySku = new Map<string, number>();
      for (const c of conferences) {
        const item = findExpectedItemBySku(c.sku);
        const catalogProduct = item
          ? (productByProdutoId.get(item.produtoId) ?? productBySku.get(c.sku))
          : productBySku.get(c.sku);
        const upc = resolveUnidadesPorCaixa(
          catalogProduct?.unidadesPorCaixa,
          item?.unidadesPorCaixa,
        );
        const baseUnits = calcConferenceBaseUnitsFromRecord(c, upc, quantidadeModo);
        const skuKey = normalizeSkuParam(c.sku).toUpperCase();
        conferencedBySku.set(skuKey, (conferencedBySku.get(skuKey) ?? 0) + baseUnits);
      }

      const avariaSkus = new Set(
        damages.map((d) => d.sku).filter((sku): sku is string => Boolean(sku)),
      );
      const itemsBySku = new Map(
        expectedItems.map((item) => [normalizeSkuParam(item.sku).toUpperCase(), item]),
      );
      const allSkus = new Set([
        ...expectedItems.map((item) => item.sku),
        ...conferences.map((c) => c.sku),
      ]);

      return Array.from(allSkus).map((sku) => {
        const skuKey = normalizeSkuParam(sku).toUpperCase();
        const item = itemsBySku.get(skuKey);
        const conferencedQuantity = conferencedBySku.get(skuKey) ?? 0;
        const catalogProduct = item
          ? (productByProdutoId.get(item.produtoId) ?? productBySku.get(sku))
          : productBySku.get(sku);
        const upc = resolveUnidadesPorCaixa(
          catalogProduct?.unidadesPorCaixa,
          item?.unidadesPorCaixa,
        );
        const expectedQuantity = item?.quantidadeEsperada ?? 0;

        let status: DivergenciaItem['status'] = 'nao_conferido';
        if (conferencedQuantity > 0) {
          if (conferencedQuantity === expectedQuantity) status = 'ok';
          else if (conferencedQuantity < expectedQuantity) status = 'falta';
          else status = 'sobra';
        }

        return {
          sku,
          descricao: item?.descricao ?? catalogProduct?.description ?? sku,
          expectedQuantity,
          conferencedQuantity,
          unidadesPorCaixa: upc,
          status,
          hasAvaria: avariaSkus.has(sku),
          isNovo: item?.isNovo,
        };
      });
    },
    [
      conferences,
      damages,
      expectedItems,
      findExpectedItemBySku,
      productByProdutoId,
      productBySku,
    ],
  );

  return {
    conferirItem,
    deletarConferencia,
    removerItemAdicionado,
    getConferenciasBySku,
    getDivergencias,
    conferences,
    isLoading: result === undefined,
  };
}
