import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { GetRecursosRecebimentoSessaoUseCase } from '../../../src/application/usecases/recebimento/get-recursos-recebimento-sessao.usecase.js';
import {
  CONFIGURACAO_OPERACIONAL_REPOSITORY,
} from '../../../src/domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
import {
  RECEBIMENTO_ALOCACAO_REPOSITORY,
} from '../../../src/domain/repositories/recebimento/recebimento-alocacao.repository.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
} from '../../../src/domain/repositories/sessao-operacao/sessao-operacao.repository.js';

const sessaoId = '00000000-0000-4000-8000-000000000001';
const unidadeId = 'UN-001';
const sessaoFuncionarioId = '00000000-0000-4000-8000-000000000002';
const preRecebimentoId = '00000000-0000-4000-8000-000000000003';

describe('GetRecursosRecebimentoSessaoUseCase', () => {
  const sessaoOperacaoRepository = {
    findSessaoById: vi.fn(),
    listSessaoFuncionarios: vi.fn(),
    listSessaoFuncionarioPausas: vi.fn(),
  };

  const recebimentoAlocacaoRepository = {
    listDemandasComAlocacao: vi.fn(),
    listApoiosByPreRecebimentoId: vi.fn().mockResolvedValue([]),
    listUltimasMissoesFinalizadasPorSessao: vi.fn(),
  };

  const configuracaoOperacionalRepository = {
    findRegrasPausaPadrao: vi.fn(),
  };

  async function createUseCase() {
    const moduleRef = await Test.createTestingModule({
      providers: [
        GetRecursosRecebimentoSessaoUseCase,
        {
          provide: SESSAO_OPERACAO_REPOSITORY,
          useValue: sessaoOperacaoRepository,
        },
        {
          provide: RECEBIMENTO_ALOCACAO_REPOSITORY,
          useValue: recebimentoAlocacaoRepository,
        },
        {
          provide: CONFIGURACAO_OPERACIONAL_REPOSITORY,
          useValue: configuracaoOperacionalRepository,
        },
      ],
    }).compile();

    return moduleRef.get(GetRecursosRecebimentoSessaoUseCase);
  }

  function setupBaseMocks() {
    sessaoOperacaoRepository.findSessaoById.mockResolvedValue({
      id: sessaoId,
      unidadeId,
      status: 'aberta',
      totalFuncionarios: 1,
      inicioReal: new Date('2026-07-13T08:00:00.000Z'),
      inicioPlanejado: new Date('2026-07-13T08:00:00.000Z'),
    });
    sessaoOperacaoRepository.listSessaoFuncionarios.mockResolvedValue([
      {
        id: sessaoFuncionarioId,
        funcionarioId: 42,
        matricula: '001',
        nome: 'Conferente Teste',
        cargo: 'Conferente',
        status: 'presente',
        checkIn: new Date('2026-07-13T10:00:00.000Z'),
        checkOut: null,
        tipoVinculo: 'titular',
        equipeOrigemNome: 'Recebimento',
        apoioInicio: null,
      },
    ]);
    sessaoOperacaoRepository.listSessaoFuncionarioPausas.mockResolvedValue({
      emPausaAgora: null,
      items: [],
    });
    configuracaoOperacionalRepository.findRegrasPausaPadrao.mockResolvedValue(
      [],
    );
    recebimentoAlocacaoRepository.listUltimasMissoesFinalizadasPorSessao.mockResolvedValue(
      [],
    );
  }

  it('nao conta operador como ocioso quando demanda em_conferencia tem apenas conferente', async () => {
    setupBaseMocks();
    recebimentoAlocacaoRepository.listDemandasComAlocacao.mockResolvedValue([
      {
        preRecebimentoId,
        placa: 'ABC1D23',
        transportadoraNome: 'Transp',
        horarioPrevisto: new Date('2026-07-13T12:00:00.000Z'),
        skuCount: 10,
        dock: '01',
        situacao: 'em_conferencia',
        recebimentoId: 'rec-1',
        recebimentoDataInicio: new Date('2026-07-13T11:00:00.000Z'),
        alocacaoId: null,
        alocacaoStatus: null,
        alocacaoSessaoFuncionarioId: null,
        alocacaoFuncionarioId: null,
        alocacaoFuncionarioNome: null,
        alocacaoFuncionarioMatricula: null,
        alocacaoAtribuidoEm: null,
        conferenteId: 42,
        conferenteNome: 'Conferente Teste',
        empresas: ['LDB'],
        categorias: ['seco'],
      },
    ]);

    const useCase = await createUseCase();
    const result = await useCase.execute(sessaoId, unidadeId);

    expect(result.funcionarios).toHaveLength(1);
    expect(result.demandas[0]?.statusDemanda).toBe('em_conferencia');
    expect(result.demandas[0]?.empresas).toEqual(['LDB']);
    expect(result.demandas[0]?.categorias).toEqual(['seco']);

    const ociosos = result.kpis.find((kpi) => kpi.id === 'ociosos');
    const atuando = result.kpis.find((kpi) => kpi.id === 'atuando');

    expect(ociosos?.value).toBe('00');
    expect(atuando?.value).toBe('01');
  });

  it('conta operador como atuando quando demanda tem alocacao iniciada', async () => {
    setupBaseMocks();
    recebimentoAlocacaoRepository.listDemandasComAlocacao.mockResolvedValue([
      {
        preRecebimentoId,
        placa: 'XYZ9Z99',
        transportadoraNome: 'Transp',
        horarioPrevisto: new Date('2026-07-13T12:00:00.000Z'),
        skuCount: 5,
        dock: '02',
        situacao: 'em_conferencia',
        recebimentoId: 'rec-2',
        recebimentoDataInicio: new Date('2026-07-13T11:30:00.000Z'),
        alocacaoId: 'aloc-1',
        alocacaoStatus: 'iniciada',
        alocacaoSessaoFuncionarioId: sessaoFuncionarioId,
        alocacaoFuncionarioId: 42,
        alocacaoFuncionarioNome: 'Conferente Teste',
        alocacaoFuncionarioMatricula: '001',
        alocacaoAtribuidoEm: new Date('2026-07-13T11:00:00.000Z'),
        conferenteId: 42,
        conferenteNome: 'Conferente Teste',
        empresas: ['LDB'],
        categorias: ['seco'],
      },
    ]);

    const useCase = await createUseCase();
    const result = await useCase.execute(sessaoId, unidadeId);

    const ociosos = result.kpis.find((kpi) => kpi.id === 'ociosos');
    const atuando = result.kpis.find((kpi) => kpi.id === 'atuando');

    expect(ociosos?.value).toBe('00');
    expect(atuando?.value).toBe('01');
  });

  it('expoe ultima missao finalizada do funcionario na sessao', async () => {
    setupBaseMocks();
    recebimentoAlocacaoRepository.listDemandasComAlocacao.mockResolvedValue([]);
    recebimentoAlocacaoRepository.listUltimasMissoesFinalizadasPorSessao.mockResolvedValue(
      [
        {
          funcionarioId: 42,
          ultimaMissaoFinalizadaEm: new Date('2026-07-13T12:45:00.000Z'),
        },
      ],
    );

    const useCase = await createUseCase();
    const result = await useCase.execute(sessaoId, unidadeId);

    expect(result.funcionarios[0]?.ultimaMissaoFinalizadaEm).toBe(
      '2026-07-13T12:45:00.000Z',
    );
  });
});
