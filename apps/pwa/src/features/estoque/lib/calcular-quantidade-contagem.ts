export function calcularQuantidadeContadaUnidades(
  quantidadeCaixas: number,
  quantidadeUnidades: number,
  unidadesPorCaixa?: number | null,
): number {
  const fator =
    unidadesPorCaixa != null && unidadesPorCaixa > 0 ? unidadesPorCaixa : 1;
  return quantidadeUnidades + quantidadeCaixas * fator;
}

export function quantidadeContadaDivergeDoEsperado(
  quantidadeCaixas: number,
  quantidadeUnidades: number,
  quantidadeEsperada: number,
  unidadesPorCaixa?: number | null,
): boolean {
  const totalContado = calcularQuantidadeContadaUnidades(
    quantidadeCaixas,
    quantidadeUnidades,
    unidadesPorCaixa,
  );
  if (totalContado <= 0) {
    return false;
  }
  return totalContado !== Math.round(quantidadeEsperada);
}
