import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ListarProcessosDebitoController } from '../../../src/presentation/controllers/cobranca-transportadora/listar-processos-debito.controller.js';

describe('ListarProcessosDebitoController', () => {
  const listarProcessosDebitoUseCase = {
    execute: vi.fn(),
  };

  let controller: ListarProcessosDebitoController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new ListarProcessosDebitoController(
      listarProcessosDebitoUseCase as never,
    );
  });

  it('delega para o usecase', async () => {
    const query = { unidadeId: 'unidade-1' };
    const response = { processos: [] };
    listarProcessosDebitoUseCase.execute.mockResolvedValue(response);

    const result = await controller.handle(query);

    expect(listarProcessosDebitoUseCase.execute).toHaveBeenCalledWith(query);
    expect(result).toEqual(response);
  });
});
