import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';

import type { QuantidadeModo } from '@/features/recebimento/types/recebimento.schema';

import { resolveConferenceQuantidadePar } from '../lib/conferencia-quantidade';
import { mapAvariaV2SyncPayload, mapAvariaRemoverV2SyncPayload } from '../lib/map-avaria-v2-sync-payload';
import { debugRecebimentoV2 } from '../lib/sync-debug';
import {
  normalizeSkuParam,
  resolveProdutoIdForSkuV2,
  resolveProductForSkuV2,
  resolveUnidadesPorCaixa,
} from '../lib/resolve-produto-conferencia-v2';
import { recebimentoV2Db } from '../local-db/db';
import type { DamageRecord, SyncOperationRecord } from '../local-db/schema';
import { triggerAutoSyncIfPending } from '../services/auto-sync-v2.service';
import type { DamageForm } from '../types/recebimento-v2.schema';

export interface RegistrarAvariaInput extends DamageForm {
  mediaIds?: string[];
  replicarParaTodos?: boolean;
  skusAlvo?: string[];
  quantidadeModo?: QuantidadeModo;
}

export interface UseAvariaV2Result {
  registrarAvaria: (input: RegistrarAvariaInput) => Promise<string>;
  removerAvaria: (damageId: string) => Promise<void>;
  limparAvarias: () => Promise<void>;
  avarias: DamageRecord[];
  avariasBySku: (sku: string) => DamageRecord[];
  isLoading: boolean;
}

function totalQuantity(input: Pick<RegistrarAvariaInput, 'quantidadeCaixa' | 'quantidadeUnidade' | 'quantity'>): number {
  const caixa = input.quantidadeCaixa ?? 0;
  const unidade = input.quantidadeUnidade ?? 0;
  if (caixa > 0 || unidade > 0) return caixa + unidade;
  return input.quantity ?? 0;
}

function matchesSkuTarget(sku: string, targets: Set<string>): boolean {
  return targets.has(normalizeSkuParam(sku).toUpperCase());
}

async function findPendingConferirOpId(
  demandId: string,
  conferenceId: string,
): Promise<string | undefined> {
  const ops = await recebimentoV2Db.syncOperations
    .where('aggregateId')
    .equals(demandId)
    .toArray();

  const conferirOp = ops.find(
    (op) =>
      op.opType === RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR &&
      (op.payload as { conferenceId?: string }).conferenceId === conferenceId &&
      (op.status === 'pending' || op.status === 'retry' || op.status === 'syncing'),
  );

  return conferirOp?.id;
}

async function createAvariaRecordAndSyncOp(params: {
  demandId: string;
  input: RegistrarAvariaInput;
  sku?: string;
  lote?: string;
  quantidadeCaixa: number;
  quantidadeUnidade: number;
  replicarParaTodos?: boolean;
  skusAlvo?: string[];
  conferenceId?: string;
  dependsOn?: string[];
  now: string;
  nowMs: number;
  sequence: number;
}): Promise<{ record: DamageRecord; syncOp: SyncOperationRecord }> {
  const {
    demandId,
    input,
    sku,
    lote,
    quantidadeCaixa,
    quantidadeUnidade,
    replicarParaTodos,
    skusAlvo,
    conferenceId,
    dependsOn,
    now,
    nowMs,
    sequence,
  } = params;

  const id = crypto.randomUUID();
  const opId = crypto.randomUUID();
  const qty = quantidadeCaixa + quantidadeUnidade > 0
    ? quantidadeCaixa + quantidadeUnidade
    : totalQuantity({ quantidadeCaixa, quantidadeUnidade });

  const product = sku ? await resolveProductForSkuV2(demandId, sku) : null;
  const produtoId = sku
    ? await resolveProdutoIdForSkuV2(demandId, sku, product)
    : undefined;

  const record: DamageRecord = {
    id,
    demandId,
    sku,
    description: input.description ?? `Avaria SKU ${sku ?? '—'}`,
    quantity: qty,
    motivo: input.motivo ?? input.tipo,
    tipo: input.tipo,
    natureza: input.natureza,
    causa: input.causa,
    lote,
    quantidadeCaixa,
    quantidadeUnidade,
    mediaIds: input.mediaIds,
    registradoAt: now,
    syncStatus: 'pending',
    replicarParaTodos,
    skusAlvo,
    updatedAt: nowMs,
  };

  const syncPayload = {
    ...mapAvariaV2SyncPayload(record, produtoId),
    ...(conferenceId ? { conferenceId } : {}),
  };

  debugRecebimentoV2('avaria', 'enqueue', {
    demandId,
    sku,
    produtoId,
    productFound: Boolean(product),
    productProdutoId: product?.produtoId,
    syncPayload,
  });

  const syncOp: SyncOperationRecord = {
    id: opId,
    aggregateId: demandId,
    module: 'damage',
    opType: RECEBIMENTO_V2_OP_TYPES.AVARIA_REGISTRAR,
    sequence,
    dependsOn: dependsOn ?? [],
    idempotencyKey: opId,
    payload: syncPayload,
    attachmentIds: input.mediaIds ?? [],
    status: 'pending',
    attempts: 0,
    createdAt: nowMs,
    updatedAt: nowMs,
  };

  return { record, syncOp };
}

async function registrarAvariaReplicada(
  demandId: string,
  input: RegistrarAvariaInput,
): Promise<string> {
  const skusAlvo = [...new Set((input.skusAlvo ?? []).map((sku) => normalizeSkuParam(sku)).filter(Boolean))];
  if (skusAlvo.length === 0) {
    throw new Error('Não há itens conferidos para replicar avaria');
  }

  const skuTargets = new Set(skusAlvo.map((sku) => sku.toUpperCase()));
  const conferences = await recebimentoV2Db.conferences
    .where('demandId')
    .equals(demandId)
    .toArray();

  const targets = conferences.filter((conference) =>
    matchesSkuTarget(conference.sku, skuTargets),
  );

  if (targets.length === 0) {
    throw new Error('Não há itens conferidos para replicar avaria');
  }

  const now = new Date().toISOString();
  const nowMs = Date.now();
  const quantidadeModo = input.quantidadeModo ?? 'ambos';
  const records: DamageRecord[] = [];
  const syncOps: SyncOperationRecord[] = [];

  for (let index = 0; index < targets.length; index += 1) {
    const conference = targets[index]!;
    const sku = normalizeSkuParam(conference.sku);
    const product = await resolveProductForSkuV2(demandId, sku);
    const unidadesPorCaixa = product ? resolveUnidadesPorCaixa(product) : 1;
    const quantidade = resolveConferenceQuantidadePar(
      conference,
      quantidadeModo,
      unidadesPorCaixa,
    );

    if (quantidade.caixa <= 0 && quantidade.unidade <= 0) {
      continue;
    }

    const dependsOn = conference.serverItemId
      ? []
      : [await findPendingConferirOpId(demandId, conference.id)].filter(
          (opId): opId is string => Boolean(opId),
        );

    const { record, syncOp } = await createAvariaRecordAndSyncOp({
      demandId,
      input,
      sku,
      lote: conference.lote?.trim() || undefined,
      quantidadeCaixa: quantidade.caixa,
      quantidadeUnidade: quantidade.unidade,
      replicarParaTodos: true,
      skusAlvo,
      conferenceId: conference.id,
      dependsOn,
      now,
      nowMs,
      sequence: nowMs + index,
    });

    records.push(record);
    syncOps.push(syncOp);
  }

  if (records.length === 0) {
    throw new Error('Não há quantidade conferida para replicar avaria');
  }

  await recebimentoV2Db.transaction(
    'rw',
    [recebimentoV2Db.damages, recebimentoV2Db.syncOperations],
    async () => {
      await recebimentoV2Db.damages.bulkPut(records);
      await recebimentoV2Db.syncOperations.bulkPut(syncOps);
    },
  );

  triggerAutoSyncIfPending(demandId);
  return records[0]!.id;
}

export function useAvariaV2(demandId: string): UseAvariaV2Result {
  const avarias = useLiveQuery(
    () =>
      recebimentoV2Db.damages
        .where('demandId')
        .equals(demandId)
        .and((d) => !d.deletedAt)
        .toArray(),
    [demandId],
  );

  const registrarAvaria = useCallback(
    async (input: RegistrarAvariaInput): Promise<string> => {
      if (input.replicarParaTodos && input.skusAlvo && input.skusAlvo.length > 0) {
        return registrarAvariaReplicada(demandId, input);
      }

      const now = new Date().toISOString();
      const nowMs = Date.now();
      const sku = input.sku?.trim() || undefined;

      const { record, syncOp } = await createAvariaRecordAndSyncOp({
        demandId,
        input,
        sku,
        lote: input.lote,
        quantidadeCaixa: input.quantidadeCaixa ?? 0,
        quantidadeUnidade: input.quantidadeUnidade ?? 0,
        now,
        nowMs,
        sequence: nowMs,
      });

      await recebimentoV2Db.transaction(
        'rw',
        [recebimentoV2Db.damages, recebimentoV2Db.syncOperations],
        async () => {
          await recebimentoV2Db.damages.put(record);
          await recebimentoV2Db.syncOperations.put(syncOp);
        },
      );

      triggerAutoSyncIfPending(demandId);
      return record.id;
    },
    [demandId],
  );

  const removerAvaria = useCallback(
    async (damageId: string): Promise<void> => {
      const now = new Date().toISOString();
      const nowMs = Date.now();

      const damage = await recebimentoV2Db.damages.get(damageId);
      if (!damage || damage.deletedAt) return;

      const removeSyncOp: SyncOperationRecord | null = damage.serverAvariaId
        ? {
            id: crypto.randomUUID(),
            aggregateId: demandId,
            module: 'damage',
            opType: RECEBIMENTO_V2_OP_TYPES.AVARIA_REMOVER,
            sequence: nowMs,
            dependsOn: [],
            idempotencyKey: crypto.randomUUID(),
            payload: mapAvariaRemoverV2SyncPayload(damageId, damage.serverAvariaId),
            attachmentIds: [],
            status: 'pending',
            attempts: 0,
            createdAt: nowMs,
            updatedAt: nowMs,
          }
        : null;

      await recebimentoV2Db.transaction(
        'rw',
        [recebimentoV2Db.damages, recebimentoV2Db.syncOperations, recebimentoV2Db.media],
        async () => {
          await recebimentoV2Db.damages.update(damageId, {
            deletedAt: now,
            syncStatus: removeSyncOp ? 'pending' : 'synced',
            updatedAt: nowMs,
          });

          const pendingOps = await recebimentoV2Db.syncOperations
            .where('aggregateId')
            .equals(demandId)
            .and(
              (op) =>
                (op.opType === RECEBIMENTO_V2_OP_TYPES.AVARIA_REGISTRAR ||
                  op.opType === RECEBIMENTO_V2_OP_TYPES.AVARIA_REMOVER) &&
                (op.status === 'pending' || op.status === 'retry'),
            )
            .toArray();

          for (const op of pendingOps) {
            const payload = op.payload as { damageId?: string };
            if (payload.damageId === damageId) {
              await recebimentoV2Db.syncOperations.delete(op.id);
            }
          }

          if (removeSyncOp) {
            await recebimentoV2Db.syncOperations.put(removeSyncOp);
          }

          if (damage.mediaIds?.length) {
            await recebimentoV2Db.media.bulkDelete(damage.mediaIds);
          }
        },
      );

      if (removeSyncOp) {
        triggerAutoSyncIfPending(demandId);
      }
    },
    [demandId],
  );

  const limparAvarias = useCallback(async (): Promise<void> => {
    const nowMs = Date.now();
    const opId = crypto.randomUUID();

    const activeAvarias = await recebimentoV2Db.damages
      .where('demandId')
      .equals(demandId)
      .and((d) => !d.deletedAt)
      .toArray();

    if (activeAvarias.length === 0) return;

    const now = new Date().toISOString();

    const syncOp: SyncOperationRecord = {
      id: opId,
      aggregateId: demandId,
      module: 'damage',
      opType: RECEBIMENTO_V2_OP_TYPES.AVARIA_CLEAR,
      sequence: nowMs,
      dependsOn: [],
      idempotencyKey: opId,
      payload: { demandId, clearedAt: now },
      attachmentIds: [],
      status: 'pending',
      attempts: 0,
      createdAt: nowMs,
      updatedAt: nowMs,
    };

    await recebimentoV2Db.transaction(
      'rw',
      [recebimentoV2Db.damages, recebimentoV2Db.syncOperations, recebimentoV2Db.media],
      async () => {
        for (const avaria of activeAvarias) {
          await recebimentoV2Db.damages.update(avaria.id, {
            deletedAt: now,
            syncStatus: 'pending',
            updatedAt: nowMs,
          });
        }

        const pendingRegisterOps = await recebimentoV2Db.syncOperations
          .where('aggregateId')
          .equals(demandId)
          .and(
            (op) =>
              (op.opType === RECEBIMENTO_V2_OP_TYPES.AVARIA_REGISTRAR ||
                op.opType === RECEBIMENTO_V2_OP_TYPES.AVARIA_REMOVER) &&
              (op.status === 'pending' || op.status === 'retry'),
          )
          .toArray();

        for (const op of pendingRegisterOps) {
          await recebimentoV2Db.syncOperations.delete(op.id);
        }

        const mediaIds = activeAvarias.flatMap((avaria) => avaria.mediaIds ?? []);
        if (mediaIds.length > 0) {
          await recebimentoV2Db.media.bulkDelete(mediaIds);
        }

        await recebimentoV2Db.syncOperations.put(syncOp);
      },
    );

    triggerAutoSyncIfPending(demandId);
  }, [demandId]);

  const avariasBySku = useCallback(
    (sku: string) => (avarias ?? []).filter((a) => a.sku === sku),
    [avarias],
  );

  return {
    registrarAvaria,
    removerAvaria,
    limparAvarias,
    avarias: avarias ?? [],
    avariasBySku,
    isLoading: avarias === undefined,
  };
}
