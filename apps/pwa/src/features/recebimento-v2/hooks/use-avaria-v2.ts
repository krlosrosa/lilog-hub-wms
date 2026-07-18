import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';

import type { QuantidadeModo } from '@/features/recebimento/types/recebimento.schema';

import { resolveConferenceQuantidadePar } from '../lib/conferencia-quantidade';
import { debugRecebimentoV2 } from '../lib/sync-debug';
import {
  normalizeSkuParam,
  resolveProdutoIdForSkuV2,
  resolveProductForSkuV2,
  resolveUnidadesPorCaixa,
} from '../lib/resolve-produto-conferencia-v2';
import { recebimentoV2Db } from '../local-db/db';
import type { DamageRecord } from '../local-db/schema';
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

async function createAvariaRecord(params: {
  demandId: string;
  input: RegistrarAvariaInput;
  sku?: string;
  lote?: string;
  quantidadeCaixa: number;
  quantidadeUnidade: number;
  replicarParaTodos?: boolean;
  skusAlvo?: string[];
  now: string;
  nowMs: number;
}): Promise<DamageRecord> {
  const {
    demandId,
    input,
    sku,
    lote,
    quantidadeCaixa,
    quantidadeUnidade,
    replicarParaTodos,
    skusAlvo,
    now,
    nowMs,
  } = params;

  const id = crypto.randomUUID();
  const qty =
    quantidadeCaixa + quantidadeUnidade > 0
      ? quantidadeCaixa + quantidadeUnidade
      : totalQuantity({ quantidadeCaixa, quantidadeUnidade });

  const product = sku ? await resolveProductForSkuV2(demandId, sku) : null;
  const produtoId = sku ? await resolveProdutoIdForSkuV2(demandId, sku, product) : undefined;

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

  debugRecebimentoV2('avaria', 'save-local', {
    demandId,
    sku,
    produtoId,
    productFound: Boolean(product),
    damageId: id,
  });

  return record;
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

  for (const conference of targets) {
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

    records.push(
      await createAvariaRecord({
        demandId,
        input,
        sku,
        lote: conference.lote?.trim() || undefined,
        quantidadeCaixa: quantidade.caixa,
        quantidadeUnidade: quantidade.unidade,
        replicarParaTodos: true,
        skusAlvo,
        now,
        nowMs,
      }),
    );
  }

  if (records.length === 0) {
    throw new Error('Não há quantidade conferida para replicar avaria');
  }

  await recebimentoV2Db.damages.bulkPut(records);
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

      const record = await createAvariaRecord({
        demandId,
        input,
        sku,
        lote: input.lote,
        quantidadeCaixa: input.quantidadeCaixa ?? 0,
        quantidadeUnidade: input.quantidadeUnidade ?? 0,
        now,
        nowMs,
      });

      await recebimentoV2Db.damages.put(record);
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

      const needsSync = damage.syncStatus !== 'synced' || damage.serverAvariaId != null;

      await recebimentoV2Db.transaction(
        'rw',
        [recebimentoV2Db.damages, recebimentoV2Db.media],
        async () => {
          await recebimentoV2Db.damages.update(damageId, {
            deletedAt: now,
            syncStatus: needsSync ? 'pending' : 'synced',
            updatedAt: nowMs,
          });

          if (damage.mediaIds?.length) {
            await recebimentoV2Db.media.bulkDelete(damage.mediaIds);
          }
        },
      );

      if (needsSync) {
        triggerAutoSyncIfPending(demandId);
      }
    },
    [demandId],
  );

  const limparAvarias = useCallback(async (): Promise<void> => {
    const nowMs = Date.now();

    const activeAvarias = await recebimentoV2Db.damages
      .where('demandId')
      .equals(demandId)
      .and((d) => !d.deletedAt)
      .toArray();

    if (activeAvarias.length === 0) return;

    const now = new Date().toISOString();
    const needsSync = activeAvarias.some(
      (avaria) => avaria.syncStatus !== 'synced' || avaria.serverAvariaId != null,
    );

    await recebimentoV2Db.transaction(
      'rw',
      [recebimentoV2Db.damages, recebimentoV2Db.media],
      async () => {
        for (const avaria of activeAvarias) {
          await recebimentoV2Db.damages.update(avaria.id, {
            deletedAt: now,
            syncStatus: needsSync ? 'pending' : 'synced',
            updatedAt: nowMs,
          });
        }

        const mediaIds = activeAvarias.flatMap((avaria) => avaria.mediaIds ?? []);
        if (mediaIds.length > 0) {
          await recebimentoV2Db.media.bulkDelete(mediaIds);
        }
      },
    );

    if (needsSync) {
      triggerAutoSyncIfPending(demandId);
    }
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
};
