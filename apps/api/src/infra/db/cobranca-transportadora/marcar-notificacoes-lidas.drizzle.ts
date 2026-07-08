import { and, eq, inArray } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { portalNotificacoes } from '../providers/drizzle/config/migrations/schema.js';

export async function marcarNotificacoesLidasDb(
  db: DrizzleClient,
  ids: string[],
  transportadoraId: string,
): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  await db
    .update(portalNotificacoes)
    .set({
      lida: true,
      lidaEm: new Date(),
    })
    .where(
      and(
        inArray(portalNotificacoes.id, ids),
        eq(portalNotificacoes.transportadoraId, transportadoraId),
      ),
    );
}
