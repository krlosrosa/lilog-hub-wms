import type {
  CncItemRecord,
  CncRecord,
  CreateCncInput,
  UpdateCncSituacaoInput,
} from '../../../domain/repositories/cnc/cnc.repository.js';
import type {
  cncItens,
  naoConformidades,
} from '../providers/drizzle/config/migrations/schema.js';

type CncRow = typeof naoConformidades.$inferSelect;
type CncItemRow = typeof cncItens.$inferSelect;

function toNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

export function mapCncRow(row: CncRow): CncRecord {
  return {
    id: row.id,
    numero: row.numero,
    origem: row.origem,
    origemId: row.origemId,
    unidadeId: row.unidadeId,
    responsavel: row.responsavel,
    responsavelId: row.responsavelId,
    descricao: row.descricao,
    acaoImediata: row.acaoImediata,
    acaoCorretiva: row.acaoCorretiva,
    situacao: row.situacao,
    solicitanteId: row.solicitanteId,
    aprovadorId: row.aprovadorId,
    dataAprovacao: row.dataAprovacao,
    observacaoAprovador: row.observacaoAprovador,
    valorDebito: toNumber(row.valorDebito),
    debitoConfirmado: row.debitoConfirmado,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapCncItemRow(row: CncItemRow): CncItemRecord {
  return {
    id: row.id,
    cncId: row.cncId,
    tipo: row.tipo,
    referenciaId: row.referenciaId,
    createdAt: row.createdAt,
  };
}

export function toCncInsertValues(data: CreateCncInput) {
  return {
    numero: data.numero,
    origem: data.origem as CncRow['origem'],
    origemId: data.origemId,
    unidadeId: data.unidadeId,
    responsavel: data.responsavel as CncRow['responsavel'],
    responsavelId: data.responsavelId ?? null,
    descricao: data.descricao ?? null,
    situacao: 'pendente' as CncRow['situacao'],
    solicitanteId: data.solicitanteId,
  };
}

export function toCncItemInsertValues(
  cncId: string,
  item: CreateCncInput['itens'][number],
) {
  return {
    cncId,
    tipo: item.tipo as CncItemRow['tipo'],
    referenciaId: item.referenciaId,
  };
}

export function toCncSituacaoUpdateValues(data: UpdateCncSituacaoInput) {
  const values: Partial<typeof naoConformidades.$inferInsert> = {
    situacao: data.situacao as CncRow['situacao'],
    updatedAt: new Date(),
  };

  if (data.aprovadorId !== undefined) {
    values.aprovadorId = data.aprovadorId;
  }

  if (data.dataAprovacao !== undefined) {
    values.dataAprovacao = data.dataAprovacao;
  }

  if (data.observacaoAprovador !== undefined) {
    values.observacaoAprovador = data.observacaoAprovador;
  }

  if (data.responsavel !== undefined) {
    values.responsavel = data.responsavel as CncRow['responsavel'];
  }

  if (data.responsavelId !== undefined) {
    values.responsavelId = data.responsavelId;
  }

  if (data.valorDebito !== undefined) {
    values.valorDebito =
      data.valorDebito !== null ? String(data.valorDebito) : null;
  }

  if (data.debitoConfirmado !== undefined) {
    values.debitoConfirmado = data.debitoConfirmado;
  }

  return values;
}
