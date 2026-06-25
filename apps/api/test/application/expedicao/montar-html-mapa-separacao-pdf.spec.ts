import { describe, expect, it } from 'vitest';



import {
  combinarDocumentosMapaPdf,
  formatarHorarioImpressaoPtBr,
  montarHtmlMapaSeparacaoPdf,
} from '../../../src/application/services/expedicao/montar-html-mapa-separacao-pdf.js';

import type { GrupoImpressaoMapa } from '../../../src/application/services/expedicao/resolver-grupos-impressao-mapa.js';



const metadadosBase = {

  horarioImpressao: new Date('2026-06-19T14:30:00.000Z'),

  impressoPor: 'João Silva',

};



const grupoBase: GrupoImpressaoMapa = {

  sequencia: 1,

  transporteId: 'transporte-1',

  paginaTransporte: 1,

  totalPaginasTransporte: 1,

  grupo: {

    id: 'grupo-1',

    titulo: 'Rota A',

    totalItens: 1,

    pesoTotal: 10,

    cabecalho: {

      transporte: 'Rota A',

      placa: 'ABC-1234',

      transportadora: 'TransLog',

      codPrimeiroCliente: 'C001',

      primeiroCliente: 'Cliente A',

      codTodosClientes: 'C001',

      todosClientes: 'Cliente A',

      pesoTotal: 10,

      totalCaixas: 1,

      totalUnidades: 0,

      totalPaletes: 0,

      nomeGrupo: 'Rota A',

      quantidadeLinhas: 1,

      categoria: 'seco',

      empresa: 'Empresa X',

      microUuid: 'grupo-1',

    },

    itens: [

      {

        sku: 'SKU-001',

        descricao: 'Produto teste',

        remessa: '1001',

        cliente: 'Cliente A',

        codCliente: 'C001',

        empresa: 'Empresa X',

        categoria: 'seco',

        lote: 'L001',

        dataFabricacao: '2026-01-01',

        faixa: 'verde',

        quantidade: 10,

        unidadeMedida: 'UN',

        quantidadeNormalizadaUnidades: 10,

        peso: 10,

        breakdown: {

          paletes: 0,

          caixas: 1,

          unidades: 0,

          pesoPaletes: null,

          pesoCaixas: 10,

          pesoUnidades: null,

        },

      },

    ],

  },

};



function criarGrupo(

  id: string,

  rota: string,

  transporteId: string,

  paginaTransporte: number,

  totalPaginasTransporte: number,

  sequencia: number,

): GrupoImpressaoMapa {

  return {

    ...grupoBase,

    sequencia,

    transporteId,

    paginaTransporte,

    totalPaginasTransporte,

    grupo: {

      ...grupoBase.grupo,

      id,

      titulo: rota,

      cabecalho: {

        ...grupoBase.grupo.cabecalho,

        transporte: rota,

        nomeGrupo: rota,

        microUuid: id,

      },

    },

  };

}



describe('montarHtmlMapaSeparacaoPdf', () => {

  it('substitui variaveis do cabecalho e inclui tabela', async () => {

    const html = await montarHtmlMapaSeparacaoPdf({

      grupos: [grupoBase],

      templateHtml: '<div><strong>{{rota}}</strong><p>{{placa}}</p></div>',

      ordemColunas: ['sku', 'quantidade_caixa'],

      qrConfig: { posicao: 'superior_direito', tamanho: 64 },

      metadados: metadadosBase,

    });



    expect(html).toContain('Rota A');

    expect(html).toContain('ABC-1234');

    expect(html).toContain('SKU-001');

    expect(html).toContain('mapa-page');

    expect(html).toContain('data:image/png;base64,');

  });



  it('substitui qr_code inline quando posicao no_html', async () => {

    const html = await montarHtmlMapaSeparacaoPdf({

      grupos: [grupoBase],

      templateHtml: '<div>{{rota}} {{qr_code}}</div>',

      ordemColunas: ['sku'],

      qrConfig: { posicao: 'no_html', tamanho: 48 },

      metadados: metadadosBase,

    });



    expect(html).toContain('data:image/png;base64,');

    expect(html).not.toContain('{{qr_code}}');

  });



  it('inclui rodape fixo com paginacao, horario e usuario', async () => {

    const html = await montarHtmlMapaSeparacaoPdf({

      grupos: [grupoBase],

      templateHtml: '<div>{{rota}}</div>',

      ordemColunas: ['sku'],

      qrConfig: { posicao: 'superior_direito', tamanho: 64 },

      metadados: metadadosBase,

    });



    const horario = formatarHorarioImpressaoPtBr(metadadosBase.horarioImpressao);



    expect(html).toContain('mapa-rodape');

    expect(html).toContain('Página 1/1');

    expect(html).toContain(`Impresso em ${horario}`);

    expect(html).toContain('por João Silva');

  });



  it('reinicia paginacao por transporte no rodape', async () => {

    const grupos = [

      criarGrupo('grupo-1', 'Rota A', 'transporte-1', 1, 2, 1),

      criarGrupo('grupo-2', 'Rota A', 'transporte-1', 2, 2, 2),

      criarGrupo('grupo-3', 'Rota B', 'transporte-2', 1, 1, 3),

    ];



    const html = await montarHtmlMapaSeparacaoPdf({

      grupos,

      templateHtml: '<div>{{rota}}</div>',

      ordemColunas: ['sku'],

      qrConfig: { posicao: 'superior_direito', tamanho: 64 },

      metadados: metadadosBase,

    });



    expect(html).toContain('Rota A · Página 1/2');

    expect(html).toContain('Rota A · Página 2/2');

    expect(html).toContain('Rota B · Página 1/1');

  });

  it('combina paginas de multiplos documentos em um unico html', async () => {
    const htmlSeparacao = await montarHtmlMapaSeparacaoPdf({
      grupos: [grupoBase],
      templateHtml: '<div>Separacao {{rota}}</div>',
      ordemColunas: ['sku'],
      qrConfig: { posicao: 'superior_direito', tamanho: 64 },
      metadados: metadadosBase,
    });

    const htmlConferencia = await montarHtmlMapaSeparacaoPdf({
      grupos: [
        {
          ...grupoBase,
          grupo: {
            ...grupoBase.grupo,
            titulo: 'Rota A Conferencia',
            cabecalho: {
              ...grupoBase.grupo.cabecalho,
              microUuid: 'grupo-conf-1',
            },
          },
        },
      ],
      templateHtml: '<div>Conferencia {{rota}}</div>',
      ordemColunas: ['sku'],
      qrConfig: { posicao: 'superior_direito', tamanho: 64 },
      metadados: metadadosBase,
    });

    const combinado = combinarDocumentosMapaPdf([htmlSeparacao, htmlConferencia]);

    expect(combinado.match(/<section class="mapa-page">/g)).toHaveLength(2);
    expect(combinado).toContain('Separacao Rota A');
    expect(combinado).toContain('Conferencia Rota A');
    expect(combinado.match(/<!DOCTYPE html>/g)).toHaveLength(1);
  });

});

