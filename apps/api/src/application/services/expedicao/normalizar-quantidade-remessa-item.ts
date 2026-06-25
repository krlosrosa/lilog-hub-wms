import type { ProdutoRecord } from '../../../domain/repositories/produto/produto.repository.js';

export const UNIDADES_CAIXA = new Set(['SC', 'FRD', 'FD', 'CX', 'BD']);

export function isUnidadeCaixa(unidadeMedida: string): boolean {
  return UNIDADES_CAIXA.has(unidadeMedida.trim().toUpperCase());
}

export function normalizarQuantidadeRemessaItem(
  quantidade: number,
  unidadeMedida: string,
  produto: ProdutoRecord | null,
): number {
  const um = unidadeMedida.trim().toUpperCase();

  if (!isUnidadeCaixa(um)) {
    return quantidade;
  }

  if (!produto?.unidadesPorCaixa) {
    throw new Error(
      `SKU "${produto?.sku ?? 'desconhecido'}" requer unidadesPorCaixa para conversão de ${um}`,
    );
  }

  return Math.round(quantidade * produto.unidadesPorCaixa * 1000) / 1000;
}
