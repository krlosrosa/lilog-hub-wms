import type { BreakdownQuantidade } from './calcular-breakdown-quantidade.js';
import { calcularBreakdownQuantidade } from './calcular-breakdown-quantidade.js';

export function calcularBreakdownConferencia(
  quantidadeNormalizadaUnidades: number,
  unidadesPorCaixa: number | null,
  pesoBrutoUnidade: string | null,
  pesoBrutoCaixa: string | null,
  pesoLiquidoUnidade: string | null = null,
  pesoLiquidoCaixa: string | null = null,
): BreakdownQuantidade | null {
  const breakdown = calcularBreakdownQuantidade(
    quantidadeNormalizadaUnidades,
    unidadesPorCaixa,
    null,
    pesoBrutoUnidade,
    pesoBrutoCaixa,
    null,
    pesoLiquidoUnidade,
    pesoLiquidoCaixa,
    null,
  );

  if (!breakdown) {
    return null;
  }

  const totalCaixas =
    unidadesPorCaixa && unidadesPorCaixa > 0
      ? Math.floor(Math.floor(quantidadeNormalizadaUnidades) / unidadesPorCaixa)
      : 0;
  const unidades =
    unidadesPorCaixa && unidadesPorCaixa > 0
      ? Math.floor(quantidadeNormalizadaUnidades) % unidadesPorCaixa
      : Math.floor(quantidadeNormalizadaUnidades);

  return {
    paletes: 0,
    caixas: totalCaixas,
    unidades,
    pesoPaletes: null,
    pesoCaixas: breakdown.pesoCaixas,
    pesoUnidades: breakdown.pesoUnidades,
  };
}
