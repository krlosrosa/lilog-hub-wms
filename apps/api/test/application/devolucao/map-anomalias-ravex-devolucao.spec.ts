import { describe, expect, it } from 'vitest';



import {

  buildCodigoDemandaViagemRavex,

  buildDestinatarioPorNfIdFromEntregas,

  enrichNotasFiscaisComProdutos,

  mapAnomaliasToNotasFiscais,

  mapTipoRetornoRavex,

  normalizarQuantidadesNotasFiscais,

} from '../../../src/application/services/devolucao/map-anomalias-ravex-devolucao.js';

import type { ProdutoRecord } from '../../../src/domain/repositories/produto/produto.repository.js';

import type { RavexAnomaliaViagem } from '../../../src/infra/clients/ravex/ravex-viagem.types.js';



const transporteId = '00000000-0000-4000-8000-000000000001';



describe('map-anomalias-ravex-devolucao', () => {

  it('mapeia tipoRetorno conforme contrato Ravex', () => {

    expect(mapTipoRetornoRavex(1)).toBe('devolucao_total');

    expect(mapTipoRetornoRavex(2)).toBe('devolucao_parcial');

    expect(mapTipoRetornoRavex(3)).toBe('reentrega');

    expect(mapTipoRetornoRavex(undefined)).toBe('devolucao_parcial');

  });



  it('monta codigoDemanda idempotente por viagem', () => {

    expect(buildCodigoDemandaViagemRavex(19356221)).toBe('RVX-19356221');

  });



  it('enriquece NF com codCliente e cliente via entregas Ravex', () => {
    const anomalias: RavexAnomaliaViagem[] = [
      {
        anomaliaId: 1,
        tipoRetorno: 3,
        notaFiscalId: 338462113,
        numeroNotaFiscal: '307953',
        motivo: { descricao: 'Reentrega' },
        item: {
          codigo: 'SKU-001',
          itemId: 10,
          quantidadeDevolvida: 2,
        },
      },
    ];

    const destinatarioPorNfId = buildDestinatarioPorNfIdFromEntregas([
      {
        id: 140919804,
        destinatario: {
          id: 577656,
          codigo: '5000954',
          nome: 'SUPERMERCADOS VIANENSE LTDA',
          municipio: 'Nova Iguaçu',
          uf: 'RJ',
        },
        notasFiscais: [{ id: 338462113, numero: '307953' }],
      },
    ]);

    const notas = mapAnomaliasToNotasFiscais(
      anomalias,
      new Map([
        [
          338462113,
          [
            {
              id: 10,
              produto: { codigo: 'SKU-001' },
              quantidade: 2,
              unidade: 'UN',
            },
          ],
        ],
      ]),
      transporteId,
      destinatarioPorNfId,
    );

    expect(notas[0]).toMatchObject({
      codCliente: '5000954',
      cliente: 'SUPERMERCADOS VIANENSE LTDA',
      cidade: 'Nova Iguaçu',
      tipo: 'reentrega',
    });
  });

  it('agrupa anomalias por NF e enriquece unidade dos itens da NF', () => {

    const anomalias: RavexAnomaliaViagem[] = [

      {

        anomaliaId: 1,

        tipoRetorno: 2,

        notaFiscalId: 338148992,

        numeroNotaFiscal: '12345',

        motivo: { descricao: 'Cliente recusou parcial' },

        item: {

          codigo: 'SKU-001',

          itemId: 10,

          quantidadeDevolvida: 3,

        },

      },

    ];



    const notas = mapAnomaliasToNotasFiscais(

      anomalias,

      new Map([

        [

          338148992,

          [

            {

              id: 10,

              descricaoItem: 'Produto A',

              unidade: 'CX',

              dataFabricacao: '2026-06-17T00:00:00',

              produto: { codigo: 'SKU-001', unidade: 'CX' },

            },

          ],

        ],

      ]),

      transporteId,

    );



    expect(notas).toHaveLength(1);

    expect(notas[0]).toMatchObject({

      numeroNf: '12345',

      tipo: 'devolucao_parcial',

      motivo: 'Cliente recusou parcial',

      observacao: 'NF 12345',

      transporteId,

    });

    expect(notas[0]?.itens[0]).toMatchObject({

      codigoProduto: 'SKU-001',

      sku: 'SKU-001',

      descricaoProduto: 'Produto A',

      dataFabricacao: '2026-06-17',

      quantidade: 3,

      unidadeMedida: 'CX',

      quantidadeNormalizadaUnidades: 3,

    });

  });



  it('propaga dataFabricacao da NF em devolucao total', () => {

    const anomalias: RavexAnomaliaViagem[] = [

      {

        anomaliaId: 99,

        tipoRetorno: 1,

        notaFiscalId: 338462591,

        numeroNotaFiscal: '987654',

        motivo: { descricao: 'Recusa total' },

        item: null,

      },

    ];



    const notas = mapAnomaliasToNotasFiscais(

      anomalias,

      new Map([

        [

          338462591,

          [

            {

              id: 501,

              produto: { codigo: 'SKU-TOTAL' },

              descricaoItem: 'Produto devolvido integralmente',

              unidade: 'UN',

              quantidade: 12,

              dataFabricacao: '2026-08-11T00:00:00',

            },

          ],

        ],

      ]),

      transporteId,

    );



    expect(notas[0]?.itens[0]?.dataFabricacao).toBe('2026-08-11');

  });



  it('prioriza produto.codigo sobre referenciaItem (ID interno Ravex)', () => {

    const anomalias: RavexAnomaliaViagem[] = [

      {

        anomaliaId: 3,

        tipoRetorno: 2,

        notaFiscalId: 338148992,

        numeroNotaFiscal: '777',

        motivo: { descricao: 'Parcial' },

        item: { itemId: 10 },

      },

    ];



    const notas = mapAnomaliasToNotasFiscais(

      anomalias,

      new Map([

        [

          338148992,

          [

            {

              id: 10,

              referenciaItem: '99',

              descricaoItem: 'Produto C',

              unidade: 'UN',

              quantidade: 4,

              produto: { id: 99, codigo: 'PROD-123' },

            },

          ],

        ],

      ]),

      transporteId,

    );



    expect(notas[0]?.itens[0]).toMatchObject({

      codigoProduto: 'PROD-123',

      sku: 'PROD-123',

      quantidade: 4,

    });

  });



  it('usa itens da NF quando devolução total não traz item na anomalia', () => {

    const anomalias: RavexAnomaliaViagem[] = [

      {

        anomaliaId: 99,

        tipoRetorno: 1,

        notaFiscalId: 338462591,

        numeroNotaFiscal: '987654',

        motivo: { descricao: 'Recusa total' },

        item: null,

      },

    ];



    const notas = mapAnomaliasToNotasFiscais(

      anomalias,

      new Map([

        [

          338462591,

          [

            {

              id: 501,

              referenciaItem: 'ID-INTERNO',

              produto: { codigo: 'SKU-TOTAL' },

              descricaoItem: 'Produto devolvido integralmente',

              unidade: 'UN',

              quantidade: 12,

            },

          ],

        ],

      ]),

      transporteId,

    );



    expect(notas).toHaveLength(1);

    expect(notas[0]?.itens[0]).toMatchObject({

      codigoProduto: 'SKU-TOTAL',

      sku: 'SKU-TOTAL',

      quantidade: 12,

    });

  });



  it('enriquece itens com produtoId e sku do cadastro', () => {

    const notas = enrichNotasFiscaisComProdutos(

      [

        {

          numeroNf: '123',

          tipo: 'devolucao_parcial',

          motivo: 'Teste',

          transporteId,

          itens: [

            {

              codigoProduto: 'PROD-123',

              sku: 'PROD-123',

              quantidade: 1,

              unidadeMedida: 'UN',

              quantidadeNormalizadaUnidades: 1,

            },

          ],

        },

      ],

      new Map([['PROD-123', { produtoId: 'PROD-123', sku: 'SKU-CADASTRO' }]]),

    );



    expect(notas[0]?.itens[0]).toMatchObject({

      produtoId: 'PROD-123',

      sku: 'SKU-CADASTRO',

    });

  });



  it('mapeia peso devolvido da anomalia Ravex', () => {

    const anomalias: RavexAnomaliaViagem[] = [

      {

        anomaliaId: 10,

        tipoRetorno: 2,

        notaFiscalId: 338148992,

        numeroNotaFiscal: '888',

        motivo: { descricao: 'Parcial com peso' },

        item: {

          codigo: 'SKU-001',

          itemId: 10,

          quantidadeDevolvida: 3,

          pesoBrutoDevolvido: 15.5,

        },

      },

    ];



    const notas = mapAnomaliasToNotasFiscais(

      anomalias,

      new Map([

        [

          338148992,

          [

            {

              id: 10,

              pesoBruto: 50,

              quantidade: 10,

              produto: { codigo: 'SKU-001' },

            },

          ],

        ],

      ]),

      transporteId,

    );



    expect(notas[0]?.itens[0]?.pesoDevolvido).toBe(15.5);

  });



  it('calcula peso proporcional a partir da NF quando anomalia nao traz peso', () => {

    const anomalias: RavexAnomaliaViagem[] = [

      {

        anomaliaId: 11,

        tipoRetorno: 2,

        notaFiscalId: 338148992,

        numeroNotaFiscal: '999',

        motivo: { descricao: 'Parcial' },

        item: {

          codigo: 'SKU-001',

          itemId: 10,

          quantidadeDevolvida: 5,

        },

      },

    ];



    const notas = mapAnomaliasToNotasFiscais(

      anomalias,

      new Map([

        [

          338148992,

          [

            {

              id: 10,

              pesoBruto: 100,

              quantidade: 10,

              produto: { codigo: 'SKU-001' },

            },

          ],

        ],

      ]),

      transporteId,

    );



    expect(notas[0]?.itens[0]?.pesoDevolvido).toBe(50);

  });



  it('gera uma NF por grupo distinto com devolucao_total sem item e devolucao_parcial com itens', () => {

    const anomalias: RavexAnomaliaViagem[] = [

      {

        anomaliaId: 11980584,

        tipoRetorno: 1,

        notaFiscalId: 338462804,

        numeroNotaFiscal: '244730',

        motivo: { descricao: 'V02 CLIENTE NÃO FEZ O PEDIDO' },

        item: null,

      },

      {

        anomaliaId: 11981729,

        tipoRetorno: 2,

        notaFiscalId: 338462819,

        numeroNotaFiscal: '244737',

        motivo: { descricao: 'V02 CLIENTE NÃO FEZ O PEDIDO' },

        item: {

          codigo: '600018007',

          itemId: 638878657,

          quantidadeDevolvida: 24,

          pesoBrutoDevolvido: 25.632,

        },

      },

      {

        anomaliaId: 11981730,

        tipoRetorno: 2,

        notaFiscalId: 338462819,

        numeroNotaFiscal: '244737',

        motivo: { descricao: 'V02 CLIENTE NÃO FEZ O PEDIDO' },

        item: {

          codigo: '600016007',

          itemId: 638878656,

          quantidadeDevolvida: 24,

          pesoBrutoDevolvido: 25.584,

        },

      },

    ];



    const notas = mapAnomaliasToNotasFiscais(

      anomalias,

      new Map([

        [338462804, []],

        [338462819, []],

      ]),

      transporteId,

    );



    expect(notas).toHaveLength(2);



    const nfTotal = notas.find((nota) => nota.numeroNf === '244730');

    const nfParcial = notas.find((nota) => nota.numeroNf === '244737');



    expect(nfTotal).toMatchObject({

      tipo: 'devolucao_total',

      motivo: 'V02 CLIENTE NÃO FEZ O PEDIDO',

    });

    expect(nfTotal?.itens).toHaveLength(1);

    expect(nfTotal?.itens[0]).toMatchObject({

      sku: 'NF-244730',

      observacao: 'Devolução total sem itens disponíveis na Ravex — NF 244730',

    });



    expect(nfParcial).toMatchObject({

      tipo: 'devolucao_parcial',

      motivo: 'V02 CLIENTE NÃO FEZ O PEDIDO',

    });

    expect(nfParcial?.itens).toHaveLength(2);

    expect(nfParcial?.itens.map((item) => item.codigoProduto)).toEqual([

      '600018007',

      '600016007',

    ]);

  });



  it('normaliza quantidade em caixa para unidades e calcula peso por unidade do produto', () => {

    const produto: ProdutoRecord = {

      produtoId: 'prod-1',

      sku: 'SKU-001',

      descricao: 'Produto A',

      empresa: 'LDB',

      categoria: 'seco',

      tipo: 'PVAR',

      ean: null,

      dum: null,

      shelfLife: null,

      pesoBrutoUnidade: '2.5',

      pesoBrutoCaixa: null,

      pesoBrutoPalete: null,

      pesoLiquidoUnidade: '2',

      pesoLiquidoCaixa: null,

      pesoLiquidoPalete: null,

      unidadesPorCaixa: 12,

      caixasPorPalete: null,

      createdAt: new Date(),

      updatedAt: new Date(),

    };



    const notas = normalizarQuantidadesNotasFiscais(

      [

        {

          numeroNf: '12345',

          tipo: 'devolucao_parcial',

          motivo: 'Teste',

          transporteId,

          itens: [

            {

              codigoProduto: 'SKU-001',

              sku: 'SKU-001',

              quantidade: 3,

              unidadeMedida: 'CX',

              quantidadeNormalizadaUnidades: 3,

              pesoDevolvido: null,

            },

          ],

        },

      ],

      new Map([['SKU-001', produto]]),

    );



    expect(notas[0]?.itens[0]).toMatchObject({

      quantidadeNormalizadaUnidades: 36,

      pesoDevolvido: 90,

    });

  });



  it('substitui peso incorreto da Ravex pelo peso do cadastro x quantidade normalizada', () => {

    const produto: ProdutoRecord = {

      produtoId: 'prod-2',

      sku: 'SKU-002',

      descricao: 'Produto B',

      empresa: 'LDB',

      categoria: 'seco',

      tipo: 'PVAR',

      ean: null,

      dum: null,

      shelfLife: null,

      pesoBrutoUnidade: null,

      pesoBrutoCaixa: null,

      pesoBrutoPalete: null,

      pesoLiquidoUnidade: '0.05',

      pesoLiquidoCaixa: null,

      pesoLiquidoPalete: null,

      unidadesPorCaixa: 1,

      caixasPorPalete: null,

      createdAt: new Date(),

      updatedAt: new Date(),

    };



    const notas = normalizarQuantidadesNotasFiscais(

      [

        {

          numeroNf: '99999',

          tipo: 'devolucao_parcial',

          motivo: 'Teste',

          transporteId,

          itens: [

            {

              codigoProduto: 'SKU-002',

              sku: 'SKU-002',

              quantidade: 20,

              unidadeMedida: 'UN',

              quantidadeNormalizadaUnidades: 20,

              pesoDevolvido: 0.062,

            },

          ],

        },

      ],

      new Map([['SKU-002', produto]]),

    );



    expect(notas[0]?.itens[0]).toMatchObject({

      quantidadeNormalizadaUnidades: 20,

      pesoDevolvido: 1,

    });

  });

});


