export function getReferenciaOciosidadeRecebimentoIso(
  checkIn: string | null,
  ultimaMissaoFinalizadaEm: string | null,
): string | null {
  if (ultimaMissaoFinalizadaEm) {
    return ultimaMissaoFinalizadaEm;
  }

  return checkIn;
}
