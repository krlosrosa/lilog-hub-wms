import { and, desc, eq } from 'drizzle-orm';

import type {
  ListarDocumentosFilter,
  DocumentoCobrancaListItem,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { documentosCobranca } from '../providers/drizzle/config/migrations/schema.js';

export async function listarDocumentosCobrancaDb(
  db: DrizzleClient,
  filter: ListarDocumentosFilter,
): Promise<DocumentoCobrancaListItem[]> {
  const conditions = [eq(documentosCobranca.unidadeId, filter.unidadeId)];

  if (filter.status) {
    conditions.push(eq(documentosCobranca.status, filter.status));
  }

  if (filter.transportadoraId) {
    conditions.push(
      eq(documentosCobranca.transportadoraId, filter.transportadoraId),
    );
  }

  const rows = await db
    .select()
    .from(documentosCobranca)
    .where(and(...conditions))
    .orderBy(desc(documentosCobranca.createdAt));

  return rows.map((row) => ({
    id: row.id,
    unidadeId: row.unidadeId,
    numeroDocumento: row.numeroDocumento,
    transportadoraId: row.transportadoraId,
    transportadoraNome: row.transportadoraNome,
    status: row.status,
    valorTotal: Number(row.valorTotal),
    quantidadeProcessos: row.quantidadeProcessos,
    quantidadeItens: row.quantidadeItens,
    emitidoEm: row.emitidoEm,
    enviadoEm: row.enviadoEm,
    pagoEm: row.pagoEm,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}
