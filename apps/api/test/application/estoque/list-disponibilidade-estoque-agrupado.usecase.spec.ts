import { describe, expect, it, vi } from 'vitest';

import { ListDisponibilidadeEstoqueAgrupadoUseCase } from '../../../src/application/usecases/estoque/list-disponibilidade-estoque-agrupado.usecase.js';
import type { IEstoqueRepository } from '../../../src/domain/repositories/estoque/estoque.repository.js';

describe('ListDisponibilidadeEstoqueAgrupadoUseCase', () => {
  it('deve retornar itens agrupados com datas em ISO e summary', async () => {
    const updatedAt = new Date('2026-07-01T12:00:00.000Z');
    const validadeMaisProxima = new Date('2026-12-31T00:00:00.000Z');

    const estoqueRepository: Partial<IEstoqueRepository> = {
      listDisponibilidadeEstoqueAgrupado: vi.fn().mockResolvedValue({
        items: [
          {
            produtoId: 'SKU-001',
            produtoSku: 'SKU-001',
            produtoDescricao: 'Produto teste',
            produtoGrupo: 'GRP-01',
            lote: 'L001',
            unidadeMedida: 'UN',
            posicoes: 3,
            validadeMaisProxima,
            saldoFisico: 300,
            saldoBloqueado: 10,
            saldoDebito: 0,
            saldoReservado: 20,
            saldoDisponivel: 280,
            pesoLiquidoTotalKg: 150.5,
            vencimentoProximo: false,
            updatedAt,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        summary: {
          saldoFisico: 300,
          saldoBloqueado: 10,
          saldoDebito: 0,
          saldoReservado: 20,
          saldoDisponivel: 280,
          pesoLiquidoTotalKg: 150.5,
        },
      }),
    };

    const useCase = new ListDisponibilidadeEstoqueAgrupadoUseCase(
      estoqueRepository as IEstoqueRepository,
    );

    const result = await useCase.execute({ unidadeId: 'unidade-1' });

    expect(
      estoqueRepository.listDisponibilidadeEstoqueAgrupado,
    ).toHaveBeenCalledWith({
      unidadeId: 'unidade-1',
    });
    expect(result.items[0]?.validadeMaisProxima).toBe(
      validadeMaisProxima.toISOString(),
    );
    expect(result.items[0]?.updatedAt).toBe(updatedAt.toISOString());
    expect(result.items[0]?.posicoes).toBe(3);
    expect(result.summary.saldoDisponivel).toBe(280);
  });

  it('deve retornar lista vazia quando não houver saldos agrupados', async () => {
    const estoqueRepository: Partial<IEstoqueRepository> = {
      listDisponibilidadeEstoqueAgrupado: vi.fn().mockResolvedValue({
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

    const useCase = new ListDisponibilidadeEstoqueAgrupadoUseCase(
      estoqueRepository as IEstoqueRepository,
    );

    const result = await useCase.execute({ unidadeId: 'unidade-1' });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});
