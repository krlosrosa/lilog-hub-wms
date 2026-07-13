// ---------------------------------------------------------------------------
// Product configuration for conference
// ---------------------------------------------------------------------------

export interface ProdutoConferenciaConfig {
  produtoId: string;
  sku: string;
  descricao: string;
  empresa: string;
  categoria: string;
  tipo: string;
  ean: string;
  dum: string;
  shelfLife: number;
  pesoBrutoUnidade: number;
  pesoBrutoCaixa: number;
  pesoBrutoPalete: number;
  pesoLiquidoUnidade: number;
  pesoLiquidoCaixa: number;
  pesoLiquidoPalete: number;
  unidadesPorCaixa: number;
  caixasPorPalete: number;
}

export interface ProdutoCaixaUnidadeConfig {
  unidadesPorCaixa?: number;
  caixasPorPalete?: number;
}

/**
 * Returns true when the product requires variable-weight (PVAR) handling.
 * PVAR products have non-integer or non-standard unit weights.
 */
export function isPVAR(produto: Pick<ProdutoConferenciaConfig, 'tipo'>): boolean {
  return produto.tipo === 'PVAR';
}

/**
 * Returns true when the product requires shelf-life (validade) registration.
 * A shelfLife of 0 means the product does not expire.
 */
export function exigeValidade(
  produto: Pick<ProdutoConferenciaConfig, 'shelfLife'>,
): boolean {
  return produto.shelfLife > 0;
}

/**
 * Returns true when the product requires lot (lote) registration.
 * Currently all non-PVAR products require lot tracking.
 */
export function exigeLote(
  produto: Pick<ProdutoConferenciaConfig, 'tipo'>,
): boolean {
  return !isPVAR(produto);
}

/**
 * Calculates total units given a quantity in caixas (boxes).
 */
export function calcularUnidadesEmCaixas(
  qtdCaixas: number,
  config: ProdutoCaixaUnidadeConfig,
): number {
  const unidadesPorCaixa = config.unidadesPorCaixa ?? 0;
  return qtdCaixas * unidadesPorCaixa;
}

/**
 * Calculates total caixas (boxes) given a quantity in units.
 * Returns 0 if unidadesPorCaixa is not configured or is zero.
 */
export function calcularCaixasEmUnidades(
  qtdUnidades: number,
  config: ProdutoCaixaUnidadeConfig,
): number {
  const unidadesPorCaixa = config.unidadesPorCaixa;
  if (!unidadesPorCaixa || unidadesPorCaixa === 0) {
    return 0;
  }
  return qtdUnidades / unidadesPorCaixa;
}
