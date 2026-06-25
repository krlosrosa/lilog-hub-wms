import type {
  ConferirItemInput,
  CreatePreRecebimentoInput,
  IniciarRecebimentoInput,
  UpdatePreRecebimentoInput,
} from '../../../domain/model/recebimento/recebimento.model.js';
import type {
  ItemPreRecebimentoRecord,
  PreRecebimentoRecord,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import type {
  CreateDivergenciaInput,
  DivergenciaRecebimentoRecord,
  ItemRecebimentoRecord,
  RecebimentoRecord,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import type {
  divergenciasRecebimento,
  itensPreRecebimento,
  itensRecebimento,
  preRecebimentos,
  recebimentos,
} from '../providers/drizzle/config/migrations/schema.js';

type PreRecebimentoRow = typeof preRecebimentos.$inferSelect;
type ItemPreRecebimentoRow = typeof itensPreRecebimento.$inferSelect;
type RecebimentoRow = typeof recebimentos.$inferSelect;
type ItemRecebimentoRow = typeof itensRecebimento.$inferSelect;
type DivergenciaRow = typeof divergenciasRecebimento.$inferSelect;

function toNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

export function mapPreRecebimentoRow(row: PreRecebimentoRow): PreRecebimentoRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    transportadoraId: row.transportadoraId,
    placa: row.placa,
    horarioPrevisto: row.horarioPrevisto,
    observacao: row.observacao,
    situacao: row.situacao,
    dataChegada: row.dataChegada,
    userId: row.userId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapItemPreRecebimentoRow(
  row: ItemPreRecebimentoRow,
  unidadesPorCaixa = 1,
): ItemPreRecebimentoRecord {
  return {
    id: row.id,
    preRecebimentoId: row.preRecebimentoId,
    produtoId: row.produtoId,
    quantidadeEsperada: Number(row.quantidadeEsperada),
    unidadeMedida: row.unidadeMedida,
    unidadesPorCaixa,
    loteEsperado: row.loteEsperado,
    pesoEsperado: toNumber(row.pesoEsperado),
    validadeEsperada: row.validadeEsperada,
    createdAt: row.createdAt,
  };
}

export function mapRecebimentoRow(row: RecebimentoRow): RecebimentoRecord {
  return {
    id: row.id,
    preRecebimentoId: row.preRecebimentoId,
    docaId: row.docaId,
    responsavelId: row.responsavelId,
    dataInicio: row.dataInicio,
    dataFim: row.dataFim,
    situacao: row.situacao,
    modoUnitizacao: row.modoUnitizacao,
    userId: row.userId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapItemRecebimentoRow(
  row: ItemRecebimentoRow,
): ItemRecebimentoRecord {
  return {
    id: row.id,
    recebimentoId: row.recebimentoId,
    produtoId: row.produtoId,
    quantidadeRecebida: Number(row.quantidadeRecebida),
    unidadeMedida: row.unidadeMedida,
    loteRecebido: row.loteRecebido,
    pesoRecebido: toNumber(row.pesoRecebido),
    validade: row.validade,
    numeroSerie: row.numeroSerie,
    unitizadorId: row.unitizadorId,
    createdAt: row.createdAt,
  };
}

export function mapDivergenciaRow(
  row: DivergenciaRow,
): DivergenciaRecebimentoRecord {
  return {
    id: row.id,
    recebimentoId: row.recebimentoId,
    produtoId: row.produtoId,
    tipoDivergencia: row.tipoDivergencia,
    quantidadeEsperada: toNumber(row.quantidadeEsperada),
    quantidadeRecebida: toNumber(row.quantidadeRecebida),
    descricao: row.descricao,
    createdAt: row.createdAt,
  };
}

export function toPreRecebimentoInsertValues(
  data: CreatePreRecebimentoInput,
  userId: number | null,
) {
  return {
    unidadeId: data.unidadeId,
    transportadoraId: data.transportadoraId,
    placa: data.placa.trim().toUpperCase(),
    horarioPrevisto: data.horarioPrevisto,
    observacao: data.observacao ?? null,
    situacao: 'agendado' as PreRecebimentoRow['situacao'],
    userId,
  };
}

export function toItemPreRecebimentoInsertValues(
  preRecebimentoId: string,
  item: CreatePreRecebimentoInput['itens'][number],
) {
  return {
    preRecebimentoId,
    produtoId: item.produtoId,
    quantidadeEsperada: String(item.quantidadeEsperada),
    unidadeMedida: item.unidadeMedida,
    loteEsperado: item.loteEsperado ?? null,
    pesoEsperado:
      item.pesoEsperado !== undefined ? String(item.pesoEsperado) : null,
    validadeEsperada: item.validadeEsperada ?? null,
  };
}

export function toPreRecebimentoUpdateValues(data: UpdatePreRecebimentoInput) {
  const values: Partial<typeof preRecebimentos.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.transportadoraId !== undefined) {
    values.transportadoraId = data.transportadoraId;
  }

  if (data.placa !== undefined) {
    values.placa = data.placa.trim().toUpperCase();
  }

  if (data.horarioPrevisto !== undefined) {
    values.horarioPrevisto = data.horarioPrevisto;
  }

  if (data.observacao !== undefined) {
    values.observacao = data.observacao;
  }

  return values;
}

export function toRecebimentoInsertValues(
  data: IniciarRecebimentoInput,
  userId: number | null,
  modoUnitizacao: string,
) {
  return {
    preRecebimentoId: data.preRecebimentoId,
    docaId: data.docaId ?? null,
    responsavelId: data.responsavelId,
    dataInicio: new Date(),
    situacao: 'em_recebimento' as RecebimentoRow['situacao'],
    modoUnitizacao,
    userId,
  };
}

export function toItemRecebimentoInsertValues(
  recebimentoId: string,
  data: ConferirItemInput,
  unitizadorId?: string | null,
) {
  return {
    recebimentoId,
    produtoId: data.produtoId,
    quantidadeRecebida: String(data.quantidadeRecebida),
    unidadeMedida: data.unidadeMedida,
    loteRecebido: data.loteRecebido ?? null,
    pesoRecebido:
      data.pesoRecebido !== undefined ? String(data.pesoRecebido) : null,
    validade: data.validade ?? null,
    numeroSerie: data.numeroSerie ?? null,
    unitizadorId: unitizadorId ?? null,
  };
}

export function toDivergenciaInsertValues(data: CreateDivergenciaInput) {
  return {
    recebimentoId: data.recebimentoId,
    produtoId: data.produtoId ?? null,
    tipoDivergencia: data.tipoDivergencia as DivergenciaRow['tipoDivergencia'],
    quantidadeEsperada:
      data.quantidadeEsperada !== undefined && data.quantidadeEsperada !== null
        ? String(data.quantidadeEsperada)
        : null,
    quantidadeRecebida:
      data.quantidadeRecebida !== undefined && data.quantidadeRecebida !== null
        ? String(data.quantidadeRecebida)
        : null,
    descricao: data.descricao ?? null,
  };
}
