import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';

import type { RegistrarAvariaInput } from '@/features/recebimento-v2/hooks/use-avaria-v2';
import { normalizeSkuParam } from '@/features/recebimento-v2/lib/resolve-produto-conferencia-v2';
import { recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';
import type { DamageRecord } from '@/features/recebimento-v2/local-db/schema';
import {
  deleteAllAvariaMediaForDemand,
  deleteAvariaMediaUnreferencedByActiveDamages,
} from '@/features/recebimento-v2/services/sync-photo.helpers';

import { useConferenceExecutorV3 } from '../context/conference-executor.context';

export type { RegistrarAvariaInput };

export function useAvariaV3(demandId: string) {
  const { executor } = useConferenceExecutorV3();

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
    async (input: RegistrarAvariaInput) => executor.registrarAvaria(demandId, input),
    [demandId, executor],
  );

  const removerAvaria = useCallback(
    async (damageId: string) => executor.removeAvaria(damageId),
    [executor],
  );

  const limparAvarias = useCallback(async () => {
    const active = await recebimentoV2Db.damages
      .where('demandId')
      .equals(demandId)
      .and((d) => !d.deletedAt)
      .toArray();

    for (const damage of active) {
      await executor.removeAvaria(damage.id);
    }

    await deleteAllAvariaMediaForDemand(demandId);
    await deleteAvariaMediaUnreferencedByActiveDamages(demandId);
  }, [demandId, executor]);

  const avariasBySku = useCallback(
    (sku: string): DamageRecord[] => {
      const normalized = normalizeSkuParam(sku).toUpperCase();
      return (avarias ?? []).filter(
        (item) => normalizeSkuParam(item.sku ?? '').toUpperCase() === normalized,
      );
    },
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

export type UseAvariaV3Result = ReturnType<typeof useAvariaV3>;
