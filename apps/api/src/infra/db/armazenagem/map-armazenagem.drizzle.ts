import type {
  DemandaArmazenagemRecord,
  ItemArmazenagemRecord,
  UnitizadorRecord,
} from '../../../domain/repositories/armazenagem/armazenagem.repository.js';
import type {
  demandasArmazenagem,
  itensArmazenagem,
  unitizadores,
} from '../providers/drizzle/config/migrations/schema.js';

type UnitizadorRow = typeof unitizadores.$inferSelect;
type DemandaRow = typeof demandasArmazenagem.$inferSelect;
type ItemRow = typeof itensArmazenagem.$inferSelect;

function toNumber(value: string): number {
  return Number(value);
}

export function mapUnitizadorRow(row: UnitizadorRow): UnitizadorRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    codigo: row.codigo,
    tipo: row.tipo,
    origem: row.origem,
    status: row.status,
    recebimentoId: row.recebimentoId,
    enderecoAtualId: row.enderecoAtualId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapDemandaArmazenagemRow(
  row: DemandaRow,
): DemandaArmazenagemRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    recebimentoId: row.recebimentoId,
    modoUnitizacao: row.modoUnitizacao,
    status: row.status,
    responsavelId: row.responsavelId,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export type ItemArmazenagemEnrichment = {
  produtoSku?: string | null;
  produtoNome?: string | null;
  enderecoSugeridoLabel?: string | null;
};

export function mapItemArmazenagemRow(
  row: ItemRow,
  enrichment?: ItemArmazenagemEnrichment,
): ItemArmazenagemRecord {
  return {
    id: row.id,
    demandaId: row.demandaId,
    unitizadorId: row.unitizadorId,
    produtoId: row.produtoId,
    quantidade: toNumber(row.quantidade),
    unidadeMedida: row.unidadeMedida,
    lote: row.lote,
    validade: row.validade,
    numeroSerie: row.numeroSerie,
    enderecoSugeridoId: row.enderecoSugeridoId,
    enderecoConfirmadoId: row.enderecoConfirmadoId,
    status: row.status,
    produtoSku: enrichment?.produtoSku ?? null,
    produtoNome: enrichment?.produtoNome ?? null,
    enderecoSugeridoLabel: enrichment?.enderecoSugeridoLabel ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
