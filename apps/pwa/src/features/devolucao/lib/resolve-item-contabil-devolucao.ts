import type { DevolucaoFaltaPesoCache } from '@/features/devolucao/types/devolucao.schema';

export function buildFaltasPesoAtivasPorItemId(
  faltasPeso: DevolucaoFaltaPesoCache[] | undefined,
): Map<string, DevolucaoFaltaPesoCache> {
  const map = new Map<string, DevolucaoFaltaPesoCache>();

  for (const falta of faltasPeso ?? []) {
    if (falta.status === 'validada' || falta.status === 'pendente') {
      map.set(falta.itemId, falta);
    }
  }

  return map;
}

export function shouldExcluirItemDaConferencia(
  itemId: string,
  faltasPorItemId: Map<string, DevolucaoFaltaPesoCache>,
): boolean {
  const falta = faltasPorItemId.get(itemId);
  if (!falta) {
    return false;
  }

  return Math.round(falta.quantidadeContabilConsiderada) === 0;
}

export function resolveQtdEsperadaConferencia(
  quantidadeItem: number,
  itemId: string,
  faltasPorItemId: Map<string, DevolucaoFaltaPesoCache>,
): number {
  const falta = faltasPorItemId.get(itemId);
  if (falta) {
    return Math.round(falta.quantidadeContabilConsiderada);
  }

  return Math.round(quantidadeItem);
}
