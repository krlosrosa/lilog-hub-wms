import type { AvariaRegistro } from '@/features/recebimento/types/recebimento.schema';

import { db } from './db';

export function resolveAvariaCacheKey(
  demandId: string,
  recebimentoId?: string | null,
): string {
  return recebimentoId ?? `demand:${demandId}`;
}

function dedupeAvariasById(avarias: AvariaRegistro[]): AvariaRegistro[] {
  const seen = new Set<string>();
  return avarias.filter((avaria) => {
    if (seen.has(avaria.id)) return false;
    seen.add(avaria.id);
    return true;
  });
}

export async function saveAvariasToDb(
  cacheKey: string,
  avarias: AvariaRegistro[],
): Promise<void> {
  await db.recebimentoAvarias.put({
    recebimentoId: cacheKey,
    avarias: dedupeAvariasById(avarias),
    cachedAt: Date.now(),
  });
}

export async function loadAvariasFromDb(
  cacheKey: string,
): Promise<AvariaRegistro[]> {
  const entry = await db.recebimentoAvarias.get(cacheKey);
  return entry?.avarias ?? [];
}

export async function hasAvariasCacheEntry(cacheKey: string): Promise<boolean> {
  const entry = await db.recebimentoAvarias.get(cacheKey);
  return entry != null;
}

export async function hasAvariasCacheForDemand(
  demandId: string,
  recebimentoId?: string | null,
): Promise<boolean> {
  if (recebimentoId && (await hasAvariasCacheEntry(recebimentoId))) {
    return true;
  }

  return hasAvariasCacheEntry(resolveAvariaCacheKey(demandId, null));
}

export async function saveAvariasForDemand(
  demandId: string,
  recebimentoId: string | null,
  avarias: AvariaRegistro[],
): Promise<void> {
  const primaryKey = resolveAvariaCacheKey(demandId, recebimentoId);
  await saveAvariasToDb(primaryKey, avarias);

  const fallbackKey = resolveAvariaCacheKey(demandId, null);
  if (fallbackKey !== primaryKey) {
    await db.recebimentoAvarias.delete(fallbackKey);
  }
}

export async function loadAvariasForDemand(
  demandId: string,
  recebimentoId?: string | null,
): Promise<AvariaRegistro[]> {
  const fallbackKey = resolveAvariaCacheKey(demandId, null);

  if (recebimentoId) {
    if (await hasAvariasCacheEntry(recebimentoId)) {
      return loadAvariasFromDb(recebimentoId);
    }

    if (await hasAvariasCacheEntry(fallbackKey)) {
      const migrated = await loadAvariasFromDb(fallbackKey);
      await saveAvariasForDemand(demandId, recebimentoId, migrated);
      return migrated;
    }

    return [];
  }

  if (await hasAvariasCacheEntry(fallbackKey)) {
    return loadAvariasFromDb(fallbackKey);
  }

  return [];
}

export async function appendAvariaToCache(
  demandId: string,
  recebimentoId: string | null,
  registro: AvariaRegistro,
): Promise<void> {
  const existing = await loadAvariasForDemand(demandId, recebimentoId);
  if (existing.some((avaria) => avaria.id === registro.id)) {
    return;
  }

  await saveAvariasForDemand(demandId, recebimentoId, [...existing, registro]);
}

export async function removeAvariaFromCache(
  demandId: string,
  recebimentoId: string | null,
  id: string,
): Promise<void> {
  const existing = await loadAvariasForDemand(demandId, recebimentoId);
  if (!existing.some((avaria) => avaria.id === id)) {
    return;
  }

  await saveAvariasForDemand(
    demandId,
    recebimentoId,
    existing.filter((avaria) => avaria.id !== id),
  );
}
