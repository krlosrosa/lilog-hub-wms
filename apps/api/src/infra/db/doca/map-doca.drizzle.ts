import type {
  CreateDocaInput,
  UpdateDocaInput,
} from '../../../domain/model/doca/doca.model.js';
import type { DocaRecord } from '../../../domain/repositories/doca/doca.repository.js';
import type { docas } from '../providers/drizzle/config/migrations/schema.js';

type DocaRow = typeof docas.$inferSelect;

export function mapDocaRow(row: DocaRow): DocaRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    codigo: row.codigo,
    nome: row.nome,
    tipo: row.tipo,
    situacao: row.situacao,
    capacidadeVeiculos: row.capacidadeVeiculos,
    observacao: row.observacao,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toDocaInsertValues(data: CreateDocaInput) {
  return {
    unidadeId: data.unidadeId,
    codigo: data.codigo.trim(),
    nome: data.nome.trim(),
    tipo: data.tipo as DocaRow['tipo'],
    situacao: 'disponivel' as DocaRow['situacao'],
    capacidadeVeiculos: data.capacidadeVeiculos ?? null,
    observacao: data.observacao ?? null,
  };
}

export function toDocaUpdateValues(data: UpdateDocaInput) {
  const values: Partial<typeof docas.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.codigo !== undefined) values.codigo = data.codigo.trim();
  if (data.nome !== undefined) values.nome = data.nome.trim();
  if (data.tipo !== undefined) values.tipo = data.tipo as DocaRow['tipo'];
  if (data.situacao !== undefined) {
    values.situacao = data.situacao as DocaRow['situacao'];
  }
  if (data.capacidadeVeiculos !== undefined) {
    values.capacidadeVeiculos = data.capacidadeVeiculos;
  }
  if (data.observacao !== undefined) values.observacao = data.observacao;

  return values;
}
