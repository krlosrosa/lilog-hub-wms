import type {
  CreateTransportadoraInput,
  UpdateTransportadoraInput,
} from '../../../domain/model/transportadora/transportadora.model.js';
import { normalizeCnpjDigits } from '../../../domain/model/transportadora/transportadora.model.js';
import type { TransportadoraRecord } from '../../../domain/repositories/transportadora/transportadora.repository.js';
import type { transportadoras } from '../providers/drizzle/config/migrations/schema.js';

type TransportadoraRow = typeof transportadoras.$inferSelect;

export function mapTransportadoraRow(row: TransportadoraRow): TransportadoraRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    idRavexTransportadora: row.idRavexTransportadora,
    nome: row.nome,
    cnpj: row.cnpj,
    status: row.status,
    quantidadeVeiculos: row.quantidadeVeiculos,
    emails: row.emails ?? [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toTransportadoraInsertValues(data: CreateTransportadoraInput) {
  return {
    unidadeId: data.unidadeId,
    idRavexTransportadora: data.idRavexTransportadora,
    nome: data.nome.trim(),
    cnpj: normalizeCnpjDigits(data.cnpj),
    status: (data.status ?? 'ativa') as TransportadoraRow['status'],
    quantidadeVeiculos: data.quantidadeVeiculos ?? 0,
    emails: data.emails ?? [],
  };
}

export function toTransportadoraUpdateValues(data: UpdateTransportadoraInput) {
  const values: Partial<typeof transportadoras.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.nome !== undefined) {
    values.nome = data.nome.trim();
  }

  if (data.cnpj !== undefined) {
    values.cnpj = normalizeCnpjDigits(data.cnpj);
  }

  if (data.status !== undefined) {
    values.status = data.status as TransportadoraRow['status'];
  }

  if (data.quantidadeVeiculos !== undefined) {
    values.quantidadeVeiculos = data.quantidadeVeiculos;
  }

  if (data.emails !== undefined) {
    values.emails = data.emails;
  }

  return values;
}
