import { beforeEach, describe, expect, it, vi } from 'vitest';

import { reconciliarDivergenciaRecontagem } from '../../../src/application/services/inventario/reconciliar-divergencia-recontagem.js';
import type { IEstoqueRepository } from '../../../src/domain/repositories/estoque/estoque.repository.js';
import type {
  ContagemRecord,
  IInventarioRepository,
} from '../../../src/domain/repositories/inventario/inventario.repository.js';

const divergenciaBase = {
  id: 'div-1',
  inventarioId: 'inv-1',
  contagemId: 'cont-old',
  enderecoId: 'end-1',
  enderecoMascarado: 'CD01-ZNA-R01-BL01-NV01-AP01',
  zona: 'CORREDOR A',
  saldoEnderecoId: 'saldo-1',
  depositoId: 'dep-1',
  produtoId: 'prod-1',
  sku: 'SKU-001',
  produtoNome: 'Produto teste',
  quantidadeEsperada: 10,
  quantidadeContada: 8,
  delta: -2,
  unidadeMedida: 'UN',
  lote: 'L1',
  tipo: 'falta' as const,
  status: 'pendente' as const,
  aprovadaPor: null,
  aprovadaEm: null,
  motivoAprovacao: null,
  reprovadaPor: null,
  reprovadaEm: null,
  motivoReprovacao: null,
  documentoRef: 'doc-ref-old',
  createdAt: new Date(),
  updatedAt: new Date(),
  recontagemAtual: null,
};

const contagemBase: ContagemRecord = {
  id: 'cont-new',
  demandaEnderecoId: 'de-1',
  tipo: 'validacao',
  operatorId: 10,
  codigoProduto: 'SKU-001',
  produtoId: 'prod-1',
  saldoEnderecoId: 'saldo-1',
  quantidadeCaixas: 0,
  quantidadeUnidades: 10,
  lote: 'L1',
  peso: null,
  enderecoConfirmado: null,
  sscc: null,
  enderecoVazio: false,
  anomaliaEncontrada: false,
  correspondeAoEsperado: true,
  createdAt: new Date(),
};

describe('reconciliarDivergenciaRecontagem', () => {
  let inventarioRepository: Partial<IInventarioRepository>;
  let estoqueRepository: Partial<IEstoqueRepository>;

  beforeEach(() => {
    inventarioRepository = {
      findRecontagemAbertaByDemanda: vi.fn().mockResolvedValue({
        id: 'rec-1',
        inventarioId: 'inv-1',
        divergenciaId: 'div-1',
        demandaId: 'dem-1',
        solicitadaPor: 1,
        responsavelId: 10,
        motivo: 'Conferir novamente',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      findDivergenciaById: vi.fn().mockResolvedValue(divergenciaBase),
      updateDivergenciaContagem: vi.fn().mockResolvedValue(undefined),
      concluirDemandaContagemSeCompleta: vi.fn().mockResolvedValue(undefined),
    };

    estoqueRepository = {
      listSaldosEndereco: vi.fn().mockResolvedValue([
        {
          id: 'saldo-1',
          unidadeId: 'unidade-1',
          produtoId: 'prod-1',
          depositoId: 'dep-1',
          enderecoId: 'end-1',
          produtoSku: 'SKU-001',
          produtoNome: 'Produto teste',
          quantidade: 10,
          unidadeMedida: 'UN',
          lote: 'L1',
          unidadesPorCaixa: 1,
        },
      ]),
    };
  });

  it('updates divergencia with latest recontagem values', async () => {
    await reconciliarDivergenciaRecontagem(
      inventarioRepository as IInventarioRepository,
      estoqueRepository as IEstoqueRepository,
      'dem-1',
      contagemBase,
      'end-1',
      'unidade-1',
    );

    expect(inventarioRepository.updateDivergenciaContagem).toHaveBeenCalledWith(
      'div-1',
      expect.objectContaining({
        contagemId: 'cont-new',
        quantidadeEsperada: 10,
        quantidadeContada: 10,
        delta: 0,
        tipo: 'falta',
        documentoRef: 'inventario-inv-1-contagem-cont-new',
      }),
    );
    expect(
      inventarioRepository.concluirDemandaContagemSeCompleta,
    ).toHaveBeenCalledWith('dem-1');
  });

  it('updates divergencia when recontagem still diverges', async () => {
    await reconciliarDivergenciaRecontagem(
      inventarioRepository as IInventarioRepository,
      estoqueRepository as IEstoqueRepository,
      'dem-1',
      {
        ...contagemBase,
        quantidadeUnidades: 7,
        correspondeAoEsperado: false,
      },
      'end-1',
      'unidade-1',
    );

    expect(inventarioRepository.updateDivergenciaContagem).toHaveBeenCalledWith(
      'div-1',
      expect.objectContaining({
        quantidadeContada: 7,
        delta: -3,
        tipo: 'falta',
      }),
    );
  });

  it('does nothing when demanda is not a recontagem', async () => {
    vi.mocked(inventarioRepository.findRecontagemAbertaByDemanda!).mockResolvedValue(
      null,
    );

    await reconciliarDivergenciaRecontagem(
      inventarioRepository as IInventarioRepository,
      estoqueRepository as IEstoqueRepository,
      'dem-regular',
      contagemBase,
      'end-1',
      'unidade-1',
    );

    expect(inventarioRepository.updateDivergenciaContagem).not.toHaveBeenCalled();
    expect(
      inventarioRepository.concluirDemandaContagemSeCompleta,
    ).not.toHaveBeenCalled();
  });

  it('does nothing when divergencia is no longer pending', async () => {
    vi.mocked(inventarioRepository.findDivergenciaById!).mockResolvedValue({
      ...divergenciaBase,
      status: 'aprovada',
    });

    await reconciliarDivergenciaRecontagem(
      inventarioRepository as IInventarioRepository,
      estoqueRepository as IEstoqueRepository,
      'dem-1',
      contagemBase,
      'end-1',
      'unidade-1',
    );

    expect(inventarioRepository.updateDivergenciaContagem).not.toHaveBeenCalled();
  });
});
