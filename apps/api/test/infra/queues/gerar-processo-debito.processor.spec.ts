import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';

import { GerarProcessoDebitoProcessor } from '../../../src/infra/queues/gerar-processo-debito.processor.js';
import { JOB_GERAR_PROCESSO_DEBITO } from '../../../src/infra/queues/cobranca-transportadora.queue.js';

describe('GerarProcessoDebitoProcessor', () => {
  const gerarProcessoDebitoUseCase = {
    execute: vi.fn(),
  };

  let processor: GerarProcessoDebitoProcessor;

  beforeEach(() => {
    vi.clearAllMocks();
    processor = new GerarProcessoDebitoProcessor(
      gerarProcessoDebitoUseCase as never,
    );
  });

  it('deve chamar usecase ao receber job correto', async () => {
    const jobData = {
      demandaId: 'demanda-1',
      unidadeId: 'unidade-1',
    };
    const job = {
      name: JOB_GERAR_PROCESSO_DEBITO,
      data: jobData,
      id: '1',
    } as unknown as Job;

    await processor.process(job);

    expect(gerarProcessoDebitoUseCase.execute).toHaveBeenCalledWith(jobData);
  });

  it('deve re-lançar erro do usecase para BullMQ gerenciar retry', async () => {
    const error = new Error('Falha na geração');
    gerarProcessoDebitoUseCase.execute.mockRejectedValue(error);
    const job = {
      name: JOB_GERAR_PROCESSO_DEBITO,
      data: { demandaId: 'demanda-1', unidadeId: 'unidade-1' },
      id: '1',
    } as unknown as Job;

    await expect(processor.process(job)).rejects.toThrow('Falha na geração');
  });

  it('não deve lançar erro para jobs desconhecidos', async () => {
    const job = { name: 'job-inexistente', data: {}, id: '2' } as unknown as Job;
    await expect(processor.process(job)).resolves.toBeUndefined();
    expect(gerarProcessoDebitoUseCase.execute).not.toHaveBeenCalled();
  });
});
