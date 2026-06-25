import { describe, expect, it } from 'vitest';



import { ordenarItensPickway } from '../../../src/application/services/expedicao/ordenar-itens-pickway.js';



describe('ordenarItensPickway', () => {

  it('ordena por slottingOrdem de produto_enderecos', () => {

    const itens = ordenarItensPickway([

      {

        sku: 'SKU-C',

        endereco: 'B 0002 002 02',

        slottingOrdem: 3,

        zona: 'B',

        rua: '2',

        posicao: '2',

        nivel: '2',

      },

      {

        sku: 'SKU-A',

        endereco: 'A 0001 001 01',

        slottingOrdem: 1,

        zona: 'A',

        rua: '1',

        posicao: '1',

        nivel: '1',

      },

      {

        sku: 'SKU-B',

        endereco: 'A 0002 001 01',

        slottingOrdem: 2,

        zona: 'A',

        rua: '2',

        posicao: '1',

        nivel: '1',

      },

    ]);



    expect(itens.map((item) => item.sku)).toEqual(['SKU-A', 'SKU-B', 'SKU-C']);

  });



  it('usa zona, rua, posicao e nivel quando slottingOrdem e igual', () => {

    const itens = ordenarItensPickway([

      { sku: 'SKU-C', endereco: 'B 0002 002 02', slottingOrdem: 1, zona: 'B', rua: '2', posicao: '2', nivel: '2' },

      { sku: 'SKU-A', endereco: 'A 0001 001 01', slottingOrdem: 1, zona: 'A', rua: '1', posicao: '1', nivel: '1' },

      { sku: 'SKU-B', endereco: 'A 0002 001 01', slottingOrdem: 1, zona: 'A', rua: '2', posicao: '1', nivel: '1' },

    ]);



    expect(itens.map((item) => item.sku)).toEqual(['SKU-A', 'SKU-B', 'SKU-C']);

  });



  it('coloca itens sem endereco apos os enderecados', () => {

    const itens = ordenarItensPickway([

      { sku: 'SKU-SEM' },

      { sku: 'SKU-COM', endereco: 'A 0001 001 01', slottingOrdem: 1, zona: 'A', rua: '1', posicao: '1', nivel: '1' },

    ]);



    expect(itens.map((item) => item.sku)).toEqual(['SKU-COM', 'SKU-SEM']);

  });



  it('usa sku como desempate', () => {

    const itens = ordenarItensPickway([

      { sku: 'SKU-B', endereco: 'A 0001 001 01', slottingOrdem: 1, zona: 'A', rua: '1', posicao: '1', nivel: '1' },

      { sku: 'SKU-A', endereco: 'A 0001 001 01', slottingOrdem: 1, zona: 'A', rua: '1', posicao: '1', nivel: '1' },

    ]);



    expect(itens.map((item) => item.sku)).toEqual(['SKU-A', 'SKU-B']);

  });

});


