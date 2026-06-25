import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { produtoEnderecos } from '../providers/drizzle/config/migrations/schema.js';

export async function deleteProdutoEnderecoDb(db: DrizzleClient, id: string) {
  await db.delete(produtoEnderecos).where(eq(produtoEnderecos.id, id));
}
