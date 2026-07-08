import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { preRecebimentos } from '../providers/drizzle/config/migrations/schema.js';

export async function gerarLinkRastreioDb(
  db: DrizzleClient,
  id: string,
  regenerar = false,
): Promise<{ token: string } | null> {
  const [existing] = await db
    .select({
      id: preRecebimentos.id,
      rastreioToken: preRecebimentos.rastreioToken,
    })
    .from(preRecebimentos)
    .where(eq(preRecebimentos.id, id))
    .limit(1);

  if (!existing) {
    return null;
  }

  if (existing.rastreioToken && !regenerar) {
    return { token: existing.rastreioToken };
  }

  const token = randomUUID();

  await db
    .update(preRecebimentos)
    .set({
      rastreioToken: token,
      updatedAt: new Date(),
    })
    .where(eq(preRecebimentos.id, id));

  return { token };
}
