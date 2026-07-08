const paleteSessionByDemand = new Map<string, string>();

export function getPaleteSession(demandId: string): string | null {
  return paleteSessionByDemand.get(demandId) ?? null;
}

export function setPaleteSession(demandId: string, unitizadorCodigo: string): void {
  paleteSessionByDemand.set(demandId, unitizadorCodigo.trim());
}

export function clearPaleteSession(demandId: string): void {
  paleteSessionByDemand.delete(demandId);
}

export function hasPaleteSession(demandId: string): boolean {
  return Boolean(getPaleteSession(demandId));
}
