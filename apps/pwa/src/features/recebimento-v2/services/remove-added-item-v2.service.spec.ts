import { beforeEach, describe, expect, it } from 'vitest';

import { recebimentoV2Db } from '../local-db/db';
import type { ConferenceRecord, ExpectedItemRecord } from '../local-db/schema';
import { removeAddedItemV2 } from './remove-added-item-v2.service';

const DEMAND_ID = '550e8400-e29b-41d4-a716-446655440002';

function makeAddedItem(overrides: Partial<ExpectedItemRecord> = {}): ExpectedItemRecord {
  return {
    id: `${DEMAND_ID}::PROD-ADDED`,
    demandId: DEMAND_ID,
    produtoId: 'PROD-ADDED',
    sku: '600240283',
    descricao: 'Produto adicionado',
    quantidadeEsperada: 0,
    unidadeMedida: 'UN',
    isNovo: true,
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('removeAddedItemV2', () => {
  beforeEach(async () => {
    await recebimentoV2Db.expectedItems.clear();
    await recebimentoV2Db.conferences.clear();
    await recebimentoV2Db.damages.clear();
    await recebimentoV2Db.syncOperations.clear();
  });

  it('rejects deleting cargo items without isNovo', async () => {
    await recebimentoV2Db.expectedItems.put(
      makeAddedItem({ isNovo: false, produtoId: 'PROD-CARGA', id: `${DEMAND_ID}::PROD-CARGA` }),
    );

    await expect(removeAddedItemV2(DEMAND_ID, '600240283')).rejects.toThrow(
      'Este item não pode ser excluído',
    );
  });

  it('removes added item, conferences and expected item', async () => {
    await recebimentoV2Db.expectedItems.put(makeAddedItem());

    const conference: ConferenceRecord = {
      id: crypto.randomUUID(),
      demandId: DEMAND_ID,
      sku: '600240283',
      quantity: 2,
      conferidoAt: new Date().toISOString(),
      syncStatus: 'pending',
      updatedAt: Date.now(),
    };
    await recebimentoV2Db.conferences.put(conference);

    await removeAddedItemV2(DEMAND_ID, '600240283');

    expect(await recebimentoV2Db.expectedItems.toArray()).toHaveLength(0);
    expect(await recebimentoV2Db.conferences.toArray()).toHaveLength(0);
  });
});
