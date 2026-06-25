import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/lib/offline/db';

import { SEED_DEMANDS } from '../data/devolucao-seed';

export function useDemandById(id: string) {
  const demand = useLiveQuery(async () => {
    const fromDb = await db.devolucaoDemands.get(id);
    if (fromDb) return fromDb;

    const byRoute = await db.devolucaoDemands.where('routeId').equals(id).first();
    if (byRoute) return byRoute;

    return SEED_DEMANDS.find((d) => d.routeId === id || d.id === id);
  }, [id]);

  return demand;
}
