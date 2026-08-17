import type { ExpectedItemView } from '@lilog/contracts';

import { toBaseUnits } from '@/features/recebimento/lib/resolve-recebimento-divergencia';
import type { QuantidadeModo } from '@/features/recebimento/types/recebimento.schema';
import { resolveConferidoTotaisForSkuV2 } from '@/features/recebimento-v2/lib/conferencia-quantidade';
import {
  calcConferenceBaseUnitsFromRecord,
  normalizeSkuParam,
  resolveUnidadesPorCaixa,
} from '@/features/recebimento-v2/lib/resolve-produto-conferencia-v2';
import type {
  ConferenceRecord,
  DamageRecord,
} from '@/features/recebimento-v2/local-db/schema';
import type { DivergenciaItem } from '@/features/recebimento-v2/types/recebimento-v2.schema';

function findExpectedBySku(
  expectedItems: ExpectedItemView[],
  sku: string,
): ExpectedItemView | undefined {
  const normalized = normalizeSkuParam(sku).toUpperCase();
  return expectedItems.find(
    (entry) => normalizeSkuParam(entry.sku).toUpperCase() === normalized,
  );
}

export function computeDivergenciasRc(input: {
  expectedItems: ExpectedItemView[];
  conferences: ConferenceRecord[];
  damages?: DamageRecord[];
  quantidadeModo?: QuantidadeModo;
}): DivergenciaItem[] {
  const quantidadeModo = input.quantidadeModo ?? 'ambos';
  const { expectedItems, conferences } = input;

  const avariaSkus = new Set(
    (input.damages ?? [])
      .filter((damage) => !damage.deletedAt)
      .map((damage) => damage.sku)
      .filter((sku): sku is string => Boolean(sku))
      .map((sku) => normalizeSkuParam(sku).toUpperCase()),
  );

  const conferencedBySku = new Map<string, number>();
  for (const conference of conferences) {
    const item = findExpectedBySku(expectedItems, conference.sku);
    const upc = resolveUnidadesPorCaixa(item?.unidadesPorCaixa);
    const baseUnits = calcConferenceBaseUnitsFromRecord(conference, upc, quantidadeModo);
    const skuKey = normalizeSkuParam(conference.sku).toUpperCase();
    conferencedBySku.set(skuKey, (conferencedBySku.get(skuKey) ?? 0) + baseUnits);
  }

  const itemsBySku = new Map(
    expectedItems.map((item) => [normalizeSkuParam(item.sku).toUpperCase(), item]),
  );
  const allSkus = new Set([
    ...expectedItems.map((item) => item.sku),
    ...conferences.map((conference) => conference.sku),
  ]);

  return Array.from(allSkus).map((sku) => {
    const skuKey = normalizeSkuParam(sku).toUpperCase();
    const item = itemsBySku.get(skuKey);
    const conferencedQuantity = conferencedBySku.get(skuKey) ?? 0;
    const unidadesPorCaixa = resolveUnidadesPorCaixa(item?.unidadesPorCaixa);
    const expectedQuantity = item
      ? toBaseUnits(item.quantidadeEsperada, item.unidadeMedida, unidadesPorCaixa)
      : 0;
    const conferidoTotais = resolveConferidoTotaisForSkuV2(
      conferences,
      sku,
      quantidadeModo,
      unidadesPorCaixa,
    );
    const conferidoLabel = conferidoTotais.hasConferencia
      ? [
          quantidadeModo !== 'unidade' && conferidoTotais.caixa > 0
            ? `${conferidoTotais.caixa} cx`
            : null,
          quantidadeModo !== 'caixa' && conferidoTotais.unidade > 0
            ? `${conferidoTotais.unidade} un`
            : null,
        ]
          .filter(Boolean)
          .join(' · ') || `${conferencedQuantity} un`
      : undefined;
    const delta = conferencedQuantity - expectedQuantity;
    let status: DivergenciaItem['status'] = 'ok';
    if (conferencedQuantity === 0) status = 'nao_conferido';
    else if (expectedQuantity === 0 && conferencedQuantity > 0) status = 'sobra';
    else if (delta < 0) status = 'falta';
    else if (delta > 0) status = 'sobra';

    return {
      sku: item?.sku ?? sku,
      description: item?.descricao?.trim() ?? '',
      expectedQuantity,
      conferencedQuantity,
      conferidoCaixa: conferidoTotais.caixa,
      conferidoUnidade: conferidoTotais.unidade,
      conferidoLabel,
      delta,
      status,
      isNovo: item?.isNovo,
      hasAvaria: avariaSkus.has(skuKey),
    };
  });
}
