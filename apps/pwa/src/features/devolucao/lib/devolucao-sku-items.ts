import { buildRascunhosMap } from '@/features/devolucao/lib/devolucao-conferencia-rascunho';
import type { SkuItem } from '@/features/devolucao/types/devolucao.schema';
import {
  getDemandaDetalhe,
  mapItensToSkuItems,
} from '@/lib/offline/demand-detail-cache';

export async function getSkuItemsByDemandId(
  demandId: string,
): Promise<SkuItem[]> {
  const detalhe = await getDemandaDetalhe(demandId);
  if (!detalhe) {
    return [];
  }

  const rascunhos = await buildRascunhosMap(demandId);
  return mapItensToSkuItems(
    detalhe.notasFiscais,
    rascunhos,
    detalhe.faltasPeso ?? [],
  );
}
