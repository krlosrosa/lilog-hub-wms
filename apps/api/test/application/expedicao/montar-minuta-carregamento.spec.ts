import { describe, expect, it } from 'vitest';

import { montarMinutaCarregamento } from '../../../src/application/services/expedicao/montar-minuta-carregamento.js';
import type { TransporteParaMapa } from '../../../src/application/services/expedicao/montar-grupos-mapa.js';

function criarItem(
  overrides: Partial<TransporteParaMapa['remessas'][number]['itens'][number]> = {},
): TransporteParaMapa['remessas'][number]['itens'][number] {
  return {
    id: 'item-1',
    remessaId: 'remessa-1',
    numeroRemessa: '1001',
    codCliente: 'C001',
    cliente: 'Cliente A',
    cidade: 'Fortaleza-CE',
    sku: 'SKU-001',
    descricao: 'Produto A',
    produtoId: null,
    empresa: 'Nestlé',
    categoria: 'Bebidas',
    lote: null,
    dataFabricacao: null,
    faixa: null,
    peso: 10,
    quantidade: 24,
    unidadeMedida: 'UN',
    quantidadeNormalizadaUnidades: 24,
    unidadesPorCaixa: 12,
    caixasPorPalete: 4,
    pesoBrutoUnidade: '1',
    pesoBrutoCaixa: '12',
    pesoBrutoPalete: '48',
    pesoLiquidoUnidade: null,
    pesoLiquidoCaixa: null,
    pesoLiquidoPalete: null,
    ...overrides,
  };
}

function criarTransporte(
  overrides: Partial<TransporteParaMapa> = {},
): TransporteParaMapa {
  return {
    id: 'transporte-1',
    rota: 'Rota A',
    cidade: 'Fortaleza',
    bairro: 'Centro',
    placa: 'ABC-1234',
    transportadora: 'TransLog',
    remessas: [
      {
        id: 'remessa-1',
        remessa: '1001',
        codCliente: 'C001',
        cliente: 'Cliente A',
        cidade: 'Fortaleza-CE',
        peso: 120,
        volume: 1.5,
        itens: [criarItem()],
      },
    ],
    ...overrides,
  };
}

describe('montarMinutaCarregamento', () => {
  it('monta minuta por transporte com tabelas empresa e clientes', () => {
    const transporte = criarTransporte({
      remessas: [
        {
          id: 'remessa-1',
          remessa: '1001',
          codCliente: 'C001',
          cliente: 'Cliente A',
          cidade: 'Fortaleza-CE',
          peso: 120,
          volume: 1.5,
          itens: [
            criarItem({ empresa: 'Nestlé', categoria: 'Bebidas' }),
            criarItem({
              id: 'item-2',
              sku: 'SKU-002',
              empresa: 'Unilever',
              categoria: 'Higiene',
            }),
          ],
        },
        {
          id: 'remessa-2',
          remessa: '1002',
          codCliente: 'C002',
          cliente: 'Cliente B',
          cidade: 'Caucaia-CE',
          peso: 80,
          volume: 2,
          itens: [
            criarItem({
              id: 'item-3',
              remessaId: 'remessa-2',
              codCliente: 'C002',
              cliente: 'Cliente B',
              empresa: 'Nestlé',
              categoria: 'Alimentos',
            }),
          ],
        },
      ],
    });

    const resultado = montarMinutaCarregamento([transporte]);

    expect(resultado.totalMinutas).toBe(1);
    expect(resultado.minutas).toHaveLength(1);
    expect(resultado.minutas[0]?.tabelaEmpresa).toHaveLength(3);
    expect(resultado.minutas[0]?.tabelaClientes).toHaveLength(2);
    expect(resultado.minutas[0]?.tabelaClientes[0]?.volumeM3).toBe(1.5);
    expect(resultado.minutas[0]?.tabelaClientes[1]?.volumeM3).toBe(2);
    expect(resultado.minutas[0]?.totais.volumeM3).toBe(3.5);
  });

  it('separa categorias da mesma empresa', () => {
    const transporte = criarTransporte({
      remessas: [
        {
          id: 'remessa-1',
          remessa: '1001',
          codCliente: 'C001',
          cliente: 'Cliente A',
          cidade: 'Fortaleza-CE',
          peso: 50,
          volume: 1,
          itens: [
            criarItem({ empresa: 'Nestlé', categoria: 'Bebidas' }),
            criarItem({
              id: 'item-2',
              empresa: 'Nestlé',
              categoria: 'Alimentos',
            }),
          ],
        },
      ],
    });

    const resultado = montarMinutaCarregamento([transporte]);

    expect(resultado.minutas[0]?.tabelaEmpresa).toHaveLength(2);
    expect(
      resultado.minutas[0]?.tabelaEmpresa.map((linha) => linha.categoria),
    ).toEqual(expect.arrayContaining(['Bebidas', 'Alimentos']));
  });

  it('retorna minuta vazia para transporte sem remessas/itens', () => {
    const transporte = criarTransporte({ remessas: [] });
    const resultado = montarMinutaCarregamento([transporte]);

    expect(resultado.minutas[0]?.tabelaEmpresa).toEqual([]);
    expect(resultado.minutas[0]?.tabelaClientes).toEqual([]);
    expect(resultado.minutas[0]?.totais.pesoKg).toBe(0);
  });

  it('usa peso da remessa na tabela de clientes', () => {
    const transporte = criarTransporte();
    const resultado = montarMinutaCarregamento([transporte]);

    expect(resultado.minutas[0]?.tabelaClientes[0]?.pesoKg).toBe(120);
  });
});
