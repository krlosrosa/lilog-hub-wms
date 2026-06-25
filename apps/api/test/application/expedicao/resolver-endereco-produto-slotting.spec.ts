import { describe, expect, it } from 'vitest';

import {
  coletarProdutoUuidsParaSlotting,
  isProdutoUuid,
  montarMapaEnderecoPorProdutoCodigo,
  resolverEnderecoItemMapa,
  resolverEnderecoProdutoSlotting,
} from '../../../src/application/services/expedicao/resolver-endereco-produto-slotting.js';
import type { ProdutoEnderecoSlottingRow } from '../../../src/infra/db/produto-endereco/list-produto-enderecos-by-produto-ids.drizzle.js';

const PRODUTO_UUID = 'c290e8e6-9dd5-43cb-84eb-a432c3d62682';

function criarRow(
  overrides: Partial<ProdutoEnderecoSlottingRow> &
    Pick<ProdutoEnderecoSlottingRow, 'produtoCodigo' | 'papel' | 'ordem'>,
): ProdutoEnderecoSlottingRow {
  return {
    produtoUuid: PRODUTO_UUID,
    produtoSku: overrides.produtoCodigo,
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

describe('isProdutoUuid', () => {
  it('identifica uuid valido', () => {
    expect(isProdutoUuid(PRODUTO_UUID)).toBe(true);
    expect(isProdutoUuid('PROD-1')).toBe(false);
  });
});

describe('coletarProdutoUuidsParaSlotting', () => {
  it('coleta uuid da remessa, produto resolvido, codigo e sku', () => {
    expect(
      coletarProdutoUuidsParaSlotting({
        produtoId: null,
        produtoIdResolvido: PRODUTO_UUID,
        produtoCodigo: PRODUTO_UUID,
        sku: PRODUTO_UUID,
      }),
    ).toEqual([PRODUTO_UUID.toLowerCase()]);
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
  it('monta mapa por uuid, produtoCodigo e sku', () => {
    const mapa = montarMapaEnderecoPorProdutoCodigo([
      criarRow({
        produtoUuid: PRODUTO_UUID,
        produtoCodigo: 'PROD-1',
        produtoSku: PRODUTO_UUID,
        papel: 'picking_primario',
        ordem: 1,
      }),
    ]);

    expect(mapa.get(PRODUTO_UUID)?.endereco).toBe('A 0001 001 01');
    expect(mapa.get('PROD-1')?.endereco).toBe('A 0001 001 01');
  });
});

describe('resolverEnderecoItemMapa', () => {
  it('resolve endereco pelo uuid do produto', () => {
    const enderecoPorProdutoCodigo = montarMapaEnderecoPorProdutoCodigo([
      criarRow({
        produtoUuid: PRODUTO_UUID,
        produtoCodigo: 'PROD-1',
        produtoSku: PRODUTO_UUID,
        papel: 'picking_primario',
        ordem: 1,
      }),
    ]);

    expect(
      resolverEnderecoItemMapa({
        produtoUuid: PRODUTO_UUID,
        produtoCodigo: 'PROD-1',
        sku: PRODUTO_UUID,
        enderecoPorProdutoCodigo,
      })?.endereco,
    ).toBe('A 0001 001 01');
  });

  it('resolve endereco mesmo com uuid em caixa diferente', () => {
    const enderecoPorProdutoCodigo = montarMapaEnderecoPorProdutoCodigo([
      criarRow({
        produtoUuid: PRODUTO_UUID,
        produtoCodigo: 'PROD-1',
        produtoSku: PRODUTO_UUID,
        papel: 'picking_primario',
        ordem: 1,
      }),
    ]);

    expect(
      resolverEnderecoItemMapa({
        produtoUuid: PRODUTO_UUID.toUpperCase(),
        produtoCodigo: 'PROD-1',
        sku: PRODUTO_UUID.toUpperCase(),
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
