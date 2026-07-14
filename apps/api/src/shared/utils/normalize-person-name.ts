const NAME_PARTICLES = new Set(['de', 'da', 'do', 'dos', 'das', 'e']);

export function normalizePersonName(name: string): string {
  const collapsed = name.trim().replace(/\s+/g, ' ');

  if (!collapsed) {
    return collapsed;
  }

  return collapsed
    .split(' ')
    .map((word, index) => {
      const lower = word.toLocaleLowerCase('pt-BR');

      if (index > 0 && NAME_PARTICLES.has(lower)) {
        return lower;
      }

      return lower.charAt(0).toLocaleUpperCase('pt-BR') + lower.slice(1);
    })
    .join(' ');
}
