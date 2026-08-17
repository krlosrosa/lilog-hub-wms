import type { ExpectedItemView } from '@lilog/contracts';
import { listExpectedItems } from '@lilog/replicache-recebimento';

import { findExpectedItemBySku } from '@/features/recebimento-rc/lib/map-expected-item-to-product';

import { getActiveReplicache } from './replicache-registry';

export async function getExpectedItemBySkuDirect(
  preRecebimentoId: string,
  sku: string,
): Promise<ExpectedItemView | undefined> {
  const rep = getActiveReplicache();
  if (!rep) {
    return undefined;
  }

  const items = await rep.query((tx) => listExpectedItems(tx, preRecebimentoId));
  return findExpectedItemBySku(items, sku);
}
