export function gerarCodigoUnitizadorPalete(
  recebimentoRef: string,
  sequencial: number,
): string {
  const ref = recebimentoRef.replace(/[^A-Z0-9]/gi, '').slice(0, 12).toUpperCase();
  return `PLT-${ref}-${String(sequencial).padStart(4, '0')}`;
}
