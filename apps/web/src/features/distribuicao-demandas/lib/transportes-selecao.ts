const STORAGE_KEY = 'distribuicao-demandas:transportes-selecionados';

export function salvarTransportesSelecionados(ids: string[]): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function carregarTransportesSelecionados(): string[] {
  if (typeof window === 'undefined') return [];
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

export function limparTransportesSelecionados(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}
