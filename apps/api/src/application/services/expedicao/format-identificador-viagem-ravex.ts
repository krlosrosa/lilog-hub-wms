export function formatIdentificadorViagemRavex(rota: string): string {
  const digits = rota.replace(/\D/g, '');
  return digits.padStart(10, '0');
}
