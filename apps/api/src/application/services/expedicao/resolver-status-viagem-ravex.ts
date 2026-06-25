import type { StatusTransporteOperacional } from '../../../domain/repositories/expedicao/transporte.repository.js';

export function resolverStatusViagemRavex(
  viagemInicioEm: Date | null | undefined,
  viagemFimEm: Date | null | undefined,
): Extract<StatusTransporteOperacional, 'em_viagem' | 'viagem_finalizada'> | null {
  if (viagemFimEm) {
    return 'viagem_finalizada';
  }

  if (viagemInicioEm) {
    return 'em_viagem';
  }

  return null;
}
