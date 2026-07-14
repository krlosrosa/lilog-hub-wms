export function getReferenciaOciosidadeRecebimentoIso(
  checkIn: string | null,
  ultimaMissaoFinalizadaEm: string | null | undefined,
): string | null {
  if (ultimaMissaoFinalizadaEm) {
    return ultimaMissaoFinalizadaEm;
  }

  return checkIn;
}
