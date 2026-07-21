import { splitQuantidadeRecebidaParaConferenciaForm } from '@/features/recebimento/lib/recebimento-conferencia-rascunho';
import type { QuantidadePar } from '@/features/recebimento/lib/avaria-quantidade';
import type { QuantidadeModo } from '@/features/recebimento/types/recebimento.schema';

import type { ConferenceRecord } from '../local-db/schema';
import { normalizeSkuParam, resolveUnidadesPorCaixa, isLegacyCaixaQuantityInQuantityField } from './resolve-produto-conferencia-v2';

function matchesConferenceSku(a: string, b: string): boolean {
  return normalizeSkuParam(a).toUpperCase() === normalizeSkuParam(b).toUpperCase();
}

export function resolveConferenceQuantidadePar(
  record: ConferenceRecord,
  quantidadeModo: QuantidadeModo,
  unidadesPorCaixa: number,
): QuantidadePar {
  if (record.isPvarBox) {
    return { caixa: 1, unidade: 0 };
  }

  const upc = resolveUnidadesPorCaixa(unidadesPorCaixa);
  const hasExplicitCaixa = (record.recebidaCaixa ?? 0) > 0;
  const hasExplicitUnidade = (record.recebidaUnidade ?? 0) > 0;

  if (hasExplicitCaixa || hasExplicitUnidade) {
    return {
      caixa: record.recebidaCaixa ?? 0,
      unidade: record.recebidaUnidade ?? 0,
    };
  }

  if (record.quantity > 0) {
    if (isLegacyCaixaQuantityInQuantityField(record.quantity, upc, quantidadeModo)) {
      return { caixa: record.quantity, unidade: 0 };
    }

    const split = splitQuantidadeRecebidaParaConferenciaForm({
      quantidadeRecebida: record.quantity,
      unidadeMedida: 'UN',
      quantidadeModo,
      unidadesPorCaixa: upc,
    });
    return {
      caixa: split.recebidaCaixa,
      unidade: split.recebidaUnidade,
    };
  }

  return { caixa: 0, unidade: 0 };
}

export function resolveConferidoTotaisForSkuV2(
  conferences: ConferenceRecord[],
  sku: string,
  quantidadeModo: QuantidadeModo = 'ambos',
  unidadesPorCaixa = 1,
): QuantidadePar & { hasConferencia: boolean } {
  const filtered = conferences.filter((conference) =>
    matchesConferenceSku(conference.sku, sku),
  );

  if (filtered.length === 0) {
    return { caixa: 0, unidade: 0, hasConferencia: false };
  }

  const upc = resolveUnidadesPorCaixa(unidadesPorCaixa);

  return filtered.reduce(
    (acc, conference) => {
      const par = resolveConferenceQuantidadePar(conference, quantidadeModo, upc);
      return {
        caixa: acc.caixa + par.caixa,
        unidade: acc.unidade + par.unidade,
        hasConferencia: true,
      };
    },
    { caixa: 0, unidade: 0, hasConferencia: true },
  );
}

export function formatConferenceQuantityLabel(
  record: ConferenceRecord,
  quantidadeModo: QuantidadeModo,
  unidadesPorCaixa = 1,
): string {
  const par = resolveConferenceQuantidadePar(
    record,
    quantidadeModo,
    resolveUnidadesPorCaixa(unidadesPorCaixa),
  );
  const parts: string[] = [];

  if (
    (quantidadeModo === 'caixa' || quantidadeModo === 'ambos') &&
    par.caixa > 0
  ) {
    parts.push(`${par.caixa} cx`);
  }

  if (
    (quantidadeModo === 'unidade' || quantidadeModo === 'ambos') &&
    par.unidade > 0
  ) {
    parts.push(`${par.unidade} un`);
  }

  if (parts.length > 0) {
    return parts.join(' · ');
  }

  if (record.peso != null) {
    return `1 cx · ${record.peso} kg`;
  }

  return `${record.quantity} un`;
}
