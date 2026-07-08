import { toBaseUnits } from './unidade-medida.js';

export type ResumoConferidoProduto = {
  produtoId: string;
  qtdContabil: number;
  qtdFisica: number;
  pesoTotal: number | null;
  hasDivergencia: boolean;
};

type ItemEsperadoResumo = {
  produtoId: string;
  quantidadeEsperada: number;
  unidadeMedida: string;
  unidadesPorCaixa: number;
};

type ItemConferidoResumo = {
  produtoId: string;
  quantidadeRecebida: number;
  unidadeMedida: string;
  pesoRecebido?: number | null;
};

export function buildResumoConferidoPorProduto(input: {
  esperados: ItemEsperadoResumo[];
  conferidos: ItemConferidoResumo[];
}): ResumoConferidoProduto[] {
  const conferidosPorProduto = new Map<string, ItemConferidoResumo[]>();

  for (const row of input.conferidos) {
    const list = conferidosPorProduto.get(row.produtoId) ?? [];
    list.push(row);
    conferidosPorProduto.set(row.produtoId, list);
  }

  const result: ResumoConferidoProduto[] = [];

  for (const esperado of input.esperados) {
    const rows = conferidosPorProduto.get(esperado.produtoId);
    if (!rows?.length) {
      continue;
    }

    const qtdContabil = toBaseUnits(
      esperado.quantidadeEsperada,
      esperado.unidadeMedida,
      esperado.unidadesPorCaixa,
    );
    const qtdFisica = rows.reduce(
      (acc, row) =>
        acc +
        toBaseUnits(
          row.quantidadeRecebida,
          row.unidadeMedida,
          esperado.unidadesPorCaixa,
        ),
      0,
    );

    const pesos = rows
      .map((row) => row.pesoRecebido)
      .filter((peso): peso is number => peso !== null && peso !== undefined);

    const pesoTotal =
      pesos.length > 0
        ? pesos.reduce((acc, peso) => acc + peso, 0)
        : null;

    result.push({
      produtoId: esperado.produtoId,
      qtdContabil,
      qtdFisica,
      pesoTotal,
      hasDivergencia: qtdFisica !== qtdContabil,
    });
  }

  return result;
}
