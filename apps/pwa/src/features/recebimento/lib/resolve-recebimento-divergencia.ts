import type { ConferenciaConferidoDetalheApi } from '../types/recebimento.api';
import type { LoteConferido, SkuItem } from '../types/recebimento.schema';

export type ResumoConferidoProduto = {
  produtoId: string;
  qtdContabil: number;
  qtdFisica: number;
  hasDivergencia: boolean;
};

export function toBaseUnits(
  quantidade: number,
  unidadeMedida: string,
  unidadesPorCaixa: number,
): number {
  return unidadeMedida === 'CX' ? quantidade * unidadesPorCaixa : quantidade;
}

export function resolveQtdFisicaFromLotes(
  lotes: LoteConferido[],
  unidadesPorCaixa: number,
): number {
  return lotes.reduce(
    (acc, lote) =>
      acc + lote.recebidaCaixa * unidadesPorCaixa + lote.recebidaUnidade,
    0,
  );
}

export function resolveQtdFisicaFromConferidos(
  conferidos: ConferenciaConferidoDetalheApi[],
  unidadesPorCaixa: number,
): number {
  return conferidos.reduce(
    (acc, row) =>
      acc +
      toBaseUnits(row.quantidadeRecebida, row.unidadeMedida, unidadesPorCaixa),
    0,
  );
}

export function applyResumoToSkuItems(
  itens: SkuItem[],
  itemMetaBySku: Record<string, { produtoId: string }>,
  resumoConferido: ResumoConferidoProduto[] = [],
): SkuItem[] {
  const resumoByProdutoId = new Map(
    resumoConferido.map((entry) => [entry.produtoId, entry]),
  );

  return itens.map((item) => {
    const produtoId = itemMetaBySku[item.sku.toLowerCase()]?.produtoId;
    const resumo = produtoId ? resumoByProdutoId.get(produtoId) : undefined;

    if (!resumo) {
      return item;
    }

    return {
      ...item,
      hasDivergencia: resumo.hasDivergencia,
      qtdEsperada: resumo.qtdContabil,
      qtdConferida: resumo.qtdFisica,
      quantidadeEsperada: resumo.qtdContabil,
    };
  });
}

export function removeResumoConferidoLocal(input: {
  resumoConferido: ResumoConferidoProduto[];
  produtoId: string;
}): ResumoConferidoProduto[] {
  return input.resumoConferido.filter(
    (entry) => entry.produtoId !== input.produtoId,
  );
}

export function resolveQtdContabilForProduto(
  context: {
    resumoConferido?: ResumoConferidoProduto[];
    itens: SkuItem[];
  },
  produtoId: string,
  sku: string,
): number | undefined {
  const fromResumo = context.resumoConferido?.find(
    (entry) => entry.produtoId === produtoId,
  )?.qtdContabil;
  if (fromResumo !== undefined) {
    return fromResumo;
  }

  const item = context.itens.find(
    (entry) => entry.sku.toLowerCase() === sku.trim().toLowerCase(),
  );
  return item?.qtdEsperada ?? item?.quantidadeEsperada;
}

export function upsertResumoConferidoLocal(input: {
  resumoConferido: ResumoConferidoProduto[];
  produtoId: string;
  qtdFisica: number;
  qtdContabil?: number;
}): ResumoConferidoProduto[] {
  const next = [...input.resumoConferido];
  const index = next.findIndex((entry) => entry.produtoId === input.produtoId);
  const qtdContabil =
    input.qtdContabil ??
    (index >= 0 ? next[index]?.qtdContabil : undefined);

  if (qtdContabil === undefined) {
    return next;
  }

  const entry: ResumoConferidoProduto = {
    produtoId: input.produtoId,
    qtdContabil,
    qtdFisica: input.qtdFisica,
    hasDivergencia: input.qtdFisica !== qtdContabil,
  };

  if (index >= 0) {
    next[index] = entry;
  } else {
    next.push(entry);
  }

  return next;
}
