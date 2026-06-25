import type { CreateProdutoEnderecoData } from '../../../domain/model/produto-endereco/produto-endereco.model.js';
import type { ProdutoEnderecoRecord } from '../../../domain/repositories/produto-endereco/produto-endereco.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { produtoEnderecos } from '../providers/drizzle/config/migrations/schema.js';
import { findProdutoEnderecoByIdDb } from './find-produto-endereco.drizzle.js';

export async function createProdutoEnderecoDb(
  db: DrizzleClient,
  data: CreateProdutoEnderecoData,
): Promise<ProdutoEnderecoRecord> {
  const [record] = await db
    .insert(produtoEnderecos)
    .values({
      centroId: data.centroId,
      produtoId: data.produtoId,
      enderecoId: data.enderecoId,
      papel: data.papel,
      ordem: data.ordem,
      ativo: data.ativo,
    })
    .returning();

  if (!record) {
    throw new Error('Failed to create produto endereco');
  }

  const created = await findProdutoEnderecoByIdDb(db, record.id);

  if (!created) {
    throw new Error('Failed to load created produto endereco');
  }

  return created;
}
