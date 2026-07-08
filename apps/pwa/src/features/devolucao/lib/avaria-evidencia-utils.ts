export function buildAvariaRelatedId(demandId: string, sku?: string): string {
  return `avaria:${demandId}:${(sku ?? 'geral').toLowerCase()}`;
}
