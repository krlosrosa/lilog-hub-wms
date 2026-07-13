// ---------------------------------------------------------------------------
// Divergência types and helpers
// ---------------------------------------------------------------------------

export interface DiferencaQuantidade {
  esperado: number;
  realizado: number;
  diferenca: number;
  percentual: number;
}

export interface DivergenciaItem {
  produtoId: string;
  sku: string;
  descricao: string;
  tipo: 'excesso' | 'falta' | 'correto';
  diferenca: number;
}

/**
 * Calculates the quantity difference between expected and realized amounts.
 * A positive diferenca means excess; negative means shortage.
 */
export function calcularDiferencaQuantidade(
  esperado: number,
  realizado: number,
): DiferencaQuantidade {
  const diferenca = realizado - esperado;
  const percentual = esperado === 0 ? 0 : (diferenca / esperado) * 100;
  return { esperado, realizado, diferenca, percentual };
}

/**
 * Returns true when there is a non-zero quantity divergence.
 */
export function temDivergencia(esperado: number, realizado: number): boolean {
  return esperado !== realizado;
}
