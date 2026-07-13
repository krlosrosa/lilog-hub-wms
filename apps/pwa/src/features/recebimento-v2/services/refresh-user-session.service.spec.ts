import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./sync-process-list.service', () => ({
  syncProcessList: vi.fn().mockResolvedValue({ items: [], removedCount: 0 }),
}));

vi.mock('./auto-sync-v2.service', () => ({
  resetAutoSyncV2State: vi.fn(),
}));

import type { AuthUser } from '@/features/auth/types';

import { recebimentoV2Db } from '../local-db/db';
import { resetAutoSyncV2State } from './auto-sync-v2.service';
import {
  clearRecebimentoV2UserSessionCache,
  refreshRecebimentoV2UserSession,
} from './refresh-user-session.service';
import { syncProcessList } from './sync-process-list.service';

const USER: AuthUser = {
  id: 2,
  name: 'Operador B',
  email: 'b@test.com',
  role: 'operador',
  funcionarioId: 20,
  unidadeId: 'ITB',
};

describe('refresh-user-session.service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await recebimentoV2Db.processes.clear();
    await recebimentoV2Db.demands.clear();
    await recebimentoV2Db.products.clear();
    await recebimentoV2Db.docas.clear();
  });

  afterEach(async () => {
    await recebimentoV2Db.processes.clear();
    await recebimentoV2Db.demands.clear();
    await recebimentoV2Db.products.clear();
    await recebimentoV2Db.docas.clear();
  });

  it('clears session tables but keeps unit reference data', async () => {
    await recebimentoV2Db.processes.put({
      id: 'demand-1',
      unidadeId: 'ITB',
      adapter: 'recebimento-v2',
      status: 'working',
      serverRevision: 1,
      baseRevision: 0,
      flowVersion: 'v2',
      createdAt: 1,
      updatedAt: 1,
    });
    await recebimentoV2Db.products.put({
      produtoId: 'prod-1',
      unidadeId: 'ITB',
      sku: 'SKU1',
      description: 'Produto',
      empresa: 'ITB',
      categoria: 'cat',
      tipo: 'tipo',
      ean: '',
      dum: '',
      shelfLife: 0,
      pesoBrutoUnidade: 0,
      pesoBrutoCaixa: 0,
      pesoBrutoPalete: 0,
      pesoLiquidoUnidade: 0,
      pesoLiquidoCaixa: 0,
      pesoLiquidoPalete: 0,
      unidadesPorCaixa: 1,
      caixasPorPalete: 1,
      controlaLote: false,
      controlaValidade: false,
      controlaPeso: false,
      pesoVariavel: false,
      serverRevision: 1,
      updatedAt: 1,
      deletedAt: null,
    });
    await recebimentoV2Db.docas.put({
      unidadeId: 'ITB',
      docas: [],
      cachedAt: 1,
    });

    await clearRecebimentoV2UserSessionCache();

    expect(resetAutoSyncV2State).toHaveBeenCalled();
    expect(await recebimentoV2Db.processes.count()).toBe(0);
    expect(await recebimentoV2Db.products.count()).toBe(1);
    expect(await recebimentoV2Db.docas.count()).toBe(1);
  });

  it('prefetches process list after clearing on user session refresh', async () => {
    vi.stubGlobal('navigator', { onLine: true });

    await refreshRecebimentoV2UserSession(USER);

    expect(await recebimentoV2Db.processes.count()).toBe(0);
    expect(syncProcessList).toHaveBeenCalledWith('ITB');

    vi.unstubAllGlobals();
  });
});
