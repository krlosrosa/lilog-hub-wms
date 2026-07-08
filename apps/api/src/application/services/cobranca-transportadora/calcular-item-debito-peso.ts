import type { DebitoItemTipo } from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import type { ProdutoRecord } from '../../../domain/repositories/produto/produto.repository.js';
import { resolverPesoPorUnidadeProduto } from '../expedicao/calcular-breakdown-quantidade.js';

export function calcularQtdAnomaliaItemDebito(item: {
  tipo: DebitoItemTipo;
  quantidade: number | null;
  qtdConferida: number | null;
}): number {
  const esperada = item.quantidade ?? 0;
  const conferida =
    item.qtdConferida ?? (item.tipo === 'falta' ? 0 : esperada);
  const diff = Math.abs(conferida - esperada);

  return diff > 0 ? diff : esperada;
}

export function calcularPesoTotalItemDebito(
  qtdAnomalia: number,
  produto: ProdutoRecord | null | undefined,
): number | null {
  if (qtdAnomalia <= 0 || !produto) {
    return null;
  }

  const pesoPorUnidade = resolverPesoPorUnidadeProduto({
    unidadesPorCaixa: produto.unidadesPorCaixa,
    caixasPorPalete: produto.caixasPorPalete,
    pesoBrutoUnidade: produto.pesoBrutoUnidade,
    pesoBrutoCaixa: produto.pesoBrutoCaixa,
    pesoBrutoPalete: produto.pesoBrutoPalete,
    pesoLiquidoUnidade: produto.pesoLiquidoUnidade,
    pesoLiquidoCaixa: produto.pesoLiquidoCaixa,
    pesoLiquidoPalete: produto.pesoLiquidoPalete,
  });

  if (pesoPorUnidade == null) {
    return null;
  }

  return Number((qtdAnomalia * pesoPorUnidade).toFixed(3));
}

export function calcularValorDebitoPorKg(
  valorUnitarioPorKg: number,
  item: {
    tipo: DebitoItemTipo;
    quantidade: number | null;
    qtdConferida: number | null;
  },
  produto: ProdutoRecord | null | undefined,
): number | null {
  const qtdAnomalia = calcularQtdAnomaliaItemDebito(item);
  const pesoTotalKg = calcularPesoTotalItemDebito(qtdAnomalia, produto);

  if (pesoTotalKg == null) {
    return null;
  }

  return Number((valorUnitarioPorKg * pesoTotalKg).toFixed(2));
}
