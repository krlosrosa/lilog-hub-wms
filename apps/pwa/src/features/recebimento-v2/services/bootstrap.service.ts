import { toBaseUnits } from '@/features/recebimento/lib/resolve-recebimento-divergencia';

import type { BootstrapProgress, BootstrapStep } from '../types/recebimento-v2.schema.js';
import { getMeApi } from '@/features/auth/api';
import { ApiClientError } from '@/lib/offline/api-client';
import { fetchPackage, fetchProducts } from '../api/sync-api.js';
import { recebimentoV2Db, ensureRecebimentoV2DbReady } from '../local-db/db.js';
import type { ProcessRecord, ProductRecord } from '../local-db/schema.js';
import { refreshReferenceData } from './reference-data.service.js';
import {
  mapServerChecklistToRecord,
  resolveDockLabel,
} from '../lib/map-server-checklist-v2.js';
import { pullDemand } from './sync.service.js';

const AUTH_USER_STORAGE_KEY = 'lilog.auth.user';

const TOTAL_STEPS = 7;

const inFlightPrepares = new Map<string, Promise<void>>();

function makeProgress(
  step: BootstrapStep,
  stepIndex: number,
  message: string,
  error?: string,
): BootstrapProgress {
  return { step, stepIndex, totalSteps: TOTAL_STEPS, message, error };
}

async function isStepComplete(demandId: string, step: BootstrapStep): Promise<boolean> {
  const process = await recebimentoV2Db.processes.get(demandId);
  return process?.downloadProgress?.completedSteps?.includes(step) ?? false;
}

async function markStepComplete(demandId: string, step: BootstrapStep): Promise<void> {
  const process = await recebimentoV2Db.processes.get(demandId);
  if (!process) return;

  const completed = process.downloadProgress?.completedSteps ?? [];
  if (!completed.includes(step)) {
    completed.push(step);
  }

  await recebimentoV2Db.processes.update(demandId, {
    downloadProgress: {
      totalSteps: TOTAL_STEPS,
      ...(process.downloadProgress ?? {}),
      completedSteps: completed,
      currentStep: step,
    },
    updatedAt: Date.now(),
  });
}

async function markProcessError(demandId: string, message: string): Promise<void> {
  await recebimentoV2Db.processes.update(demandId, {
    status: 'error',
    errorMessage: message,
    updatedAt: Date.now(),
  });
}

async function finalizeIfAllStepsComplete(
  demandId: string,
  stepKeys: BootstrapStep[],
): Promise<void> {
  const process = await recebimentoV2Db.processes.get(demandId);
  if (!process) return;

  const completed = process.downloadProgress?.completedSteps ?? [];
  const allDone = stepKeys.every((key) => completed.includes(key));
  if (!allDone) return;

  if (process.status === 'downloading' || process.status === 'error') {
    await recebimentoV2Db.processes.update(demandId, {
      status: 'ready',
      errorMessage: undefined,
      downloadedAt: process.downloadedAt ?? Date.now(),
      updatedAt: Date.now(),
    });
  }
}

// Step 1: Validate session (cookie httpOnly — não é legível via document.cookie)
async function validateSession(): Promise<void> {
  if (typeof window === 'undefined') return;

  if (navigator.onLine) {
    try {
      await getMeApi();
      return;
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        throw new Error('Sessão inválida. Faça login novamente.');
      }
      throw error;
    }
  }

  if (!localStorage.getItem(AUTH_USER_STORAGE_KEY)) {
    throw new Error('Sessão inválida. Faça login novamente.');
  }
}

async function ensureCatalogCanRefresh(demandId: string, unidadeId: string): Promise<void> {
  const sample = await recebimentoV2Db.products
    .where('unidadeId')
    .equals(unidadeId)
    .limit(5)
    .toArray();
  const catalogMissingDescriptions =
    sample.length > 0 && sample.every((product) => !product.description?.trim());

  if (!catalogMissingDescriptions) {
    return;
  }

  await recebimentoV2Db.syncCursors.delete(`products:${unidadeId}`);

  const process = await recebimentoV2Db.processes.get(demandId);
  const completed = process?.downloadProgress?.completedSteps ?? [];
  if (!completed.includes('catalog')) {
    return;
  }

  await recebimentoV2Db.processes.update(demandId, {
    downloadProgress: {
      totalSteps: TOTAL_STEPS,
      ...(process?.downloadProgress ?? {}),
      completedSteps: completed.filter((step) => step !== 'catalog'),
    },
    updatedAt: Date.now(),
  });
}

// Step 2: Update product catalog with cursor-based pagination
type ProductDatasetRow = {
  produtoId: string;
  sku: string;
  descricao?: string;
  description?: string;
  unidadeId?: string;
  empresa?: string;
  categoria?: string;
  tipo?: string;
  ean?: string;
  dum?: string;
  shelfLife?: number;
  pesoBrutoUnidade?: number;
  pesoBrutoCaixa?: number;
  pesoBrutoPalete?: number;
  pesoLiquidoUnidade?: number;
  pesoLiquidoCaixa?: number;
  pesoLiquidoPalete?: number;
  unidadesPorCaixa?: number;
  caixasPorPalete?: number;
  controlaLote?: boolean;
  controlaValidade?: boolean;
  controlaPeso?: boolean;
  pesoVariavel?: boolean;
  serverRevision?: number;
  updatedAt?: number | string;
  deletedAt?: number | null;
  tombstone?: boolean;
};

function mapProductDatasetRow(item: ProductDatasetRow, unidadeId: string): ProductRecord {
  const updatedAt =
    typeof item.updatedAt === 'number'
      ? item.updatedAt
      : item.updatedAt
        ? Date.parse(item.updatedAt)
        : Date.now();

  const tipo = item.tipo ?? '';
  const categoria = item.categoria ?? '';
  const shelfLife = item.shelfLife ?? 0;
  const pesoVariavel =
    item.pesoVariavel ?? tipo.trim().toUpperCase() === 'PVAR';

  return {
    produtoId: item.produtoId,
    sku: item.sku,
    description: item.descricao ?? item.description ?? '',
    unidadeId: item.unidadeId ?? unidadeId,
    empresa: item.empresa ?? '',
    categoria,
    tipo,
    ean: item.ean ?? '',
    dum: item.dum ?? '',
    shelfLife,
    pesoBrutoUnidade: item.pesoBrutoUnidade ?? 0,
    pesoBrutoCaixa: item.pesoBrutoCaixa ?? 0,
    pesoBrutoPalete: item.pesoBrutoPalete ?? 0,
    pesoLiquidoUnidade: item.pesoLiquidoUnidade ?? 0,
    pesoLiquidoCaixa: item.pesoLiquidoCaixa ?? 0,
    pesoLiquidoPalete: item.pesoLiquidoPalete ?? 0,
    unidadesPorCaixa: item.unidadesPorCaixa ?? 0,
    caixasPorPalete: item.caixasPorPalete ?? 0,
    controlaLote:
      item.controlaLote ??
      (categoria === 'refrigerado' || categoria === 'queijo'),
    controlaValidade: item.controlaValidade ?? shelfLife > 0,
    controlaPeso: item.controlaPeso ?? pesoVariavel,
    pesoVariavel,
    serverRevision: item.serverRevision ?? 0,
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : Date.now(),
    deletedAt: item.deletedAt ?? null,
  };
}

async function updateProductCatalog(unidadeId: string): Promise<void> {
  const cursorRecord = await recebimentoV2Db.syncCursors.get(`products:${unidadeId}`);
  let nextCursor: string | undefined = cursorRecord?.cursor;
  let hasMore = true;

  while (hasMore) {
    const dataset = await fetchProducts(unidadeId, nextCursor);

    await recebimentoV2Db.transaction('rw', recebimentoV2Db.products, async () => {
      for (const item of dataset.items) {
        const product = item as ProductDatasetRow;
        if (product.tombstone) {
          await recebimentoV2Db.products.delete(product.produtoId);
        } else {
          await recebimentoV2Db.products.put(mapProductDatasetRow(product, unidadeId));
        }
      }
    });

    if (dataset.nextCursor) {
      await recebimentoV2Db.syncCursors.put({
        id: `products:${unidadeId}`,
        cursor: dataset.nextCursor,
        lastSyncedAt: Date.now(),
      });
      nextCursor = dataset.nextCursor;
    }

    hasMore = dataset.hasMore && !!dataset.nextCursor;
  }
}

// Step 4+5: Download and validate package
async function downloadAndValidatePackage(demandId: string): Promise<unknown> {
  const raw = await fetchPackage(demandId);
  if (!raw || typeof raw !== 'object' || !('demandId' in raw)) {
    throw new Error('Pacote de demanda inválido ou incompleto');
  }
  return raw;
}

// Step 6: Write package to Dexie in one transaction (never clears dirty records)
type PackageProdutoMeta = {
  sku: string;
  descricao: string;
};

async function writePackageToDB(demandId: string, pkg: unknown): Promise<number> {
  const p = pkg as {
    serverRevision?: number;
    revision?: number;
    preRecebimento?: {
      id: string;
      unidadeId: string;
      situacao: string;
      docaId?: string | null;
      itens?: Array<{
        produtoId: string;
        sku?: string;
        descricao?: string;
        quantidadeEsperada: number;
        unidadeMedida: string;
        unidadesPorCaixa?: number;
      }>;
    };
    detalhe?: {
      produtos?: Array<{
        produtoId: string;
        sku: string;
        descricao: string;
      }>;
    };
    recebimento?: { id: string; situacao: string; docaId?: string | null };
    checklist?: Record<string, unknown>;
    temperaturas?: Array<{ etapa: string; temperatura: number }>;
  };

  const serverRevision = p.serverRevision ?? p.revision ?? 0;
  const detalheProdutos = new Map<string, PackageProdutoMeta>(
    (p.detalhe?.produtos ?? []).map((produto) => [
      produto.produtoId,
      { sku: produto.sku, descricao: produto.descricao },
    ]),
  );

  const produtoIds = p.preRecebimento?.itens?.map((item) => item.produtoId) ?? [];
  const catalogProducts =
    produtoIds.length > 0
      ? await recebimentoV2Db.products.bulkGet(produtoIds)
      : [];
  const catalogByProdutoId = new Map(
    catalogProducts
      .filter((product): product is NonNullable<typeof product> =>
        Boolean(product && product.deletedAt === null),
      )
      .map((product) => [product.produtoId, product]),
  );

  const pre = p.preRecebimento;
  let checklistRecord: ReturnType<typeof mapServerChecklistToRecord> | null = null;
  const existingChecklist = await recebimentoV2Db.checklists.get(demandId);
  if (p.checklist && pre) {
    if (!existingChecklist || existingChecklist.syncStatus === 'synced') {
      const docaId =
        p.recebimento?.docaId ??
        (typeof p.checklist.docaId === 'string' ? p.checklist.docaId : null) ??
        pre.docaId ??
        null;
      const dock = await resolveDockLabel(pre.unidadeId, docaId);
      checklistRecord = mapServerChecklistToRecord(
        p.checklist,
        demandId,
        dock,
        Date.now(),
      );
    }
  } else if (pre && (!existingChecklist || existingChecklist.syncStatus === 'synced')) {
    const docaId = p.recebimento?.docaId ?? pre.docaId ?? null;
    const dockFromDoca = docaId
      ? await resolveDockLabel(pre.unidadeId, docaId)
      : '';
    const dock = existingChecklist?.dock?.trim() || dockFromDoca.trim();
    if (dock && !existingChecklist?.dock?.trim()) {
      const now = Date.now();
      checklistRecord = {
        demandId,
        id: existingChecklist?.id ?? crypto.randomUUID(),
        dock,
        lacre: existingChecklist?.lacre ?? '',
        tempBau: existingChecklist?.tempBau,
        conditions: existingChecklist?.conditions ?? {},
        observacoes: existingChecklist?.observacoes,
        savedAt: existingChecklist?.savedAt ?? new Date(now).toISOString(),
        syncStatus: existingChecklist?.syncStatus ?? 'synced',
        updatedAt: now,
      };
    }
  }

  await recebimentoV2Db.transaction(
    'rw',
    [
      recebimentoV2Db.demands,
      recebimentoV2Db.expectedItems,
      recebimentoV2Db.checklists,
      recebimentoV2Db.temperatures,
      recebimentoV2Db.processes,
    ],
    async () => {
      if (pre) {
        await recebimentoV2Db.demands.put({
          id: pre.id,
          unidadeId: pre.unidadeId,
          routeId: demandId,
          fornecedorCodigo: '',
          fornecedorNome: '',
          status: pre.situacao,
          situacao: pre.situacao,
          dataPrevisaoEntrega: '',
          dataCriacao: '',
          serverRevision,
          updatedAt: Date.now(),
        });

        if (pre.itens && Array.isArray(pre.itens)) {
          for (const item of pre.itens) {
            const fromDetalhe = detalheProdutos.get(item.produtoId);
            const fromCatalog = catalogByProdutoId.get(item.produtoId);
            const sku =
              item.sku?.trim() ||
              fromDetalhe?.sku ||
              fromCatalog?.sku ||
              item.produtoId;
            const descricao =
              item.descricao?.trim() ||
              fromDetalhe?.descricao ||
              fromCatalog?.description ||
              '';
            const unidadesPorCaixa =
              item.unidadesPorCaixa ??
              fromCatalog?.unidadesPorCaixa ??
              1;
            const quantidadeEsperada = toBaseUnits(
              item.quantidadeEsperada,
              item.unidadeMedida,
              unidadesPorCaixa,
            );

            await recebimentoV2Db.expectedItems.put({
              id: `${demandId}::${item.produtoId}`,
              demandId,
              produtoId: item.produtoId,
              sku,
              descricao,
              quantidadeEsperada,
              unidadeMedida: 'UN',
              unidadesPorCaixa,
              updatedAt: Date.now(),
            });
          }
        }
      }

      // Write checklist from server when not dirty
      if (checklistRecord) {
        await recebimentoV2Db.checklists.put(checklistRecord);
      }

      // Write temperatures if not dirty
      if (p.temperaturas && Array.isArray(p.temperaturas)) {
        for (const temp of p.temperaturas) {
          const key = `${demandId}::${temp.etapa}`;
          const existing = await recebimentoV2Db.temperatures.get(key);
          if (!existing || existing.syncStatus === 'synced') {
            await recebimentoV2Db.temperatures.put({
              id: key,
              demandId,
              etapa: temp.etapa,
              temperatura: temp.temperatura,
              syncStatus: 'synced',
              updatedAt: Date.now(),
            });
          }
        }
      }

      // Update process revision
      await recebimentoV2Db.processes.update(demandId, {
        serverRevision,
        status: 'ready',
        ...(p.recebimento?.id ? { recebimentoId: p.recebimento.id } : {}),
        updatedAt: Date.now(),
      });
    },
  );

  return serverRevision;
}

/**
 * Downloads and prepares a demand for offline use.
 * Retrying skips already-completed steps.
 * Never uses clear() — applies upsert/tombstone only.
 */
export async function prepareRecebimentoOffline(
  demandId: string,
  unidadeId: string,
  onProgress: (p: BootstrapProgress) => void,
): Promise<void> {
  const inFlight = inFlightPrepares.get(demandId);
  if (inFlight) {
    return inFlight;
  }

  const run = async () => {
  await ensureRecebimentoV2DbReady();
  await ensureCatalogCanRefresh(demandId, unidadeId);

  const existing = await recebimentoV2Db.processes.get(demandId);
  if (!existing) {
    const now = Date.now();
    await recebimentoV2Db.processes.put({
      id: demandId,
      unidadeId,
      adapter: 'recebimento-v2' as const,
      status: 'downloading' as const,
      serverRevision: 0,
      baseRevision: 0,
      downloadProgress: { completedSteps: [], totalSteps: TOTAL_STEPS },
      flowVersion: 'v2' as const,
      createdAt: now,
      updatedAt: now,
    } satisfies ProcessRecord);
  } else {
    await recebimentoV2Db.processes.update(demandId, {
      status: 'downloading',
      errorMessage: undefined,
      updatedAt: Date.now(),
    });
  }

  const steps: Array<{
    key: BootstrapStep;
    index: number;
    label: string;
    run: () => Promise<void>;
  }> = [
    {
      key: 'session',
      index: 1,
      label: 'Validando sessão...',
      run: validateSession,
    },
    {
      key: 'catalog',
      index: 2,
      label: 'Atualizando catálogo de produtos...',
      run: () => updateProductCatalog(unidadeId),
    },
    {
      key: 'reference-data',
      index: 3,
      label: 'Atualizando dados de referência...',
      run: () => refreshReferenceData(unidadeId),
    },
    {
      key: 'package',
      index: 4,
      label: 'Baixando pacote da demanda...',
      run: async () => {
        const pkg = await downloadAndValidatePackage(demandId);
        await writePackageToDB(demandId, pkg);
      },
    },
    {
      key: 'snapshot',
      index: 5,
      label: 'Carregando conferências e avarias...',
      run: () => pullDemand(demandId),
    },
    {
      key: 'media',
      index: 6,
      label: 'Preparando metadados de mídia...',
      run: () => Promise.resolve(),
    },
    {
      key: 'done',
      index: 7,
      label: 'Preparação concluída',
      run: async () => {
        await recebimentoV2Db.processes.update(demandId, {
          status: 'ready',
          downloadedAt: Date.now(),
          updatedAt: Date.now(),
        });
      },
    },
  ];

  for (const step of steps) {
    if (await isStepComplete(demandId, step.key)) {
      onProgress(makeProgress(step.key, step.index, `✓ ${step.label}`));
      continue;
    }

    onProgress(makeProgress(step.key, step.index, step.label));

    try {
      await step.run();
      await markStepComplete(demandId, step.key);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido';
      onProgress(makeProgress(step.key, step.index, step.label, message));
      await markProcessError(demandId, message);
      throw error;
    }
  }

  await finalizeIfAllStepsComplete(
    demandId,
    steps.map((step) => step.key),
  );
  };

  const promise = run().finally(() => {
    inFlightPrepares.delete(demandId);
  });

  inFlightPrepares.set(demandId, promise);
  return promise;
}
