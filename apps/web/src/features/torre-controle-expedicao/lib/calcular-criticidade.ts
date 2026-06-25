import type { NivelRisco, TransporteRisco } from '@/features/torre-controle-expedicao/types/torre-controle.schema';

const RISCO_WEIGHT: Record<NivelRisco, number> = {
  critico: 400,
  alto: 300,
  medio: 200,
  baixo: 100,
};

export function calcularScoreCriticidade(input: {
  prioridade: boolean;
  tempoRestanteSaidaMin: number;
  tempoEstimadoFinalizarMin: number;
  nivelRisco: NivelRisco;
  etapaAtual: TransporteRisco['etapaAtual'];
}): number {
  let score = RISCO_WEIGHT[input.nivelRisco];

  if (input.prioridade) {
    score += 150;
  }

  if (input.tempoEstimadoFinalizarMin > input.tempoRestanteSaidaMin) {
    score += 120;
  }

  if (input.tempoRestanteSaidaMin <= 15) {
    score += 80;
  } else if (input.tempoRestanteSaidaMin <= 45) {
    score += 40;
  }

  if (input.etapaAtual === 'separacao' && input.prioridade) {
    score += 50;
  }

  return score;
}

export function ordenarTransportesPorCriticidade(
  transportes: TransporteRisco[],
): TransporteRisco[] {
  return [...transportes].sort((a, b) => {
    const aFinalizado = a.etapaAtual === 'finalizado';
    const bFinalizado = b.etapaAtual === 'finalizado';

    if (aFinalizado !== bFinalizado) {
      return aFinalizado ? 1 : -1;
    }

    return b.scoreCriticidade - a.scoreCriticidade;
  });
}

export function inferirNivelRisco(input: {
  tempoRestanteSaidaMin: number;
  tempoEstimadoFinalizarMin: number;
  prioridade: boolean;
}): NivelRisco {
  const deficit = input.tempoEstimadoFinalizarMin - input.tempoRestanteSaidaMin;

  if (deficit > 30 || (input.prioridade && input.tempoRestanteSaidaMin <= 20)) {
    return 'critico';
  }

  if (deficit > 10 || input.tempoRestanteSaidaMin <= 30) {
    return 'alto';
  }

  if (deficit > 0 || input.tempoRestanteSaidaMin <= 60) {
    return 'medio';
  }

  return 'baixo';
}

export function enriquecerTransporte(
  transporte: Omit<TransporteRisco, 'scoreCriticidade' | 'nivelRisco'> & {
    nivelRisco?: NivelRisco;
  },
): TransporteRisco {
  if (transporte.etapaAtual === 'finalizado') {
    return {
      ...transporte,
      nivelRisco: 'baixo',
      scoreCriticidade: 0,
    };
  }

  const nivelRisco =
    transporte.nivelRisco ??
    inferirNivelRisco({
      prioridade: transporte.prioridade,
      tempoRestanteSaidaMin: transporte.tempoRestanteSaidaMin,
      tempoEstimadoFinalizarMin: transporte.tempoEstimadoFinalizarMin,
    });

  return {
    ...transporte,
    nivelRisco,
    scoreCriticidade: calcularScoreCriticidade({
      prioridade: transporte.prioridade,
      tempoRestanteSaidaMin: transporte.tempoRestanteSaidaMin,
      tempoEstimadoFinalizarMin: transporte.tempoEstimadoFinalizarMin,
      nivelRisco,
      etapaAtual: transporte.etapaAtual,
    }),
  };
}
