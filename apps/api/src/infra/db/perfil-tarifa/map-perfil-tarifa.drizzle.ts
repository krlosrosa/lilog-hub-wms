import type {
  CreatePerfilTarifaInput,
  UpdatePerfilTarifaInput,
} from '../../../domain/model/perfil-tarifa/perfil-tarifa.model.js';
import type {
  FaixaKmRecord,
  PerfilTarifaRecord,
} from '../../../domain/repositories/perfil-tarifa/perfil-tarifa.repository.js';
import type {
  perfisTarifas,
  perfisTarifasFaixasKm,
} from '../providers/drizzle/config/migrations/schema.js';

type PerfilTarifaRow = typeof perfisTarifas.$inferSelect;
type FaixaKmRow = typeof perfisTarifasFaixasKm.$inferSelect;

export function mapFaixaKmRow(row: FaixaKmRow): FaixaKmRecord {
  return {
    id: row.id,
    kmInicial: row.kmInicial,
    kmFinal: row.kmFinal,
    valor: row.valor,
    itinerario: row.itinerario,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapPerfilTarifaRow(
  row: PerfilTarifaRow,
  faixasKm: FaixaKmRecord[] = [],
): PerfilTarifaRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    idRavex: row.idRavex,
    nome: row.nome,
    descricao: row.descricao,
    peso: row.peso,
    cubagem: row.cubagem,
    tipoCarga: row.tipoCarga,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    faixasKm,
  };
}

export function toPerfilTarifaInsertValues(data: CreatePerfilTarifaInput) {
  return {
    unidadeId: data.unidadeId,
    idRavex: data.idRavex,
    nome: data.nome.trim(),
    descricao: data.descricao?.trim() ?? null,
    peso: data.peso.toFixed(2),
    cubagem:
      data.cubagem !== undefined && data.cubagem !== null
        ? data.cubagem.toFixed(2)
        : null,
    tipoCarga: data.tipoCarga,
  };
}

export function toPerfilTarifaUpdateValues(data: UpdatePerfilTarifaInput) {
  const values: Partial<typeof perfisTarifas.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.nome !== undefined) {
    values.nome = data.nome.trim();
  }

  if (data.descricao !== undefined) {
    values.descricao = data.descricao?.trim() ?? null;
  }

  if (data.peso !== undefined) {
    values.peso = data.peso.toFixed(2);
  }

  if (data.cubagem !== undefined) {
    values.cubagem =
      data.cubagem !== null ? data.cubagem.toFixed(2) : null;
  }

  if (data.tipoCarga !== undefined) {
    values.tipoCarga = data.tipoCarga;
  }

  return values;
}
