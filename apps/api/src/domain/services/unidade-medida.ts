export function toBaseUnits(
  quantidade: number,
  unidadeMedida: string,
  unidadesPorCaixa: number,
): number {
  return unidadeMedida === 'CX' ? quantidade * unidadesPorCaixa : quantidade;
}

export function buildUnidadesPorCaixaMap(
  itens: Array<{ produtoId: string; unidadesPorCaixa: number }>,
): Map<string, number> {
  return new Map(
    itens.map((item) => [item.produtoId, item.unidadesPorCaixa]),
  );
}
