import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Queue } from 'bullmq';

import { TransporteEventPublisher } from '../../../src/application/services/transporte-event.publisher.js';
import {
  JOB_SINCRONIZAR_VIAGEM_RAVEX,
  VIAGEM_RAVEX_DELAY_FIM_MS,
} from '../../../src/infra/queues/expedicao-transporte.queue.js';

const transporteId = '00000000-0000-4000-8000-000000000001';
const unidadeId = 'unidade-1';

const jobData = {
  transporteId,
  unidadeId,
  fase: 'aguardar_fim' as const,
};

function createPublisher(queue: Pick<Queue, 'getJob' | 'add'>) {
  return new TransporteEventPublisher(queue as Queue);
}

describe('TransporteEventPublisher', () => {
  const queue = {
    getJob: vi.fn(),
    add: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enfileira job padrão quando não existe job anterior', async () => {
    vi.mocked(queue.getJob).mockResolvedValue(undefined);

    const publisher = createPublisher(queue);
    await publisher.publishSincronizarViagemRavex(jobData, {
      delay: VIAGEM_RAVEX_DELAY_FIM_MS,
    });

    expect(queue.add).toHaveBeenCalledWith(
      JOB_SINCRONIZAR_VIAGEM_RAVEX,
      jobData,
      expect.objectContaining({
        jobId: `viagem-ravex-${transporteId}-aguardar_fim`,
        delay: VIAGEM_RAVEX_DELAY_FIM_MS,
        removeOnComplete: true,
        removeOnFail: 100,
      }),
    );
  });

  it('usa jobId -next quando job atual está active e há delay de polling', async () => {
    vi.mocked(queue.getJob).mockImplementation(async (id: string) => {
      if (id === `viagem-ravex-${transporteId}-aguardar_fim`) {
        return {
          getState: vi.fn().mockResolvedValue('active'),
        } as never;
      }

      return undefined;
    });

    const publisher = createPublisher(queue);
    await publisher.publishSincronizarViagemRavex(jobData, {
      delay: VIAGEM_RAVEX_DELAY_FIM_MS,
    });

    expect(queue.add).toHaveBeenCalledWith(
      JOB_SINCRONIZAR_VIAGEM_RAVEX,
      jobData,
      expect.objectContaining({
        jobId: `viagem-ravex-${transporteId}-aguardar_fim-next`,
        delay: VIAGEM_RAVEX_DELAY_FIM_MS,
      }),
    );
  });

  it('não reenfileira quando job atual está active sem delay', async () => {
    vi.mocked(queue.getJob).mockResolvedValue({
      getState: vi.fn().mockResolvedValue('active'),
    } as never);

    const publisher = createPublisher(queue);
    await publisher.publishSincronizarViagemRavex(jobData);

    expect(queue.add).not.toHaveBeenCalled();
  });

  it('não reenfileira quando job já está delayed', async () => {
    vi.mocked(queue.getJob).mockResolvedValue({
      getState: vi.fn().mockResolvedValue('delayed'),
    } as never);

    const publisher = createPublisher(queue);
    await publisher.publishSincronizarViagemRavex(jobData, {
      delay: VIAGEM_RAVEX_DELAY_FIM_MS,
    });

    expect(queue.add).not.toHaveBeenCalled();
  });

  it('remove job completed e reenfileira com jobId padrão', async () => {
    const remove = vi.fn();
    vi.mocked(queue.getJob).mockResolvedValue({
      getState: vi.fn().mockResolvedValue('completed'),
      remove,
    } as never);

    const publisher = createPublisher(queue);
    await publisher.publishSincronizarViagemRavex(jobData, {
      delay: VIAGEM_RAVEX_DELAY_FIM_MS,
    });

    expect(remove).toHaveBeenCalled();
    expect(queue.add).toHaveBeenCalledWith(
      JOB_SINCRONIZAR_VIAGEM_RAVEX,
      jobData,
      expect.objectContaining({
        jobId: `viagem-ravex-${transporteId}-aguardar_fim`,
      }),
    );
  });
});
