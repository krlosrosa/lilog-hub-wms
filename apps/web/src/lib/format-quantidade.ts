export type DisplayConfig = {
  unidadePadrao: 'CX' | 'UN';
  decimaisCaixa: number;
  decimaisUnidade: number;
};

export const DEFAULT_DISPLAY_CONFIG: DisplayConfig = {
  unidadePadrao: 'UN',
  decimaisCaixa: 2,
  decimaisUnidade: 0,
};

export type DisplayQuantidade = {
  valor: number;
  unidade: 'CX' | 'UN';
  casasDecimais: number;
};

export function fromBaseUnitsForDisplay(
  qtdBaseUN: number,
  unidadesPorCaixa: number | null | undefined,
  config: DisplayConfig,
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

export function resolveCasasDecimais(
  unidade: string | null | undefined,
  config: DisplayConfig,
): number {
  if (unidade === 'CX') {
    return config.decimaisCaixa;
  }

  if (unidade === 'UN') {
    return config.decimaisUnidade;
  }

  return config.unidadePadrao === 'CX'
    ? config.decimaisCaixa
    : config.decimaisUnidade;
}

export function formatQuantidadeValue(
  value: number | null,
  unidade: string | null | undefined,
  config: DisplayConfig = DEFAULT_DISPLAY_CONFIG,
): string {
  if (value === null) {
    return '—';
  }

  const formatted = value.toLocaleString('pt-BR', {
    minimumFractionDigits: resolveCasasDecimais(unidade, config),
    maximumFractionDigits: resolveCasasDecimais(unidade, config),
  });

  return unidade ? `${formatted} ${unidade}` : formatted;
}

export function formatQuantidadeFromBaseUN(
  qtdBaseUN: number | null,
  unidadesPorCaixa: number | null | undefined,
  config: DisplayConfig = DEFAULT_DISPLAY_CONFIG,
): string {
  if (qtdBaseUN === null) {
    return '—';
  }

  const display = fromBaseUnitsForDisplay(qtdBaseUN, unidadesPorCaixa, config);

  return formatQuantidadeValue(display.valor, display.unidade, config);
}

export function formatQuantidadeFromBaseUNSigned(
  qtdBaseUN: number | null,
  unidadesPorCaixa: number | null | undefined,
  config: DisplayConfig = DEFAULT_DISPLAY_CONFIG,
): string {
  if (qtdBaseUN === null) {
    return '—';
  }

  const display = fromBaseUnitsForDisplay(
    Math.abs(qtdBaseUN),
    unidadesPorCaixa,
    config,
  );
  const formatted = formatQuantidadeValue(display.valor, display.unidade, config);

  if (qtdBaseUN > 0) {
    return `+${formatted}`;
  }

  if (qtdBaseUN < 0) {
    return `-${formatted}`;
  }

  return formatted;
}
