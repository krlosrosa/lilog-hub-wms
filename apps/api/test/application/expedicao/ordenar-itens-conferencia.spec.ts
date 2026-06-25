import { describe, expect, it } from 'vitest';

import { ordenarItensConferencia } from '../../../src/application/services/expedicao/ordenar-itens-conferencia.js';

describe('ordenarItensConferencia', () => {
  const itens = [
    { sku: 'SKU-B', endereco: 'B 0002 002 02', zona: 'B', rua: '2', posicao: '2', nivel: '2' },
    { sku: 'SKU-A', endereco: 'A 0001 001 01', zona: 'A', rua: '1', posicao: '1', nivel: '1' },
  ];

  it('ordena por sku quando classificarPor e sku', () => {
    const ordenados = ordenarItensConferencia(itens, {
      classificarPor: 'sku',
      agrupamento: 'replicar_separacao',
    });

    expect(ordenados.map((item) => item.sku)).toEqual(['SKU-A', 'SKU-B']);
  });

  it('ordena por pickway quando classificarPor e pickway', () => {
    const ordenados = ordenarItensConferencia(
      [...itens].reverse(),
      {
        classificarPor: 'pickway',
        agrupamento: 'replicar_separacao',
      },
    );

    expect(ordenados.map((item) => item.sku)).toEqual(['SKU-A', 'SKU-B']);
  });
});
