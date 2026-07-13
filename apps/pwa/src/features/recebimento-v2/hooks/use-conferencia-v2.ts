import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect } from 'react';

import type {
  LoteModo,
  ParametrosRecebimentoConferencia,
  QuantidadeModo,
} from '@/features/recebimento/types/recebimento.schema';

import { toBaseUnits } from '@/features/recebimento/lib/resolve-recebimento-divergencia';

import { mapConferenciaV2SyncPayload } from '../lib/map-conferencia-v2-sync-payload';
import {
  calcConferenceQuantityInUnidades,
  calcConferenceBaseUnitsFromRecord,
  CATALOGO_PRODUTO_NAO_ENCONTRADO_MSG,
  isResolvableCatalogProduct,
  normalizeSkuParam,
  resolveProdutoConferenciaV2,
  resolveUnidadesPorCaixa,
} from '../lib/resolve-produto-conferencia-v2';
import { resolveConferidoTotaisForSkuV2 } from '../lib/conferencia-quantidade';
import { recebimentoV2Db } from '../local-db/db';
import type { ConferenceRecord, ProductRecord, SyncOperationRecord } from '../local-db/schema';
import { triggerAutoSyncIfPending } from '../services/auto-sync-v2.service';
import { deleteConferenceRecord } from '../services/conference-sync.actions';
import { removeAddedItemV2 } from '../services/remove-added-item-v2.service';
import { enrichDemandItemMetadata } from '../services/enrich-demand-items.service';
import { enrichDemandProductCatalog, resolveProductForConferenciaV2 } from '../services/enrich-product-catalog.service';
import { getActivePaleteCodigo, PALETE_OBRIGATORIO_MSG } from '../services/palete-session-v2.service';
import type { DivergenciaItem } from '../types/recebimento-v2.schema';

export interface ConferirItemV2Input {
  demandId: string;
  sku: string;
  product: ProductRecord;
  parametros: ParametrosRecebimentoConferencia;
  lote?: string;
  fabricacao?: string;
  validade?: string;
  recebidaCaixa: number;
  recebidaUnidade: number;
  peso?: number;
  etiquetaCodigo?: string;
  unitizadorCodigo?: string;
}

export interface UseConferenciaV2Result {
  conferirItem: (input: ConferirItemV2Input) => Promise<string>;
  deletarConferencia: (conferenceId: string) => Promise<void>;
  removerItemAdicionado: (sku: string) => Promise<void>;
  getConferenciasBySku: (sku: string) => ConferenceRecord[];
  getDivergencias: (quantidadeModo?: QuantidadeModo) => DivergenciaItem[];
  conferences: ConferenceRecord[];
  isLoading: boolean;
}

export function useConferenciaV2(demandId: string): UseConferenciaV2Result {
  useEffect(() => {
    void enrichDemandItemMetadata(demandId);
    void recebimentoV2Db.processes.get(demandId).then((process) => {
      void enrichDemandProductCatalog(demandId, process?.unidadeId);
    });
  }, [demandId]);

  const result = useLiveQuery(async () => {
    const [allConferences, expectedItems, damages] = await Promise.all([
      recebimentoV2Db.conferences.where('demandId').equals(demandId).toArray(),
      recebimentoV2Db.expectedItems
        .where('demandId')
        .equals(demandId)
        .toArray(),
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

    return {
      conferences,
      expectedItems,
      damages,
      productByProdutoId,
      productBySku,
    };
  }, [demandId]);

  const conferences = result?.conferences ?? [];
  const expectedItems = result?.expectedItems ?? [];
  const damages = result?.damages ?? [];
  const productByProdutoId =
    result?.productByProdutoId ?? new Map<string, { sku: string; description: string }>();
  const productBySku =
    result?.productBySku ?? new Map<string, { sku: string; description: string }>();

  const conferirItem = useCallback(async (input: ConferirItemV2Input): Promise<string> => {
    const now = new Date().toISOString();
    const nowMs = Date.now();
    const id = crypto.randomUUID();
    const opId = crypto.randomUUID();

    const process = await recebimentoV2Db.processes.get(input.demandId);
    const resolvedProduct = await resolveProductForConferenciaV2(
      input.demandId,
      input.sku,
      process?.unidadeId,
    );

    if (!isResolvableCatalogProduct(resolvedProduct)) {
      throw new Error(CATALOGO_PRODUTO_NAO_ENCONTRADO_MSG);
    }

    const expectedItems = await recebimentoV2Db.expectedItems
      .where('demandId')
      .equals(input.demandId)
      .toArray();
    const expectedItem = expectedItems.find((item) =>
      normalizeSkuParam(item.sku).toUpperCase() === normalizeSkuParam(input.sku).toUpperCase(),
    );
    const produtoConfig = resolveProdutoConferenciaV2(resolvedProduct, input.parametros);
    const produtoId = resolvedProduct.produtoId;
    const unidadesPorCaixa = resolveUnidadesPorCaixa(
      expectedItem?.unidadesPorCaixa,
      resolvedProduct.unidadesPorCaixa,
    );

    const activePalete = await getActivePaleteCodigo(input.demandId);
    const unitizadorCodigo =
      input.unitizadorCodigo?.trim() ||
      activePalete ||
      undefined;

    if (input.parametros.controlaPalete && !unitizadorCodigo) {
      throw new Error(PALETE_OBRIGATORIO_MSG);
    }

    const recebidaCaixa = produtoConfig.pesoVariavel ? 1 : input.recebidaCaixa;
    const recebidaUnidade = produtoConfig.pesoVariavel ? 0 : input.recebidaUnidade;
    const quantity = calcConferenceQuantityInUnidades({
      recebidaCaixa,
      recebidaUnidade,
      unidadesPorCaixa,
      pesoVariavel: produtoConfig.pesoVariavel,
    });

    const record: ConferenceRecord = {
      id,
      demandId: input.demandId,
      sku: resolvedProduct.sku,
      lote: input.lote,
      fabricacao: input.fabricacao,
      validade: input.validade,
      quantity,
      recebidaCaixa,
      recebidaUnidade,
      peso: input.peso,
      etiquetaCodigo: input.etiquetaCodigo?.trim() || undefined,
      unitizadorCodigo,
      isPvarBox: produtoConfig.pesoVariavel,
      conferidoAt: now,
      syncStatus: 'pending',
      updatedAt: nowMs,
    };

    const syncPayload = mapConferenciaV2SyncPayload(
      record,
      {
        produtoId,
        unidadesPorCaixa,
        pesoVariavel: produtoConfig.pesoVariavel,
        controlaLote: produtoConfig.controlaLote,
        controlaValidade: produtoConfig.controlaValidade,
        quantidadeModo: input.parametros.quantidadeModo,
        controlaPalete: input.parametros.controlaPalete,
      },
      input.parametros.loteModo as LoteModo,
    );

    const syncOp: SyncOperationRecord = {
      id: opId,
      aggregateId: input.demandId,
      module: 'conference',
      opType: RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR,
      sequence: nowMs,
      dependsOn: [],
      idempotencyKey: opId,
      payload: {
        conferenceId: id,
        pesoVariavel: produtoConfig.pesoVariavel,
        ...syncPayload,
      },
      attachmentIds: [],
      status: 'pending',
      attempts: 0,
      createdAt: nowMs,
      updatedAt: nowMs,
    };

    await recebimentoV2Db.transaction(
      'rw',
      [recebimentoV2Db.conferences, recebimentoV2Db.syncOperations],
      async () => {
        await recebimentoV2Db.conferences.put(record);
        await recebimentoV2Db.syncOperations.put(syncOp);
      },
    );

    return id;
  }, []);

  const deletarConferencia = useCallback(async (conferenceId: string): Promise<void> => {
    const enqueuedSync = await deleteConferenceRecord(conferenceId);
    if (enqueuedSync) {
      triggerAutoSyncIfPending(demandId);
    }
  }, [demandId]);

  const removerItemAdicionado = useCallback(async (sku: string): Promise<void> => {
    await removeAddedItemV2(demandId, sku);
  }, [demandId]);

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

  const getDivergencias = useCallback((quantidadeModo: QuantidadeModo = 'ambos'): DivergenciaItem[] => {
    const conferencedBySku = new Map<string, number>();
    for (const c of conferences) {
      const item = findExpectedItemBySku(c.sku);
      const catalogProduct = item
        ? productByProdutoId.get(item.produtoId) ?? productBySku.get(c.sku)
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
        ? productByProdutoId.get(item.produtoId) ?? productBySku.get(sku)
        : productBySku.get(sku);
      const unidadesPorCaixa = resolveUnidadesPorCaixa(
        catalogProduct?.unidadesPorCaixa,
        item?.unidadesPorCaixa,
      );
      const expectedQuantity = item
        ? toBaseUnits(item.quantidadeEsperada, item.unidadeMedida, unidadesPorCaixa)
        : 0;
      const conferidoTotais = resolveConferidoTotaisForSkuV2(
        conferences,
        sku,
        quantidadeModo,
        unidadesPorCaixa,
      );
      const conferidoLabel = conferidoTotais.hasConferencia
        ? [
            quantidadeModo !== 'unidade' && conferidoTotais.caixa > 0
              ? `${conferidoTotais.caixa} cx`
              : null,
            quantidadeModo !== 'caixa' && conferidoTotais.unidade > 0
              ? `${conferidoTotais.unidade} un`
              : null,
          ]
            .filter(Boolean)
            .join(' · ') || `${conferencedQuantity} un`
        : undefined;
      const delta = conferencedQuantity - expectedQuantity;
      let status: DivergenciaItem['status'] = 'ok';
      if (conferencedQuantity === 0) status = 'nao_conferido';
      else if (expectedQuantity === 0 && conferencedQuantity > 0) status = 'sobra';
      else if (delta < 0) status = 'falta';
      else if (delta > 0) status = 'sobra';

      const descricao = item?.descricao?.trim();
      const displaySku =
        item?.sku && item.sku !== item.produtoId
          ? item.sku
          : catalogProduct?.sku ?? item?.sku ?? sku;
      const description =
        descricao || catalogProduct?.description?.trim() || '';

      return {
        sku: displaySku,
        description,
        expectedQuantity,
        conferencedQuantity,
        conferidoCaixa: conferidoTotais.caixa,
        conferidoUnidade: conferidoTotais.unidade,
        conferidoLabel,
        delta,
        status,
        isNovo: item?.isNovo,
        hasAvaria: avariaSkus.has(sku),
      };
    });
  }, [conferences, damages, expectedItems, findExpectedItemBySku, productByProdutoId, productBySku]);

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
