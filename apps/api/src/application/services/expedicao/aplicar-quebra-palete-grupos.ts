import type { GerarMapasConfigInput } from '../../dtos/expedicao/gerar-mapas.dto.js';
import { calcularBreakdownQuantidade } from './calcular-breakdown-quantidade.js';
import type { ItemMapaSegregavel } from './segregar-itens-mapa.js';

type QuebraPaleteConfig = GerarMapasConfigInput['quebraPalete'];

function calcularPercentualCaixasNoPalete(item: ItemMapaSegregavel): number {
  if (!item.caixasPorPalete || item.caixasPorPalete <= 0) {
    return 0;
  }

  const breakdown = calcularBreakdownQuantidade(
    item.quantidadeNormalizadaUnidades,
    item.unidadesPorCaixa,
    item.caixasPorPalete,
    item.pesoBrutoUnidade,
    item.pesoBrutoCaixa,
    item.pesoBrutoPalete,
    item.pesoLiquidoUnidade,
    item.pesoLiquidoCaixa,
    item.pesoLiquidoPalete,
  );

  if (!breakdown) {
    return 0;
  }

  return (breakdown.caixas / item.caixasPorPalete) * 100;
}

function aplicarQuebraPorLinhas(
  itens: ItemMapaSegregavel[],
  valor: number,
): ItemMapaSegregavel[][] {
  const partes: ItemMapaSegregavel[][] = [];

  for (let index = 0; index < itens.length; index += valor) {
    partes.push(itens.slice(index, index + valor));
  }

  return partes.length > 0 ? partes : [[]];
}

function aplicarQuebraPorPercentual(
  itens: ItemMapaSegregavel[],
  valor: number,
): ItemMapaSegregavel[][] {
  const partes: ItemMapaSegregavel[][] = [[]];
  let acumulado = 0;

  itens.forEach((item) => {
    const pct = calcularPercentualCaixasNoPalete(item);
    const grupoAtual = partes[partes.length - 1]!;

    if (grupoAtual.length > 0 && acumulado + pct > valor) {
      partes.push([item]);
      acumulado = pct;
      return;
    }

    grupoAtual.push(item);
    acumulado += pct;
  });

  return partes.filter((parte) => parte.length > 0);
}

export function aplicarQuebraPaleteItens(
  itens: ItemMapaSegregavel[],
  config: QuebraPaleteConfig,
): ItemMapaSegregavel[][] {
  if (!config.ativo || !config.valor || config.valor <= 0 || itens.length === 0) {
    return [itens];
  }

  if (config.tipo === 'linhas') {
    return aplicarQuebraPorLinhas(itens, config.valor);
  }

  return aplicarQuebraPorPercentual(itens, config.valor);
}
