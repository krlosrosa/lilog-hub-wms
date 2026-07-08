import { describe, expect, it } from 'vitest';

import {
  coletarProdutoIdsParaSlotting,
  montarMapaEnderecoPorProdutoCodigo,
  resolverEnderecoItemMapa,
  resolverEnderecoProdutoSlotting,
} from '../../../src/application/services/expedicao/resolver-endereco-produto-slotting.js';
import type { ProdutoEnderecoSlottingRow } from '../../../src/infra/db/produto-endereco/list-produto-enderecos-by-produto-ids.drizzle.js';

function criarRow(
  overrides: Partial<ProdutoEnderecoSlottingRow> &
    Pick<ProdutoEnderecoSlottingRow, 'produtoCodigo' | 'papel' | 'ordem'>,
): ProdutoEnderecoSlottingRow {
  return {
    produtoId: overrides.produtoCodigo ?? 'PROD-1',
    produtoSku: overrides.produtoCodigo ?? 'PROD-1',
    enderecoId: 'endereco-1',
    enderecoMascarado: 'A 0001 001 01',
    zona: 'A',
    rua: '1',
    posicao: '1',
    nivel: '1',
    prioridadePicking: 10,
    ativo: true,
    ...overrides,
  };
}

describe('coletarProdutoIdsParaSlotting', () => {
  it('coleta produtoId resolvido, codigo e sku', () => {
    expect(
      coletarProdutoIdsParaSlotting({
        produtoId: null,
        produtoIdResolvido: 'PROD-1',
        produtoCodigo: 'PROD-1',
        sku: 'SKU-1',
      }),
    ).toEqual(['PROD-1', 'SKU-1']);
  });
});

describe('resolverEnderecoProdutoSlotting', () => {
  it('prioriza picking_primario sobre secundario e pulmao', () => {
    const resultado = resolverEnderecoProdutoSlotting([
      criarRow({
        produtoCodigo: 'PROD-1',
        papel: 'pulmao',
        ordem: 1,
        enderecoMascarado: 'B 0002 002 02',
      }),
      criarRow({
        produtoCodigo: 'PROD-1',
        papel: 'picking_secundario',
        ordem: 1,
        enderecoMascarado: 'C 0003 003 03',
      }),
      criarRow({
        produtoCodigo: 'PROD-1',
        papel: 'picking_primario',
        ordem: 2,
        enderecoMascarado: 'A 0001 001 01',
      }),
    ]);

    expect(resultado?.endereco).toBe('A 0001 001 01');
    expect(resultado?.slottingPapel).toBe('picking_primario');
  });
});

describe('montarMapaEnderecoPorProdutoCodigo', () => {
  it('monta mapa por produtoId, produtoCodigo e sku', () => {
    const mapa = montarMapaEnderecoPorProdutoCodigo([
      criarRow({
        produtoId: 'PROD-1',
        produtoCodigo: 'PROD-1',
        produtoSku: 'SKU-1',
        papel: 'picking_primario',
        ordem: 1,
      }),
    ]);

    expect(mapa.get('PROD-1')?.endereco).toBe('A 0001 001 01');
    expect(mapa.get('SKU-1')?.endereco).toBe('A 0001 001 01');
  });
});

describe('resolverEnderecoItemMapa', () => {
  it('resolve endereco pelo produtoId', () => {
    const enderecoPorProdutoCodigo = montarMapaEnderecoPorProdutoCodigo([
      criarRow({
        produtoId: 'PROD-1',
        produtoCodigo: 'PROD-1',
        produtoSku: 'SKU-1',
        papel: 'picking_primario',
        ordem: 1,
      }),
    ]);

    expect(
      resolverEnderecoItemMapa({
        produtoId: 'PROD-1',
        produtoCodigo: 'PROD-1',
        sku: 'SKU-1',
        enderecoPorProdutoCodigo,
      })?.endereco,
    ).toBe('A 0001 001 01');
  });

  it('resolve endereco pelo sku quando produtoId difere', () => {
    const enderecoPorProdutoCodigo = montarMapaEnderecoPorProdutoCodigo([
      criarRow({
        produtoId: 'PROD-1',
        produtoCodigo: 'PROD-1',
        produtoSku: 'SKU-1',
        papel: 'picking_primario',
        ordem: 1,
      }),
    ]);

    expect(
      resolverEnderecoItemMapa({
        produtoId: null,
        produtoCodigo: 'OUTRO',
        sku: 'SKU-1',
        enderecoPorProdutoCodigo,
      })?.endereco,
    ).toBe('A 0001 001 01');
  });
});

describe('resolverEnderecoProdutoSlotting ativo', () => {
  it('prioriza alocacao ativa sobre inativa', () => {
    const resultado = resolverEnderecoProdutoSlotting([
      criarRow({
        produtoCodigo: 'PROD-1',
        papel: 'picking_primario',
        ordem: 1,
        ativo: false,
        enderecoMascarado: 'B 0002 002 02',
      }),
      criarRow({
        produtoCodigo: 'PROD-1',
        papel: 'picking_secundario',
        ordem: 2,
        ativo: true,
        enderecoMascarado: 'A 0001 001 01',
      }),
    ]);

    expect(resultado?.endereco).toBe('A 0001 001 01');
  });
});
