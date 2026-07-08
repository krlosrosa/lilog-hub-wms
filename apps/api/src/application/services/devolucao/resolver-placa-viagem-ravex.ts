import type { RavexViagemFaturada } from '../../../infra/clients/ravex/ravex-viagem.types.js';

export function resolverPlacaViagemRavex(
  viagem: RavexViagemFaturada,
): string | null {
  const placa = viagem.veiculo?.placa?.trim();

  return placa ? placa.toUpperCase() : null;
}
