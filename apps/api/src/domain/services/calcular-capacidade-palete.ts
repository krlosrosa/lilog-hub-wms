import type { Produto } from '../model/produto/produto.model.js';

export function calcularCapacidadePaleteUN(produto: Pick<
  Produto,
  'caixasPorPalete' | 'unidadesPorCaixa'
> | null): number {
  const caixasPorPalete = produto?.caixasPorPalete ?? 1;
  const unidadesPorCaixa = produto?.unidadesPorCaixa ?? 1;

  return Math.max(1, caixasPorPalete * unidadesPorCaixa);
}

export function calcularQtdPaletesSugerida(
  quantidadeTotalUN: number,
  capacidadePorPaleteUN: number,
): number {
  if (quantidadeTotalUN <= 0) {
    return 0;
  }

  return Math.max(
    1,
    Math.ceil(quantidadeTotalUN / Math.max(1, capacidadePorPaleteUN)),
  );
}
