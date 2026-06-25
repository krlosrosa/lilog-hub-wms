import type {
  CentroRecord,
  UnidadeRecord,
} from '../../../domain/repositories/unidade/unidade.repository.js';
import type { centros, unidades } from '../providers/drizzle/config/migrations/schema.js';

type UnidadeRow = typeof unidades.$inferSelect;
type CentroRow = typeof centros.$inferSelect;

export function mapUnidadeRow(row: UnidadeRow): UnidadeRecord {
  return {
    id: row.id,
    nome: row.nome,
    cluster: row.cluster,
    nomeFilial: row.nomeFilial,
    modoUnitizacaoRecebimento: row.modoUnitizacaoRecebimento,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapCentroRow(row: CentroRow): CentroRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    centro: row.centro.trim(),
    empresa: row.empresa,
    nome: row.nome,
    createdAt: row.createdAt,
  };
}

export function groupCentrosByUnidadeId(
  centrosRows: CentroRecord[],
): Map<string, CentroRecord[]> {
  const grouped = new Map<string, CentroRecord[]>();

  for (const centro of centrosRows) {
    const current = grouped.get(centro.unidadeId) ?? [];
    current.push(centro);
    grouped.set(centro.unidadeId, current);
  }

  return grouped;
}
