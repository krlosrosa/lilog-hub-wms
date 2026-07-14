import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { recebimentoV2Db } from '../local-db/db';
import {
  isPreparationRoute,
  isProcessReadyForConference,
  isProcessReadyStatus,
} from './require-process-ready';

const DEMAND_ID = 'demand-test-ready';

describe('require-process-ready', () => {
  beforeEach(async () => {
    await recebimentoV2Db.processes.clear();
  });

  afterEach(async () => {
    await recebimentoV2Db.processes.clear();
  });

  it('isProcessReadyStatus aceita status prontos para conferência', () => {
    expect(isProcessReadyStatus('ready')).toBe(true);
    expect(isProcessReadyStatus('working')).toBe(true);
    expect(isProcessReadyStatus('pendingSync')).toBe(true);
    expect(isProcessReadyStatus('completed')).toBe(true);
    expect(isProcessReadyStatus('notDownloaded')).toBe(false);
    expect(isProcessReadyStatus('downloading')).toBe(false);
  });

  it('isProcessReadyForConference retorna false sem bootstrap', async () => {
    await recebimentoV2Db.processes.put({
      id: DEMAND_ID,
      unidadeId: 'ITB',
      adapter: 'recebimento-v2',
      status: 'notDownloaded',
      serverRevision: 1,
      baseRevision: 0,
      flowVersion: 'v2',
      souApoio: true,
      createdAt: 1,
      updatedAt: 1,
    });

    await expect(isProcessReadyForConference(DEMAND_ID)).resolves.toBe(false);
  });

  it('isProcessReadyForConference retorna true após bootstrap', async () => {
    await recebimentoV2Db.processes.put({
      id: DEMAND_ID,
      unidadeId: 'ITB',
      adapter: 'recebimento-v2',
      status: 'ready',
      serverRevision: 1,
      baseRevision: 0,
      flowVersion: 'v2',
      souApoio: true,
      createdAt: 1,
      updatedAt: 1,
    });

    await expect(isProcessReadyForConference(DEMAND_ID)).resolves.toBe(true);
  });

  it('isPreparationRoute identifica rotas liberadas', () => {
    expect(isPreparationRoute('/recebimento-v2/abc/preparacao')).toBe(true);
    expect(isPreparationRoute('/recebimento-v2/abc/conflito')).toBe(true);
    expect(isPreparationRoute('/recebimento-v2/abc/itens')).toBe(false);
    expect(isPreparationRoute('/recebimento-v2/abc/checklist')).toBe(false);
  });
});
