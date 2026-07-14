import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IniciarRecebimentoUseCase } from '../../../src/application/usecases/recebimento/iniciar-recebimento.usecase.js';

const preRecebimentoId = '00000000-0000-4000-8000-000000000001';
const sessaoId = '00000000-0000-4000-8000-000000000002';
const sessaoFuncionarioId = '00000000-0000-4000-8000-000000000003';
const responsavelId = 42;

const preRecebimento = {
  id: preRecebimentoId,
  unidadeId: 'UN-001',
  situacao: 'liberado_para_conferencia' as const,
  docaId: null,
};

describe('IniciarRecebimentoUseCase', () => {
  const preRecebimentoRepository = {
    findById: vi.fn(),
    updateSituacao: vi.fn(),
  };

  const recebimentoRepository = {
    findByPreRecebimentoId: vi.fn(),
    create: vi.fn(),
  };

  const funcionarioRepository = {
    findById: vi.fn(),
  };

  const docaRepository = {
    findById: vi.fn(),
  };

  const unidadeRepository = {
    findById: vi.fn(),
  };

  const configuracaoOperacionalRepository = {
    list: vi.fn(),
  };

  const recebimentoAlocacaoRepository = {
    findAtivaByPreRecebimentoId: vi.fn(),
    criar: vi.fn(),
    marcarIniciada: vi.fn(),
  };

  const sessaoOperacaoRepository = {
    findSessaoFuncionarioRecebimentoAberta: vi.fn(),
  };

  const recebimentoEventPublisher = {
    publish: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function createUseCase() {
    return new IniciarRecebimentoUseCase(
      preRecebimentoRepository as never,
      recebimentoRepository as never,
      funcionarioRepository as never,
      docaRepository as never,
      unidadeRepository as never,
      configuracaoOperacionalRepository as never,
      recebimentoAlocacaoRepository as never,
      sessaoOperacaoRepository as never,
      recebimentoEventPublisher as never,
    );
  }

  function setupHappyPath() {
    preRecebimentoRepository.findById.mockResolvedValue(preRecebimento);
    recebimentoRepository.findByPreRecebimentoId.mockResolvedValue(null);
    recebimentoAlocacaoRepository.findAtivaByPreRecebimentoId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'aloc-1',
        preRecebimentoId,
        sessaoId,
        sessaoFuncionarioId,
        funcionarioId: responsavelId,
        status: 'atribuida',
        atribuidoEm: new Date(),
        inicioEm: null,
        canceladoEm: null,
      });
    sessaoOperacaoRepository.findSessaoFuncionarioRecebimentoAberta.mockResolvedValue(
      {
        sessaoId,
        sessaoFuncionarioId,
        funcionarioId: responsavelId,
      },
    );
    funcionarioRepository.findById.mockResolvedValue({
      id: responsavelId,
      nome: 'Conferente',
    });
    unidadeRepository.findById.mockResolvedValue({
      id: 'UN-001',
      modoUnitizacaoRecebimento: 'gerar_etiqueta_na_armazenagem',
    });
    configuracaoOperacionalRepository.list.mockResolvedValue([]);
    recebimentoRepository.create.mockResolvedValue({
      id: 'rec-1',
      preRecebimentoId,
      responsavelId,
    });
    recebimentoAlocacaoRepository.criar.mockResolvedValue({
      id: 'aloc-1',
      preRecebimentoId,
      sessaoId,
      sessaoFuncionarioId,
      funcionarioId: responsavelId,
      status: 'atribuida',
      atribuidoEm: new Date(),
      inicioEm: null,
      canceladoEm: null,
    });
  }

  it('auto-cria alocacao e marca iniciada quando conferente inicia sem atribuicao previa', async () => {
    setupHappyPath();
    const useCase = await createUseCase();

    await useCase.execute({
      data: { preRecebimentoId, responsavelId },
      userId: 1,
    });

    expect(
      sessaoOperacaoRepository.findSessaoFuncionarioRecebimentoAberta,
    ).toHaveBeenCalledWith('UN-001', responsavelId);
    expect(recebimentoAlocacaoRepository.criar).toHaveBeenCalledWith({
      preRecebimentoId,
      sessaoId,
      sessaoFuncionarioId,
      funcionarioId: responsavelId,
      atribuidoPorUserId: 1,
    });
    expect(recebimentoAlocacaoRepository.marcarIniciada).toHaveBeenCalledWith(
      preRecebimentoId,
    );
  });

  it('rejeita quando demanda foi atribuida a outro conferente', async () => {
    preRecebimentoRepository.findById.mockResolvedValue(preRecebimento);
    recebimentoRepository.findByPreRecebimentoId.mockResolvedValue(null);
    recebimentoAlocacaoRepository.findAtivaByPreRecebimentoId.mockResolvedValue({
      id: 'aloc-1',
      preRecebimentoId,
      sessaoId,
      sessaoFuncionarioId,
      funcionarioId: 99,
      status: 'atribuida',
      atribuidoEm: new Date(),
      inicioEm: null,
      canceladoEm: null,
    });

    const useCase = await createUseCase();

    await expect(
      useCase.execute({
        data: { preRecebimentoId, responsavelId },
        userId: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('inicia recebimento sem alocacao quando nao ha sessao aberta de recebimento', async () => {
    preRecebimentoRepository.findById.mockResolvedValue(preRecebimento);
    recebimentoRepository.findByPreRecebimentoId.mockResolvedValue(null);
    recebimentoAlocacaoRepository.findAtivaByPreRecebimentoId.mockResolvedValue(
      null,
    );
    sessaoOperacaoRepository.findSessaoFuncionarioRecebimentoAberta.mockResolvedValue(
      null,
    );
    funcionarioRepository.findById.mockResolvedValue({
      id: responsavelId,
      nome: 'Conferente',
    });
    unidadeRepository.findById.mockResolvedValue({
      id: 'UN-001',
      modoUnitizacaoRecebimento: 'gerar_etiqueta_na_armazenagem',
    });
    configuracaoOperacionalRepository.list.mockResolvedValue([]);
    recebimentoRepository.create.mockResolvedValue({
      id: 'rec-1',
      preRecebimentoId,
      responsavelId,
    });

    const useCase = await createUseCase();

    await useCase.execute({
      data: { preRecebimentoId, responsavelId },
      userId: 1,
    });

    expect(recebimentoAlocacaoRepository.criar).not.toHaveBeenCalled();
    expect(recebimentoAlocacaoRepository.marcarIniciada).not.toHaveBeenCalled();
    expect(recebimentoRepository.create).toHaveBeenCalled();
  });
});
