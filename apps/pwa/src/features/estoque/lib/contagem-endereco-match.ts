/** Normaliza endereço para comparação (trim, maiúsculas, sem espaços extras). */
export function normalizeEndereco(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export function enderecosConferem(
  informado: string,
  designado: string
): boolean {
  const a = normalizeEndereco(informado);
  const b = normalizeEndereco(designado);
  return a.length > 0 && b.length > 0 && a === b;
}

export const ENDERECO_DIVERGENTE_MSG =
  'Endereço não confere com o designado. Verifique e escaneie novamente.';
