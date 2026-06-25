import { describe, expect, it, vi } from 'vitest';

import { listRemessaItensByRemessaIdsDb } from '../../../src/infra/db/expedicao/list-remessa-itens-by-remessa-ids.drizzle.js';

describe('listRemessaItensByRemessaIdsDb', () => {
  it('retorna array vazio quando nao ha remessa ids', async () => {
    const db = { select: vi.fn() } as never;

    const result = await listRemessaItensByRemessaIdsDb(db, []);

    expect(result).toEqual([]);
    expect(db.select).not.toHaveBeenCalled();
  });

  it('usa coalesce de descricao e produtoCodigo por sku ou produto_id', async () => {
    const orderBy = vi.fn().mockResolvedValue([
      {
        id: 'item-1',
        remessaId: 'remessa-1',
        sku: 'PROD-001',
        produtoId: null,
        produtoIdResolvido: 'prod-resolvido-1',
        produtoCodigo: 'PROD-001',
        lote: null,
        dataFabricacao: null,
        faixa: null,
        peso: '10',
        quantidade: '1',
        unidadeMedida: 'UN',
        quantidadeNormalizadaUnidades: '1',
        empresaProduto: 'LDB',
        categoriaProduto: 'seco',
        unidadesPorCaixa: 12,
        caixasPorPalete: 10,
        pesoBrutoUnidade: '0.5',
        pesoBrutoCaixa: '6',
        pesoBrutoPalete: '120',
        pesoLiquidoUnidade: null,
        pesoLiquidoCaixa: null,
        pesoLiquidoPalete: null,
        descricaoProduto: 'Descricao via produto_id',
      },
    ]);

    const where = vi.fn().mockReturnValue({ orderBy });
    const leftJoinUuid = vi.fn().mockReturnValue({ where });
    const leftJoinCodigo = vi.fn().mockReturnValue({ leftJoin: leftJoinUuid });
    const leftJoinSku = vi.fn().mockReturnValue({ leftJoin: leftJoinCodigo });
    const leftJoinId = vi.fn().mockReturnValue({ leftJoin: leftJoinSku });
    const from = vi.fn().mockReturnValue({ leftJoin: leftJoinId });
    const select = vi.fn().mockReturnValue({ from });

    const db = { select } as never;

    const result = await listRemessaItensByRemessaIdsDb(db, ['remessa-1']);

    expect(result).toHaveLength(1);
    expect(result[0]?.descricaoProduto).toBe('Descricao via produto_id');
    expect(result[0]?.produtoId).toBeNull();
    expect(result[0]?.produtoIdResolvido).toBe('prod-resolvido-1');
    expect(result[0]?.produtoCodigo).toBe('PROD-001');
    expect(leftJoinId).toHaveBeenCalledTimes(1);
    expect(leftJoinSku).toHaveBeenCalledTimes(1);
    expect(leftJoinCodigo).toHaveBeenCalledTimes(1);
    expect(leftJoinUuid).toHaveBeenCalledTimes(1);
  });
});
