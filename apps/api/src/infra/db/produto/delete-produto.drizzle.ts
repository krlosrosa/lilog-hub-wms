import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { produtos } from '../providers/drizzle/config/migrations/schema.js';

export async function deleteProdutoDb(db: DrizzleClient, produtoId: string) {
  await db.delete(produtos).where(eq(produtos.produtoId, produtoId));
}
