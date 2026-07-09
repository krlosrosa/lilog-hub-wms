import { db } from '@/lib/offline/db';

import type { ConferenciaConferidoDetalheApi } from '../types/recebimento.api';
import type { LoteConferido, QuantidadeModo } from '../types/recebimento.schema';
import { toBaseUnits } from './resolve-recebimento-divergencia';

export type RecebimentoConferenciaRascunhoEntry = {  demandId: string;
  sku: string;
  produtoId: string;
  lotes: LoteConferido[];
  updatedAt: number;
};

function formatValidadeForForm(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function splitQuantidadeRecebidaParaConferenciaForm(input: {
  quantidadeRecebida: number;
  unidadeMedida?: string | null;
  quantidadeModo: QuantidadeModo;
  unidadesPorCaixa: number;
}): Pick<LoteConferido, 'recebidaCaixa' | 'recebidaUnidade'> {
  const baseUnits = toBaseUnits(
    input.quantidadeRecebida,
    input.unidadeMedida ?? 'UN',
    input.unidadesPorCaixa,
  );
  const factor = Math.max(input.unidadesPorCaixa, 1);

  if (input.quantidadeModo === 'caixa') {
    return {
      recebidaCaixa: Math.floor(baseUnits / factor),
      recebidaUnidade: 0,
    };
  }

  if (input.quantidadeModo === 'unidade') {
    return {
      recebidaCaixa: 0,
      recebidaUnidade: baseUnits,
    };
  }

  return {
    recebidaCaixa: Math.floor(baseUnits / factor),
    recebidaUnidade: baseUnits % factor,
  };
}

export function buildLotesFromConferidosApi(
  rows: ConferenciaConferidoDetalheApi[],
  quantidadeModo: QuantidadeModo,
  unidadesPorCaixa: number,
): LoteConferido[] {
  return rows.map((row) => {
    const { recebidaCaixa, recebidaUnidade } =
      splitQuantidadeRecebidaParaConferenciaForm({
        quantidadeRecebida: row.quantidadeRecebida,
        unidadeMedida: row.unidadeMedida,
        quantidadeModo,
        unidadesPorCaixa,
      });

    return {      id: row.pesagemId ? `lote-saved-${row.pesagemId}` : `lote-saved-${row.id}`,
      itemRecebimentoId: row.recebimentoItemId ?? row.id,
      lote: row.loteRecebido ?? '',
      validade: formatValidadeForForm(row.validade),
      idPalete: row.unitizadorCodigo ?? '',
      unitizadorId: row.unitizadorId ?? undefined,
      recebidaCaixa,
      recebidaUnidade,
      peso: row.pesoRecebido ?? undefined,
      etiquetaCodigo: row.etiquetaCodigo ?? undefined,
      pesagemId: row.pesagemId ?? undefined,
    };
  });
}

export async function getRecebimentoConferenciaRascunho(
  demandId: string,
  sku: string,
): Promise<RecebimentoConferenciaRascunhoEntry | undefined> {
  return db.recebimentoConferenciaRascunho.get([
    demandId,
    sku.trim().toLowerCase(),
  ]);
}

export async function listRecebimentoConferenciaRascunhos(
  demandId: string,
): Promise<RecebimentoConferenciaRascunhoEntry[]> {
  return db.recebimentoConferenciaRascunho
    .where('demandId')
    .equals(demandId)
    .toArray();
}

export async function saveRecebimentoConferenciaRascunho(input: {
  demandId: string;
  sku: string;
  produtoId: string;
  lotes: LoteConferido[];
}): Promise<void> {
  await db.recebimentoConferenciaRascunho.put({
    demandId: input.demandId,
    sku: input.sku.trim().toLowerCase(),
    produtoId: input.produtoId,
    lotes: input.lotes,
    updatedAt: Date.now(),
  });
}

export async function deleteRecebimentoConferenciaRascunho(
  demandId: string,
  sku: string,
): Promise<void> {
  await db.recebimentoConferenciaRascunho.delete([
    demandId,
    sku.trim().toLowerCase(),
  ]);
}

export type ConferidoTotais = {
  caixa: number;
  unidade: number;
  hasConferencia: boolean;
};

export function sumLotesConferidosTotais(lotes: LoteConferido[]): ConferidoTotais {
  if (!lotes.length) {
    return { caixa: 0, unidade: 0, hasConferencia: false };
  }

  const totals = lotes.reduce(
    (acc, lote) => ({
      caixa: acc.caixa + lote.recebidaCaixa,
      unidade: acc.unidade + lote.recebidaUnidade,
    }),
    { caixa: 0, unidade: 0 },
  );

  return { ...totals, hasConferencia: true };
}

export function resolveItemRecebimentoId(lote: LoteConferido): string | null {
  if (lote.itemRecebimentoId) {
    return lote.itemRecebimentoId;
  }

  if (lote.id.startsWith('lote-saved-')) {
    return lote.id.slice('lote-saved-'.length);
  }

  return null;
}

export function isPersistedLote(lote: LoteConferido): boolean {
  return resolveItemRecebimentoId(lote) !== null;
}
