import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/lib/offline/db';

export function useDemandById(id: string) {
  const demand = useLiveQuery(async () => {
    const fromDb = await db.demands.get(id);
    if (fromDb) return fromDb;

    const all = await db.demands.toArray();
    return all.find((d) => d.routeId === id || d.id === id);
  }, [id]);

  return demand;
}
