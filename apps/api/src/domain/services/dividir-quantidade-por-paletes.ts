export function dividirQuantidadePorPaletes(
  quantidadeTotal: number,
  qtdPaletes: number,
): number[] {
  if (qtdPaletes <= 0) {
    return [];
  }

  const base = Math.floor(quantidadeTotal / qtdPaletes);
  const resto = quantidadeTotal % qtdPaletes;

  return Array.from({ length: qtdPaletes }, (_, index) =>
    index === qtdPaletes - 1 ? base + resto : base,
  );
}
