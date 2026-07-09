import { eq } from 'drizzle-orm';

import type { PreRecebimentoDetalheRecord } from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  vwPreRecebimentoDetalhe,
  type VwPreRecebimentoDetalheRow,
} from '../providers/drizzle/config/migrations/schema.js';

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

export type { PreRecebimentoDetalheRecord };

function mapChecklist(
  row: VwPreRecebimentoDetalheRow,
): PreRecebimentoDetalheRecord['checklist'] {
  if (!row.checklistId || !row.recebimentoId) {
    return null;
  }

  const conditions = row.conditions ?? {};

  return {
    id: row.checklistId,
    recebimentoId: row.recebimentoId,
    lacre: row.lacre,
    tempBau: toNumber(row.tempBau),
    tempProduto: toNumber(row.tempProduto),
    conditions: {
      limpeza: Boolean(conditions.limpeza ?? row.condicaoLimpeza),
      odor: Boolean(conditions.odor ?? row.condicaoOdor),
      estrutura: Boolean(conditions.estrutura ?? row.condicaoEstrutura),
      vedacao: Boolean(conditions.vedacao ?? row.condicaoVedacao),
    },
    observacoes: row.checklistObservacoes,
    photoCount: row.checklistPhotoCount ?? 0,
    createdAt: toIso(row.checklistCreatedAt) ?? new Date(0).toISOString(),
  };
}

function mapRecebimento(
  row: VwPreRecebimentoDetalheRow,
): PreRecebimentoDetalheRecord['recebimento'] {
  if (!row.recebimentoId || row.responsavelId == null || !row.recebimentoDataInicio) {
    return null;
  }

  return {
    id: row.recebimentoId,
    preRecebimentoId: row.preRecebimentoId,
    docaId: row.recebimentoDocaId,
    responsavelId: row.responsavelId,
    dataInicio: toIso(row.recebimentoDataInicio)!,
    dataFim: toIso(row.dataFim),
    situacao: row.recebimentoSituacao ?? 'em_conferencia',
    modoUnitizacao:
      row.modoUnitizacao ?? 'gerar_etiqueta_na_armazenagem',
    createdAt: toIso(row.recebimentoCreatedAt) ?? toIso(row.recebimentoDataInicio)!,
    updatedAt: toIso(row.recebimentoUpdatedAt) ?? toIso(row.recebimentoDataInicio)!,
    itens: asArray(row.itensRecebidos),
    divergencias: asArray(row.divergencias),
  };
}

export function mapPreRecebimentoDetalheRow(
  row: VwPreRecebimentoDetalheRow,
): PreRecebimentoDetalheRecord {
  return {
    preRecebimento: {
      id: row.preRecebimentoId,
      unidadeId: row.unidadeId,
      transportadoraNome: row.transportadoraNome,
      placa: row.placa,
      motoristaNome: row.motoristaNome,
      motoristaTelefone: row.motoristaTelefone,
      grauPrioridade: row.grauPrioridade,
      numeroOcr: row.numeroOcr,
      numeroTransporte: row.numeroTransporte,
      origemDados: row.origemDados,
      horarioPrevisto: toIso(row.horarioPrevisto)!,
      observacao: row.observacao,
      situacao: row.preRecebimentoSituacao,
      dataChegada: toIso(row.dataChegada),
      docaId: row.preRecebimentoDocaId,
      createdAt: toIso(row.preRecebimentoCreatedAt)!,
      updatedAt: toIso(row.preRecebimentoUpdatedAt)!,
      itens: asArray(row.itensEsperados),
    },
    recebimento: mapRecebimento(row),
    checklist: mapChecklist(row),
    avarias: asArray(row.avarias).map((avaria) => ({
      ...avaria,
      createdAt: toIso(avaria.createdAt) ?? avaria.createdAt,
    })),
    produtos: asArray(row.produtos),
    numDivergencias: row.numDivergencias ?? 0,
  };
}

export async function findPreRecebimentoDetalheDb(
  db: DrizzleClient,
  id: string,
): Promise<PreRecebimentoDetalheRecord | null> {
  const [row] = await db
    .select()
    .from(vwPreRecebimentoDetalhe)
    .where(eq(vwPreRecebimentoDetalhe.preRecebimentoId, id))
    .limit(1);

  if (!row) {
    return null;
  }

  return mapPreRecebimentoDetalheRow(row);
}
