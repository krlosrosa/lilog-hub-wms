import type { AuthUser } from '@/features/auth/types';
import { readPersistedUnidade } from '@/features/auth/lib/unidade-storage';

import { ensureRecebimentoV2DbReady, recebimentoV2Db } from '../local-db/db';
import { resetAutoSyncV2State } from './auto-sync-v2.service';
import { syncProcessList } from './sync-process-list.service';

const SESSION_TABLES = [
  recebimentoV2Db.processes,
  recebimentoV2Db.demands,
  recebimentoV2Db.expectedItems,
  recebimentoV2Db.conferences,
  recebimentoV2Db.checklists,
  recebimentoV2Db.temperatures,
  recebimentoV2Db.damages,
  recebimentoV2Db.media,
  recebimentoV2Db.syncOperations,
  recebimentoV2Db.syncBatches,
  recebimentoV2Db.syncIdMappings,
  recebimentoV2Db.syncCursors,
  recebimentoV2Db.syncConflicts,
  recebimentoV2Db.syncLeases,
  recebimentoV2Db.syncMeta,
] as const;

/**
 * Removes demand/conference/sync state from the previous operator session.
 * Keeps unit-scoped reference data (products, docas, unitConfigs).
 */
export async function clearRecebimentoV2UserSessionCache(): Promise<void> {
  await ensureRecebimentoV2DbReady();
  resetAutoSyncV2State();

  await recebimentoV2Db.transaction('rw', [...SESSION_TABLES], async () => {
    await Promise.all(SESSION_TABLES.map((table) => table.clear()));
  });
}

function resolveUnidadeIdForPrefetch(user: AuthUser): string | null {
  return readPersistedUnidade()?.id ?? user.unidadeId ?? null;
}

/**
 * Clears stale V2 cache after a user switch and prefetches the process list
 * for the newly logged-in operator (login already requires network).
 */
export async function refreshRecebimentoV2UserSession(user: AuthUser): Promise<void> {
  await clearRecebimentoV2UserSessionCache();

  const unidadeId = resolveUnidadeIdForPrefetch(user);
  if (!unidadeId) {
    return;
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return;
  }

  try {
    await syncProcessList(unidadeId);
  } catch {
    // Lista refaz o sync ao montar; falha aqui não bloqueia o login.
  }
}
