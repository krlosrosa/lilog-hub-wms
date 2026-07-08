export function normalizarItinerarioCodigo(codigo: string): string {
  return codigo.trim().toLocaleLowerCase('pt-BR');
}

export function sanitizarItinerariosInput(
  codigos: string[] | undefined,
): string[] {
  if (!codigos?.length) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of codigos) {
    const codigo = normalizarItinerarioCodigo(raw);

    if (!codigo || seen.has(codigo)) {
      continue;
    }

    seen.add(codigo);
    result.push(codigo);
  }

  return result;
}
