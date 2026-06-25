import { eq } from 'drizzle-orm';

import type { UpdateProdutoEnderecoData } from '../../../domain/model/produto-endereco/produto-endereco.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { produtoEnderecos } from '../providers/drizzle/config/migrations/schema.js';
import { findProdutoEnderecoByIdDb } from './find-produto-endereco.drizzle.js';

export async function updateProdutoEnderecoDb(
  db: DrizzleClient,
  id: string,
  data: UpdateProdutoEnderecoData,
) {
  const values: Partial<typeof produtoEnderecos.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.enderecoId !== undefined) {
    values.enderecoId = data.enderecoId;
  }

  if (data.papel !== undefined) {
    values.papel = data.papel;
  }

  if (data.ordem !== undefined) {
    values.ordem = data.ordem;
  }

  if (data.ativo !== undefined) {
    values.ativo = data.ativo;
  }

  const [updated] = await db
    .update(produtoEnderecos)
    .set(values)
    .where(eq(produtoEnderecos.id, id))
    .returning({ id: produtoEnderecos.id });

  if (!updated) {
    return null;
  }

  return findProdutoEnderecoByIdDb(db, id);
}
