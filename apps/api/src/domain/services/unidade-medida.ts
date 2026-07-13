import type { ParametrosRecebimentoConferencia } from '../model/configuracao-operacional/configuracao-operacional.model.js';

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

export type DisplayQuantidadeConfig = {
  unidadePadrao: 'CX' | 'UN';
  decimaisCaixa: number;
  decimaisUnidade: number;
};

export type DisplayQuantidade = {
  valor: number;
  unidade: 'CX' | 'UN';
  casasDecimais: number;
};

export const DEFAULT_DISPLAY_QUANTIDADE_CONFIG: DisplayQuantidadeConfig = {
  unidadePadrao: 'UN',
  decimaisCaixa: 2,
  decimaisUnidade: 0,
};

export function resolveDisplayQuantidadeConfig(
  parametros?: Pick<
    ParametrosRecebimentoConferencia,
    'displayUnidadePadrao' | 'displayDecimaisCaixa' | 'displayDecimaisUnidade'
  > | null,
): DisplayQuantidadeConfig {
  return {
    unidadePadrao: parametros?.displayUnidadePadrao ?? 'UN',
    decimaisCaixa: parametros?.displayDecimaisCaixa ?? 2,
    decimaisUnidade: parametros?.displayDecimaisUnidade ?? 0,
  };
}

export function fromBaseUnitsForDisplay(
  qtdBaseUN: number,
  unidadesPorCaixa: number | null | undefined,
  config: DisplayQuantidadeConfig,
): DisplayQuantidade {
  const upc =
    unidadesPorCaixa && unidadesPorCaixa > 0 ? unidadesPorCaixa : null;

  if (config.unidadePadrao === 'CX' && upc) {
    return {
      valor: qtdBaseUN / upc,
      unidade: 'CX',
      casasDecimais: config.decimaisCaixa,
    };
  }

  return {
    valor: qtdBaseUN,
    unidade: 'UN',
    casasDecimais: config.decimaisUnidade,
  };
}

export function fromBaseUnitsForDisplayNullable(
  qtdBaseUN: number | null,
  unidadesPorCaixa: number | null | undefined,
  config: DisplayQuantidadeConfig,
): {
  valor: number | null;
  unidade: 'CX' | 'UN' | null;
  casasDecimais: number;
} {
  if (qtdBaseUN === null) {
    return { valor: null, unidade: null, casasDecimais: 0 };
  }

  const display = fromBaseUnitsForDisplay(qtdBaseUN, unidadesPorCaixa, config);

  return {
    valor: display.valor,
    unidade: display.unidade,
    casasDecimais: display.casasDecimais,
  };
}
