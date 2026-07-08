import {
  getConferenciaSnapshot,
  peekConferenciaNavigation,
} from './conferencia-conferidos-store';
import { getConferenciaContextStore } from './conferencia-context-store';
import {
  buildLotesFromConferidosApi,
  sumLotesConferidosTotais,
  type ConferidoTotais,
} from './recebimento-conferencia-rascunho';
import type { LoteConferido, QuantidadeModo } from '../types/recebimento.schema';

function matchesSku(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function totalsFromSnapshot(
  recebidaCaixa: string | undefined,
  recebidaUnidade: string | undefined,
): ConferidoTotais {
  const caixa = Number(recebidaCaixa || 0);
  const unidade = Number(recebidaUnidade || 0);

  if (caixa <= 0 && unidade <= 0) {
    return { caixa: 0, unidade: 0, hasConferencia: false };
  }

  return { caixa, unidade, hasConferencia: true };
}

export function resolveConferidoTotaisForSkuRecebimento(input: {
  demandId: string;
  sku: string;
  quantidadeModo: QuantidadeModo;
  rascunhoLotes?: LoteConferido[];
}): ConferidoTotais {
  const normalizedSku = input.sku.trim();
  if (!normalizedSku) {
    return { caixa: 0, unidade: 0, hasConferencia: false };
  }

  const navigation = peekConferenciaNavigation(input.demandId);
  if (
    navigation?.lotes?.length &&
    matchesSku(navigation.form.sku, normalizedSku)
  ) {
    return sumLotesConferidosTotais(navigation.lotes);
  }

  if (input.rascunhoLotes?.length) {
    return sumLotesConferidosTotais(input.rascunhoLotes);
  }

  const snapshot = getConferenciaSnapshot(input.demandId, normalizedSku);
  if (snapshot) {
    const fromSnapshot = totalsFromSnapshot(
      snapshot.recebidaCaixa,
      snapshot.recebidaUnidade,
    );
    if (fromSnapshot.hasConferencia) {
      return fromSnapshot;
    }
  }

  const context = getConferenciaContextStore(input.demandId);
  const meta = context?.itemMetaBySku[normalizedSku.toLowerCase()];
  const conferidos = meta
    ? context?.conferidosDetalheByProdutoId?.[meta.produtoId]
    : undefined;

  if (conferidos?.length && meta) {
    const lotes = buildLotesFromConferidosApi(
      conferidos,
      input.quantidadeModo,
      meta.unidadesPorCaixa,
    );
    return sumLotesConferidosTotais(lotes);
  }

  return { caixa: 0, unidade: 0, hasConferencia: false };
}
