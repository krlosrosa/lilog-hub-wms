import type { CentroOrigemRecord } from '../../../domain/repositories/centro-origem/centro-origem.repository.js';
import type { centrosOrigem } from '../providers/drizzle/config/migrations/schema.js';

type CentroOrigemRow = typeof centrosOrigem.$inferSelect;

export function mapCentroOrigemRow(row: CentroOrigemRow): CentroOrigemRecord {
  return {
    centro: row.centro,
    nome: row.nome,
  };
}
