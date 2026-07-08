import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';

import { ProcessarSaldoRecebimentoProcessor } from '../../../src/infra/queues/processar-saldo-recebimento.processor.js';
import { JOB_PROCESSAR_SALDO_RECEBIMENTO } from '../../../src/infra/queues/recebimento.queue.js';

describe('ProcessarSaldoRecebimentoProcessor', () => {
  const processarSaldoRecebimentoUseCase = {
    execute: vi.fn(),
  };

  let processor: ProcessarSaldoRecebimentoProcessor;

  beforeEach(() => {
    vi.clearAllMocks();
    processor = new ProcessarSaldoRecebimentoProcessor(
      processarSaldoRecebimentoUseCase as never,
    );
  });

  it('deve chamar usecase ao receber job correto', async () => {
    const jobData = {
      recebimentoId: 'rec-1',
      unidadeId: 'ITB',
      userId: 1,
      itens: [
        {
          produtoId: 'prod-1',
          quantidade: 10,
          unidadeMedida: 'UN',
          lote: 'L1',
          validade: null,
          numeroSerie: null,
          depositoCodigo: 'GERAL',
        },
      ],
    };
    const job = {
      name: JOB_PROCESSAR_SALDO_RECEBIMENTO,
      data: jobData,
      id: '1',
    } as unknown as Job;

    await processor.process(job);

    expect(processarSaldoRecebimentoUseCase.execute).toHaveBeenCalledWith(
      jobData,
    );
  });

  it('deve re-lançar erro do usecase para BullMQ gerenciar retry', async () => {
    const error = new Error('Falha no processamento');
    processarSaldoRecebimentoUseCase.execute.mockRejectedValue(error);
    const job = {
      name: JOB_PROCESSAR_SALDO_RECEBIMENTO,
      data: {
        recebimentoId: 'rec-1',
        unidadeId: 'ITB',
        userId: 1,
        itens: [],
      },
      id: '1',
    } as unknown as Job;

    await expect(processor.process(job)).rejects.toThrow('Falha no processamento');
  });

  it('não deve lançar erro para jobs desconhecidos', async () => {
    const job = { name: 'job-inexistente', data: {}, id: '2' } as unknown as Job;
    await expect(processor.process(job)).resolves.toBeUndefined();
    expect(processarSaldoRecebimentoUseCase.execute).not.toHaveBeenCalled();
  });
});
