import { describe, expect, it, vi } from 'vitest';

import { ListDisponibilidadeEstoqueUseCase } from '../../../src/application/usecases/estoque/list-disponibilidade-estoque.usecase.js';
import type { IEstoqueRepository } from '../../../src/domain/repositories/estoque/estoque.repository.js';

describe('ListDisponibilidadeEstoqueUseCase', () => {
  it('deve retornar itens com datas em ISO e summary', async () => {
    const updatedAt = new Date('2026-07-01T12:00:00.000Z');
    const validade = new Date('2026-12-31T00:00:00.000Z');

    const estoqueRepository: Partial<IEstoqueRepository> = {
      listDisponibilidadeEstoque: vi.fn().mockResolvedValue({
        items: [
          {
            produtoId: 'SKU-001',
            produtoSku: 'SKU-001',
            produtoDescricao: 'Produto teste',
            produtoGrupo: 'GRP-01',
            depositoId: 'dep-1',
            depositoCodigo: 'GERAL',
            depositoNome: 'Geral',
            enderecoId: 'end-1',
            enderecoMascarado: 'A-01-01-01',
            lote: 'L001',
            numeroSerie: '',
            validade,
            unidadeMedida: 'UN',
            saldoFisico: 100,
            saldoBloqueado: 10,
            saldoDebito: 0,
            saldoReservado: 20,
            saldoDisponivel: 80,
            pesoLiquidoTotalKg: 50.5,
            vencimentoProximo: false,
            updatedAt,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        summary: {
          saldoFisico: 100,
          saldoBloqueado: 10,
          saldoDebito: 0,
          saldoReservado: 20,
          saldoDisponivel: 80,
          pesoLiquidoTotalKg: 50.5,
        },
      }),
    };

    const useCase = new ListDisponibilidadeEstoqueUseCase(
      estoqueRepository as IEstoqueRepository,
    );

    const result = await useCase.execute({ unidadeId: 'unidade-1' });

    expect(estoqueRepository.listDisponibilidadeEstoque).toHaveBeenCalledWith({
      unidadeId: 'unidade-1',
    });
    expect(result.items[0]?.validade).toBe(validade.toISOString());
    expect(result.items[0]?.updatedAt).toBe(updatedAt.toISOString());
    expect(result.summary.saldoDisponivel).toBe(80);
  });

  it('deve retornar lista vazia quando não houver saldos', async () => {
    const estoqueRepository: Partial<IEstoqueRepository> = {
      listDisponibilidadeEstoque: vi.fn().mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        summary: {
          saldoFisico: 0,
          saldoBloqueado: 0,
          saldoDebito: 0,
          saldoReservado: 0,
          saldoDisponivel: 0,
          pesoLiquidoTotalKg: 0,
        },
      }),
    };

    const useCase = new ListDisponibilidadeEstoqueUseCase(
      estoqueRepository as IEstoqueRepository,
    );

    const result = await useCase.execute({ unidadeId: 'unidade-1' });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});
