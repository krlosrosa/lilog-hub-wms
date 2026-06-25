import type { TransporteRisco } from '@/features/indicadores/lib/torre-controle.schema';

export function ordenarTransportesPorCriticidade(
  transportes: TransporteRisco[],
): TransporteRisco[] {
  return [...transportes].sort((a, b) => b.scoreCriticidade - a.scoreCriticidade);
}
