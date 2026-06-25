import { describe, expect, it } from 'vitest';



import type { GerarMapasResponse } from '../../../src/application/dtos/expedicao/gerar-mapas.dto.js';
import { emptyCarregamentoPayload } from '../../../src/application/dtos/expedicao/gerar-mapas.dto.js';

import type { MapaLoteResumo } from '../../../src/application/dtos/expedicao/salvar-mapas.dto.js';

import { resolverGruposImpressaoMapa } from '../../../src/application/services/expedicao/resolver-grupos-impressao-mapa.js';

import type { MapaLoteRecord } from '../../../src/domain/repositories/expedicao/mapa-lote.repository.js';



const config = {

  tipoDadosBasicos: 'transporte' as const,

  quebraPalete: { ativo: false, tipo: 'linhas' as const, valor: 10 },

  exibirClienteCabecalho: true,

  segregarPaleteFull: false,

  segregarUnidade: false,

  agrupamento: { tiposAtivos: [], clientesSegregados: [], grupos: [] },

};



function criarCabecalhoGrupo(

  microUuid: string,

  rota: string,

): GerarMapasResponse['grupos'][number]['cabecalho'] {

  return {

    transporte: rota,

    placa: null,

    transportadora: null,

    codPrimeiroCliente: 'C1',

    primeiroCliente: 'Cliente 1',

    codTodosClientes: 'C1',

    todosClientes: 'Cliente 1',

    pesoTotal: 10,

    totalCaixas: 1,

    totalUnidades: 0,

    totalPaletes: 0,

    nomeGrupo: rota,

    quantidadeLinhas: 1,

    categoria: 'seco',

    empresa: 'Empresa X',

    microUuid,

  };

}



function criarGrupoPayload(

  id: string,

  rota: string,

): GerarMapasResponse['grupos'][number] {

  return {

    id,

    titulo: rota,

    totalItens: 1,

    pesoTotal: 10,

    cabecalho: criarCabecalhoGrupo(id, rota),

    itens: [],

  };

}



const etapaSeparacaoDoisTransportes = {
  agrupamento: 'Por transporte',
  tipoDadosBasicos: 'transporte' as const,
  totalGrupos: 2,
  grupos: [
    criarGrupoPayload('grupo-1', 'Rota A'),
    criarGrupoPayload('grupo-2', 'Rota B'),
  ],
};

const payloadDoisTransportes: GerarMapasResponse = {
  ...etapaSeparacaoDoisTransportes,
  separacao: etapaSeparacaoDoisTransportes,
  conferencia: {
    agrupamento: 'Replicar separação',
    tipoDadosBasicos: 'transporte',
    totalGrupos: 2,
    grupos: [
      criarGrupoPayload('grupo-conf-1', 'Rota A'),
      criarGrupoPayload('grupo-conf-2', 'Rota B'),
    ],
  },
  opcoesConferencia: {
    classificarPor: 'sku',
    agrupamento: 'replicar_separacao',
  },
  carregamento: emptyCarregamentoPayload(),
};



const resumoDoisTransportes: MapaLoteResumo = {

  totalTransportes: 2,

  totalGrupos: 2,

  totalItens: 2,

  pesoTotalKg: 30,

  transportes: [

    {

      transporteId: 'transporte-1',

      rota: 'Rota A',

      placa: null,

      totalGrupos: 1,

      totalItens: 1,

      pesoTotalKg: 10,

      grupos: [

        { microUuid: 'grupo-1', titulo: 'Rota A', totalItens: 1, pesoTotalKg: 10 },

      ],

    },

    {

      transporteId: 'transporte-2',

      rota: 'Rota B',

      placa: null,

      totalGrupos: 1,

      totalItens: 1,

      pesoTotalKg: 20,

      grupos: [

        { microUuid: 'grupo-2', titulo: 'Rota B', totalItens: 1, pesoTotalKg: 20 },

      ],

    },

  ],

  configResumo: {

    tipoDadosBasicos: 'transporte',

    segregarPaleteFull: false,

    segregarUnidade: false,

    quebraPaleteAtivo: false,

  },

};



const payloadMultiplosGruposTransporte: GerarMapasResponse = {

  agrupamento: 'Por transporte',

  tipoDadosBasicos: 'transporte',

  totalGrupos: 3,

  grupos: [

    criarGrupoPayload('grupo-1', 'Rota A'),

    criarGrupoPayload('grupo-2', 'Rota A'),

    criarGrupoPayload('grupo-3', 'Rota B'),

  ],

  separacao: {
    agrupamento: 'Por transporte',
    tipoDadosBasicos: 'transporte',
    totalGrupos: 3,
    grupos: [
      criarGrupoPayload('grupo-1', 'Rota A'),
      criarGrupoPayload('grupo-2', 'Rota A'),
      criarGrupoPayload('grupo-3', 'Rota B'),
    ],
  },
  conferencia: {
    agrupamento: 'Replicar separação',
    tipoDadosBasicos: 'transporte',
    totalGrupos: 3,
    grupos: [
      criarGrupoPayload('grupo-1', 'Rota A'),
      criarGrupoPayload('grupo-2', 'Rota A'),
      criarGrupoPayload('grupo-3', 'Rota B'),
    ],
  },
  opcoesConferencia: {
    classificarPor: 'sku',
    agrupamento: 'replicar_separacao',
  },
  carregamento: emptyCarregamentoPayload(),

};



const resumoMultiplosGruposTransporte: MapaLoteResumo = {

  totalTransportes: 2,

  totalGrupos: 3,

  totalItens: 3,

  pesoTotalKg: 30,

  transportes: [

    {

      transporteId: 'transporte-1',

      rota: 'Rota A',

      placa: null,

      totalGrupos: 2,

      totalItens: 2,

      pesoTotalKg: 20,

      grupos: [

        { microUuid: 'grupo-1', titulo: 'Rota A', totalItens: 1, pesoTotalKg: 10 },

        { microUuid: 'grupo-2', titulo: 'Rota A', totalItens: 1, pesoTotalKg: 10 },

      ],

    },

    {

      transporteId: 'transporte-2',

      rota: 'Rota B',

      placa: null,

      totalGrupos: 1,

      totalItens: 1,

      pesoTotalKg: 10,

      grupos: [

        { microUuid: 'grupo-3', titulo: 'Rota B', totalItens: 1, pesoTotalKg: 10 },

      ],

    },

  ],

  configResumo: {

    tipoDadosBasicos: 'transporte',

    segregarPaleteFull: false,

    segregarUnidade: false,

    quebraPaleteAtivo: false,

  },

};



function criarLote(

  id: string,

  payload: GerarMapasResponse,

  resumo: MapaLoteResumo,

): MapaLoteRecord {

  return {

    id,

    unidadeId: 'unidade-1',

    config,

    payload,

    resumo,

    configuracaoImpressaoId: null,

    templatesHtml: null,

    criadoPor: null,

    createdAt: new Date(),

  };

}



describe('resolverGruposImpressaoMapa', () => {

  it('filtra grupos pelos transportes selecionados', () => {

    const grupos = resolverGruposImpressaoMapa({

      lotes: [criarLote('lote-1', payloadDoisTransportes, resumoDoisTransportes)],

      transporteIds: ['transporte-1'],
      tipoMapa: 'separacao',
    });

    expect(grupos).toHaveLength(1);

    expect(grupos[0]?.grupo.id).toBe('grupo-1');

    expect(grupos[0]?.sequencia).toBe(1);

    expect(grupos[0]?.transporteId).toBe('transporte-1');

    expect(grupos[0]?.paginaTransporte).toBe(1);

    expect(grupos[0]?.totalPaginasTransporte).toBe(1);

  });



  it('retorna grupos de multiplos transportes na ordem do payload', () => {

    const grupos = resolverGruposImpressaoMapa({

      lotes: [criarLote('lote-1', payloadDoisTransportes, resumoDoisTransportes)],

      transporteIds: ['transporte-1', 'transporte-2'],
      tipoMapa: 'separacao',
    });

    expect(grupos).toHaveLength(2);

    expect(grupos[0]?.grupo.id).toBe('grupo-1');

    expect(grupos[1]?.grupo.id).toBe('grupo-2');

    expect(grupos[1]?.sequencia).toBe(2);

    expect(grupos[0]?.paginaTransporte).toBe(1);

    expect(grupos[0]?.totalPaginasTransporte).toBe(1);

    expect(grupos[1]?.paginaTransporte).toBe(1);

    expect(grupos[1]?.totalPaginasTransporte).toBe(1);

  });



  it('calcula paginacao por transporte reiniciando o contador', () => {

    const grupos = resolverGruposImpressaoMapa({

      lotes: [

        criarLote(

          'lote-1',

          payloadMultiplosGruposTransporte,

          resumoMultiplosGruposTransporte,

        ),

      ],

      transporteIds: ['transporte-1', 'transporte-2'],
      tipoMapa: 'separacao',
    });

    expect(grupos).toHaveLength(3);

    expect(grupos[0]).toMatchObject({

      grupo: { id: 'grupo-1' },

      transporteId: 'transporte-1',

      paginaTransporte: 1,

      totalPaginasTransporte: 2,

    });

    expect(grupos[1]).toMatchObject({

      grupo: { id: 'grupo-2' },

      transporteId: 'transporte-1',

      paginaTransporte: 2,

      totalPaginasTransporte: 2,

    });

    expect(grupos[2]).toMatchObject({

      grupo: { id: 'grupo-3' },

      transporteId: 'transporte-2',

      paginaTransporte: 1,

      totalPaginasTransporte: 1,

    });

  });

  it('retorna grupos de conferencia com microUuid distinto da separacao', () => {
    const grupos = resolverGruposImpressaoMapa({
      lotes: [criarLote('lote-1', payloadDoisTransportes, resumoDoisTransportes)],
      transporteIds: ['transporte-1', 'transporte-2'],
      tipoMapa: 'conferencia',
    });

    expect(grupos).toHaveLength(2);
    expect(grupos[0]?.grupo.id).toBe('grupo-conf-1');
    expect(grupos[1]?.grupo.id).toBe('grupo-conf-2');
    expect(grupos[0]?.grupo.cabecalho.microUuid).toBe('grupo-conf-1');
  });

  it('filtra conferencia pelos transportes selecionados', () => {
    const grupos = resolverGruposImpressaoMapa({
      lotes: [criarLote('lote-1', payloadDoisTransportes, resumoDoisTransportes)],
      transporteIds: ['transporte-2'],
      tipoMapa: 'conferencia',
    });

    expect(grupos).toHaveLength(1);
    expect(grupos[0]?.grupo.id).toBe('grupo-conf-2');
    expect(grupos[0]?.transporteId).toBe('transporte-2');
  });

});

