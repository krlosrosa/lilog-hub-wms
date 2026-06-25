export type EtapaOperacional =
  | 'separacao'
  | 'conferencia'
  | 'carregamento'
  | 'finalizado';

export type NivelRisco = 'critico' | 'alto' | 'medio' | 'baixo';

export type NivelPrioridadeTransporte =
  | 'urgente'
  | 'prioritaria'
  | 'normal'
  | 'baixa';

const RISCO_WEIGHT: Record<NivelRisco, number> = {
  critico: 400,
  alto: 300,
  medio: 200,
  baixo: 100,
};

const NIVEL_PRIORIDADE_SCORE: Record<NivelPrioridadeTransporte, number> = {
  urgente: 60,
  prioritaria: 40,
  normal: 20,
  baixa: 10,
};

function limiarCriticoPrioridade(
  nivelPrioridade: NivelPrioridadeTransporte | null | undefined,
): number {
  if (nivelPrioridade === 'urgente') {
    return 30;
  }

  if (nivelPrioridade === 'prioritaria') {
    return 25;
  }

  return 20;
}

export function inferirNivelRisco(input: {
  tempoRestanteSaidaMin: number;
  tempoEstimadoFinalizarMin: number;
  prioridade: boolean;
  isPrioridade?: boolean;
  nivelPrioridade?: NivelPrioridadeTransporte | null;
}): NivelRisco {
  const deficit = input.tempoEstimadoFinalizarMin - input.tempoRestanteSaidaMin;
  const limiarCritico = input.isPrioridade
    ? limiarCriticoPrioridade(input.nivelPrioridade)
    : 20;

  if (
    deficit > 30 ||
    (input.prioridade && input.tempoRestanteSaidaMin <= limiarCritico)
  ) {
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

export function calcularScoreCriticidade(input: {
  prioridade: boolean;
  isPrioridade?: boolean;
  nivelPrioridade?: NivelPrioridadeTransporte | null;
  tempoRestanteSaidaMin: number;
  tempoEstimadoFinalizarMin: number;
  nivelRisco: NivelRisco;
  etapaAtual: EtapaOperacional;
}): number {
  let score = RISCO_WEIGHT[input.nivelRisco];

  if (input.prioridade) {
    score += 150;
  }

  if (input.isPrioridade && input.nivelPrioridade) {
    score += NIVEL_PRIORIDADE_SCORE[input.nivelPrioridade];
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

export function enriquecerTransporteOperacional<
  T extends {
    prioridade: boolean;
    isPrioridade?: boolean;
    nivelPrioridade?: NivelPrioridadeTransporte | null;
    tempoRestanteSaidaMin: number;
    tempoEstimadoFinalizarMin: number;
    etapaAtual: EtapaOperacional;
  },
>(transporte: T): T & { nivelRisco: NivelRisco; scoreCriticidade: number } {
  if (transporte.etapaAtual === 'finalizado') {
    return {
      ...transporte,
      nivelRisco: 'baixo',
      scoreCriticidade: 0,
    };
  }

  const nivelRisco = inferirNivelRisco({
    prioridade: transporte.prioridade,
    isPrioridade: transporte.isPrioridade,
    nivelPrioridade: transporte.nivelPrioridade,
    tempoRestanteSaidaMin: transporte.tempoRestanteSaidaMin,
    tempoEstimadoFinalizarMin: transporte.tempoEstimadoFinalizarMin,
  });

  return {
    ...transporte,
    nivelRisco,
    scoreCriticidade: calcularScoreCriticidade({
      prioridade: transporte.prioridade,
      isPrioridade: transporte.isPrioridade,
      nivelPrioridade: transporte.nivelPrioridade,
      tempoRestanteSaidaMin: transporte.tempoRestanteSaidaMin,
      tempoEstimadoFinalizarMin: transporte.tempoEstimadoFinalizarMin,
      nivelRisco,
      etapaAtual: transporte.etapaAtual,
    }),
  };
}
