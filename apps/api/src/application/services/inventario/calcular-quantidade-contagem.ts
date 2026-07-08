export function calcularQuantidadeContadaUnidades(
  quantidadeCaixas: number,
  quantidadeUnidades: number,
  unidadesPorCaixa: number | null | undefined,
): number {
  const fator = unidadesPorCaixa && unidadesPorCaixa > 0 ? unidadesPorCaixa : 1;
  return quantidadeUnidades + quantidadeCaixas * fator;
}
