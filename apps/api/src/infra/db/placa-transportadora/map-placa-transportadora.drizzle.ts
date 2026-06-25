import type { PlacaTransportadoraRecord } from '../../../domain/repositories/placa-transportadora/placa-transportadora.repository.js';
import type { transportadoraPlacas } from '../providers/drizzle/config/migrations/schema.js';

type PlacaTransportadoraRow = typeof transportadoraPlacas.$inferSelect;

export function mapPlacaTransportadoraRow(
  row: PlacaTransportadoraRow,
  perfilTarifaNome: string | null = null,
): PlacaTransportadoraRecord {
  return {
    id: row.id,
    transportadoraId: row.transportadoraId,
    idRavexVeiculo: row.idRavexVeiculo,
    placa: row.placa,
    tipoVeiculoIdRavex: row.tipoVeiculoIdRavex,
    tipoVeiculoNome: row.tipoVeiculoNome,
    peso: row.peso,
    cubagem: row.cubagem,
    tara: row.tara,
    estrangeiro: row.estrangeiro,
    perfilTarifaId: row.perfilTarifaId,
    perfilTarifaNome,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
