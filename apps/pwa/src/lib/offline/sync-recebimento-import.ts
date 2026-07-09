import { importOfflineRecebimento } from '@/features/recebimento/lib/recebimento-api';
import { uploadRecebimentoImportPhotos } from '@/features/recebimento/lib/upload-recebimento-import-photos';
import { createShortId } from '@/lib/random-id';

import { ApiClientError } from './api-client';
import type { OutboxEntry } from './db';
import { db } from './db';
import { clearRecebimentoDemandAfterSync } from './demand-cache';
import { markDiscarded, markDone, markError, markSyncing } from './outbox';
import { extractDemandFromOutbox } from './sync-export/demand-grouping';
import { sortRecebimentoOutboxEntries } from './sync-export/build-package';

export function isRecebimentoOutboxEntry(entry: OutboxEntry): boolean {
  return /^\/recebimentos\//i.test(entry.endpoint.trim());
}

function groupRecebimentoEntriesByDemand(
  entries: OutboxEntry[],
): Map<string, OutboxEntry[]> {
  const groups = new Map<string, OutboxEntry[]>();

  for (const entry of entries) {
    const extracted = extractDemandFromOutbox(entry);
    const demandId = extracted?.demandId;
    if (!demandId || extracted?.module !== 'recebimento') {
      continue;
    }

    const current = groups.get(demandId) ?? [];
    current.push(entry);
    groups.set(demandId, current);
  }

  return groups;
}

export async function syncRecebimentoOutboxImports(input: {
  entries: OutboxEntry[];
}): Promise<{
  synced: number;
  failed: number;
  lastError?: string;
}> {
  const recebimentoEntries = input.entries.filter(isRecebimentoOutboxEntry);
  const groups = groupRecebimentoEntriesByDemand(recebimentoEntries);

  let synced = 0;
  let failed = 0;
  let lastError: string | undefined;

  for (const [demandId, groupEntries] of groups) {
    const sortedEntries = sortRecebimentoOutboxEntries(groupEntries);
    const exportId = createShortId(12);
    const cachedDemand = await db.demands.get(demandId);

    const importEntries = [];

    for (const entry of sortedEntries) {
      if (entry.id == null) continue;

      const payload =
        typeof entry.payload === 'object' && entry.payload !== null
          ? { ...(entry.payload as Record<string, unknown>) }
          : { data: entry.payload };

      importEntries.push({
        outboxId: entry.id,
        label: entry.label,
        endpoint: entry.endpoint,
        method: entry.method,
        payload,
        createdAt: entry.createdAt,
      });
    }

    if (importEntries.length === 0) {
      continue;
    }

    try {
      for (const entry of sortedEntries) {
        if (entry.id != null) {
          await markSyncing(db, entry.id);
        }
      }

      const result = await importOfflineRecebimento(demandId, {
        exportId,
        unidadeId: cachedDemand?.unidadeId,
        entries: importEntries,
      });

      const failedLabels = new Set(result.errors.map((error) => error.label));
      const hasSuccessfulEntries = sortedEntries.some(
        (entry) => entry.label && !failedLabels.has(entry.label),
      );

      if (hasSuccessfulEntries && result.recebimentoId) {
        await uploadRecebimentoImportPhotos({
          demandId,
          recebimentoId: result.recebimentoId,
          entries: sortedEntries.filter(
            (entry) => entry.label && !failedLabels.has(entry.label),
          ),
        });
      }

      for (const entry of sortedEntries) {
        if (entry.id == null) continue;

        if (failedLabels.has(entry.label)) {
          const error = result.errors.find((item) => item.label === entry.label);
          await markError(db, entry.id, error?.message ?? 'Falha na importação offline');
          failed += 1;
          lastError = error?.message;
          continue;
        }

        await markDone(db, entry.id);
        synced += 1;
      }

      if (result.errors.length === 0) {
        await clearRecebimentoDemandAfterSync(demandId, cachedDemand?.routeId);
      }
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Falha ao importar recebimento offline';

      for (const entry of sortedEntries) {
        if (entry.id == null) continue;

        const isPermanent =
          error instanceof ApiClientError &&
          (error.status === 422 || error.status === 409);

        if (isPermanent) {
          await markDiscarded(db, entry.id, message);
        } else {
          await markError(db, entry.id, message);
        }
        failed += 1;
      }

      lastError = message;
    }
  }

  return { synced, failed, lastError };
}
