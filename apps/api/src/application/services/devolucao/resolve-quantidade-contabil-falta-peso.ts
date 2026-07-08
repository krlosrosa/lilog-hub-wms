export function resolveQuantidadeContabilConsiderada(
  quantidadeFiscalOriginal: number,
  zerarQuantidadeContabil: boolean,
): number {
  if (zerarQuantidadeContabil) {
    return 0;
  }

  return quantidadeFiscalOriginal;
}

export function formatQuantidadeContabilDb(value: number): string {
  return value.toFixed(3);
}
