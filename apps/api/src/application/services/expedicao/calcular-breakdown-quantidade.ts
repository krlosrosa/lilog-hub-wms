export type BreakdownQuantidade = {
  paletes: number;
  caixas: number;
  unidades: number;
  pesoPaletes: number | null;
  pesoCaixas: number | null;
  pesoUnidades: number | null;
};

function parsePeso(value: string | null): number | null {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolvePeso(
  pesoBruto: string | null,
  pesoLiquido: string | null,
): number | null {
  return parsePeso(pesoBruto) ?? parsePeso(pesoLiquido);
}

function derivePesosEmpacotamento(
  pesoUnit: number | null,
  pesoCx: number | null,
  pesoPlt: number | null,
  unidadesPorCaixa: number,
  caixasPorPalete: number | null,
): { pesoUnit: number | null; pesoCx: number | null; pesoPlt: number | null } {
  let unit = pesoUnit;
  let cx = pesoCx;
  let plt = pesoPlt;

  if (cx !== null) {
    if (unit === null && unidadesPorCaixa > 0) {
      unit = roundPeso(cx / unidadesPorCaixa);
    }

    if (plt === null && caixasPorPalete && caixasPorPalete > 0) {
      plt = roundPeso(cx * caixasPorPalete);
    }
  }

  if (plt !== null && caixasPorPalete && caixasPorPalete > 0) {
    if (cx === null) {
      cx = roundPeso(plt / caixasPorPalete);
    }

    if (unit === null && unidadesPorCaixa > 0) {
      const cxBase = cx ?? roundPeso(plt / caixasPorPalete);
      if (cxBase !== null) {
        unit = roundPeso(cxBase / unidadesPorCaixa);
      }
    }
  }

  if (unit !== null) {
    if (cx === null) {
      cx = roundPeso(unit * unidadesPorCaixa);
    }

    if (
      plt === null &&
      caixasPorPalete &&
      caixasPorPalete > 0 &&
      cx !== null
    ) {
      plt = roundPeso(cx * caixasPorPalete);
    }
  }

  return { pesoUnit: unit, pesoCx: cx, pesoPlt: plt };
}

function roundPeso(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export type PesoPorUnidadeProdutoInput = {
  unidadesPorCaixa: number | null;
  caixasPorPalete: number | null;
  pesoBrutoUnidade: string | null;
  pesoBrutoCaixa: string | null;
  pesoBrutoPalete: string | null;
  pesoLiquidoUnidade: string | null;
  pesoLiquidoCaixa: string | null;
  pesoLiquidoPalete: string | null;
};

export function resolverPesoPorUnidadeProduto(
  input: PesoPorUnidadeProdutoInput,
): number | null {
  const unidadesPorCaixa =
    input.unidadesPorCaixa != null && input.unidadesPorCaixa > 0
      ? input.unidadesPorCaixa
      : 1;

  const pesoBruto = derivePesosEmpacotamento(
    parsePeso(input.pesoBrutoUnidade),
    parsePeso(input.pesoBrutoCaixa),
    parsePeso(input.pesoBrutoPalete),
    unidadesPorCaixa,
    input.caixasPorPalete,
  ).pesoUnit;

  if (pesoBruto != null && pesoBruto > 0) {
    return pesoBruto;
  }

  const pesoLiquido = derivePesosEmpacotamento(
    parsePeso(input.pesoLiquidoUnidade),
    parsePeso(input.pesoLiquidoCaixa),
    parsePeso(input.pesoLiquidoPalete),
    unidadesPorCaixa,
    input.caixasPorPalete,
  ).pesoUnit;

  return pesoLiquido != null && pesoLiquido > 0 ? pesoLiquido : null;
}

export function calcularBreakdownQuantidade(
  quantidadeNormalizadaUnidades: number,
  unidadesPorCaixa: number | null,
  caixasPorPalete: number | null,
  pesoBrutoUnidade: string | null,
  pesoBrutoCaixa: string | null,
  pesoBrutoPalete: string | null,
  pesoLiquidoUnidade: string | null = null,
  pesoLiquidoCaixa: string | null = null,
  pesoLiquidoPalete: string | null = null,
): BreakdownQuantidade | null {
  if (!unidadesPorCaixa || unidadesPorCaixa <= 0) {
    return null;
  }

  const qtdNorm = Math.floor(quantidadeNormalizadaUnidades);
  const totalCaixas = Math.floor(qtdNorm / unidadesPorCaixa);
  const unidades = qtdNorm % unidadesPorCaixa;

  const paletes =
    caixasPorPalete && caixasPorPalete > 0
      ? Math.floor(totalCaixas / caixasPorPalete)
      : 0;
  const caixas =
    caixasPorPalete && caixasPorPalete > 0
      ? totalCaixas % caixasPorPalete
      : totalCaixas;

  const pesoUnitRaw = resolvePeso(pesoBrutoUnidade, pesoLiquidoUnidade);
  const pesoCxRaw = resolvePeso(pesoBrutoCaixa, pesoLiquidoCaixa);
  const pesoPltRaw = resolvePeso(pesoBrutoPalete, pesoLiquidoPalete);

  const { pesoUnit, pesoCx, pesoPlt } = derivePesosEmpacotamento(
    pesoUnitRaw,
    pesoCxRaw,
    pesoPltRaw,
    unidadesPorCaixa,
    caixasPorPalete,
  );

  return {
    paletes,
    caixas,
    unidades,
    pesoPaletes:
      pesoPlt !== null && paletes > 0 ? roundPeso(paletes * pesoPlt) : null,
    pesoCaixas: pesoCx !== null && caixas > 0 ? roundPeso(caixas * pesoCx) : null,
    pesoUnidades:
      pesoUnit !== null && unidades > 0 ? roundPeso(unidades * pesoUnit) : null,
  };
}

export type ItemComBreakdownPalete = {
  breakdown: BreakdownQuantidade | null;
  caixasPorPalete?: number | null;
};

export function calcularTotalPaletesFisicos(
  itens: ItemComBreakdownPalete[],
): number {
  let paletesFull = 0;
  let percentualAcumulado = 0;

  for (const item of itens) {
    if (!item.breakdown) {
      continue;
    }

    paletesFull += item.breakdown.paletes;

    if (item.caixasPorPalete && item.caixasPorPalete > 0) {
      percentualAcumulado += item.breakdown.caixas / item.caixasPorPalete;
    }
  }

  return paletesFull + Math.ceil(percentualAcumulado);
}
