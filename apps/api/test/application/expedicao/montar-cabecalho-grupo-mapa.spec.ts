import { describe, expect, it, vi } from 'vitest';

import { montarCabecalhoGrupo } from '../../../src/application/services/expedicao/montar-cabecalho-grupo-mapa.js';
import type { TransporteMetaMapa } from '../../../src/application/services/expedicao/montar-cabecalho-grupo-mapa.js';

vi.mock('nanoid', () => ({
  nanoid: () => 'V1StGXR8_Z5jdHi6B-myT',
}));

const transportesPorId = new Map<string, TransporteMetaMapa>([
  [
    'transporte-1',
    {
      id: 'transporte-1',
      rota: 'Rota A',
      placa: 'ABC-1234',
      transportadora: 'TransLog',
    },
  ],
]);

const blocoBase = {
  titulo: 'Rota A',
  empresa: 'Empresa X',
  categoria: 'seco',
  linhas: [
    {
      transporteId: 'transporte-1',
      transporteRota: 'Rota A',
      codCliente: 'C001',
      cliente: 'Cliente A',
    },
    {
      transporteId: 'transporte-1',
      transporteRota: 'Rota A',
      codCliente: 'C002',
      cliente: 'Cliente B',
    },
  ],
};

const itensBase = [
  {
    sku: 'SKU001',
    remessa: '1001',
    cliente: 'Cliente A',
    codCliente: 'C001',
    empresa: 'Empresa X',
    categoria: 'seco',
    lote: 'L001',
    dataFabricacao: '2026-01-01',
    faixa: 'verde',
    quantidade: 120,
    unidadeMedida: 'UN',
    quantidadeNormalizadaUnidades: 120,
    peso: 120,
    breakdown: {
      paletes: 1,
      caixas: 0,
      unidades: 0,
      pesoPaletes: 120,
      pesoCaixas: null,
      pesoUnidades: null,
    },
  },
  {
    sku: 'SKU002',
    remessa: '1002',
    cliente: 'Cliente B',
    codCliente: 'C002',
    empresa: 'Empresa X',
    categoria: 'seco',
    lote: null,
    dataFabricacao: null,
    faixa: null,
    quantidade: 24,
    unidadeMedida: 'UN',
    quantidadeNormalizadaUnidades: 24,
    peso: 12,
    breakdown: {
      paletes: 0,
      caixas: 2,
      unidades: 0,
      pesoPaletes: null,
      pesoCaixas: 12,
      pesoUnidades: null,
    },
  },
];

describe('montarCabecalhoGrupo', () => {
  it('monta cabecalho com transporte, placa e clientes ordenados', () => {
    const cabecalho = montarCabecalhoGrupo(
      blocoBase,
      itensBase,
      'Rota A',
      transportesPorId,
    );

    expect(cabecalho.transporte).toBe('Rota A');
    expect(cabecalho.placa).toBe('ABC-1234');
    expect(cabecalho.transportadora).toBe('TransLog');
    expect(cabecalho.codPrimeiroCliente).toBe('C001');
    expect(cabecalho.primeiroCliente).toBe('Cliente A');
    expect(cabecalho.codTodosClientes).toBe('C001 · C002');
    expect(cabecalho.todosClientes).toBe('Cliente A · Cliente B');
    expect(cabecalho.nomeGrupo).toBe('Rota A');
    expect(cabecalho.empresa).toBe('Empresa X');
    expect(cabecalho.categoria).toBe('seco');
  });

  it('soma totais de breakdown dos itens', () => {
    const cabecalho = montarCabecalhoGrupo(
      blocoBase,
      itensBase,
      'Rota A',
      transportesPorId,
    );

    expect(cabecalho.pesoTotal).toBe(132);
    expect(cabecalho.totalPaletes).toBe(1);
    expect(cabecalho.totalCaixas).toBe(2);
    expect(cabecalho.totalUnidades).toBe(0);
    expect(cabecalho.quantidadeLinhas).toBe(2);
  });

  it('gera microUuid no formato transporte-nanoid', () => {
    const cabecalho = montarCabecalhoGrupo(
      blocoBase,
      itensBase,
      'Rota A',
      transportesPorId,
    );

    expect(cabecalho.microUuid).toBe('Rota-A-V1StGXR8_Z5jdHi6B-myT');
  });
});
