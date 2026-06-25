import { describe, expect, it } from 'vitest';

import type { GerarMapasConfigInput } from '../../../src/application/dtos/expedicao/gerar-mapas.dto.js';
import { montarGruposMapaConferencia } from '../../../src/application/services/expedicao/montar-grupos-mapa-conferencia.js';
import {
  montarGruposMapa,
  resolverBlocosBase,
  type TransporteParaMapa,
} from '../../../src/application/services/expedicao/montar-grupos-mapa.js';

const BASE_CONFIG: GerarMapasConfigInput = {
  tipoDadosBasicos: 'transporte',
  quebraPalete: { ativo: false, tipo: 'linhas', valor: 10 },
  exibirClienteCabecalho: true,
  segregarPaleteFull: true,
  segregarUnidade: true,
  agrupamento: {
    tiposAtivos: [],
    clientesSegregados: [],
    grupos: [],
  },
  opcoesConferencia: {
    classificarPor: 'sku',
    agrupamento: 'replicar_separacao',
  },
};

function criarTransporteComItem(
  qtdNorm: number,
  overrides: Partial<TransporteParaMapa['remessas'][number]['itens'][number]> = {},
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
        cidade: 'Fortaleza',
        peso: 0,
        volume: 0,
        itens: [
          {
            id: 'item-1',
            remessaId: 'remessa-1',
            numeroRemessa: '1001',
            codCliente: 'C001',
            cliente: 'Cliente A',
            cidade: 'Fortaleza',
            sku: 'SKU-B',
            descricao: 'Produto B',
            produtoId: 'prod-1',
            empresa: 'Empresa X',
            categoria: 'seco',
            lote: 'L001',
            dataFabricacao: '2026-01-01',
            faixa: 'verde',
            peso: 120,
            quantidade: qtdNorm,
            unidadeMedida: 'UN',
            quantidadeNormalizadaUnidades: qtdNorm,
            unidadesPorCaixa: 12,
            caixasPorPalete: 10,
            pesoBrutoUnidade: '0.5',
            pesoBrutoCaixa: '6',
            pesoBrutoPalete: '120',
            pesoLiquidoUnidade: null,
            pesoLiquidoCaixa: null,
            pesoLiquidoPalete: null,
            ...overrides,
          },
          {
            id: 'item-2',
            remessaId: 'remessa-1',
            numeroRemessa: '1001',
            codCliente: 'C001',
            cliente: 'Cliente A',
            cidade: 'Fortaleza',
            sku: 'SKU-A',
            descricao: 'Produto A',
            produtoId: 'prod-2',
            empresa: 'Empresa X',
            categoria: 'seco',
            lote: 'L002',
            dataFabricacao: '2026-01-01',
            faixa: 'verde',
            peso: 60,
            quantidade: 24,
            unidadeMedida: 'UN',
            quantidadeNormalizadaUnidades: 24,
            unidadesPorCaixa: 12,
            caixasPorPalete: 10,
            pesoBrutoUnidade: '0.5',
            pesoBrutoCaixa: '6',
            pesoBrutoPalete: '120',
            pesoLiquidoUnidade: null,
            pesoLiquidoCaixa: null,
            pesoLiquidoPalete: null,
          },
        ],
      },
    ],
  };
}

describe('montarGruposMapaConferencia', () => {
  it('replicar_separacao nao cria folhas de palete completo nem unidades', () => {
    const transportes = [criarTransporteComItem(120)];
    const blocos = resolverBlocosBase(transportes, BASE_CONFIG);
    const separacao = montarGruposMapa(transportes, BASE_CONFIG);

    expect(separacao.grupos.some((g) => g.titulo.includes('Paletes Completos'))).toBe(
      true,
    );

    const resultado = montarGruposMapaConferencia(
      transportes,
      BASE_CONFIG,
      BASE_CONFIG.opcoesConferencia,
      blocos,
      separacao,
    );

    expect(resultado.totalGrupos).toBe(1);
    expect(
      resultado.grupos.some((grupo) => grupo.titulo.includes('Paletes Completos')),
    ).toBe(false);
    expect(
      resultado.grupos.some((grupo) => grupo.titulo.includes('Unidades')),
    ).toBe(false);
    expect(resultado.grupos[0]?.itens).toHaveLength(2);
    expect(resultado.grupos[0]?.itens[0]?.breakdown?.paletes).toBe(0);
  });

  it('replicar_separacao usa cabecalho do grupo base da separacao', () => {
    const transportes = [criarTransporteComItem(120)];
    const blocos = resolverBlocosBase(transportes, BASE_CONFIG);
    const separacao = montarGruposMapa(transportes, BASE_CONFIG);
    const grupoBaseSeparacao = separacao.grupos.find(
      (grupo) => grupo.titulo === 'Rota A',
    );

    const resultado = montarGruposMapaConferencia(
      transportes,
      BASE_CONFIG,
      BASE_CONFIG.opcoesConferencia,
      blocos,
      separacao,
    );

    expect(grupoBaseSeparacao).toBeDefined();
    expect(resultado.grupos[0]?.id).toBe(grupoBaseSeparacao?.id);
    expect(resultado.grupos[0]?.cabecalho.microUuid).toBe(
      grupoBaseSeparacao?.cabecalho.microUuid,
    );
    expect(resultado.grupos[0]?.titulo).toBe('Rota A');
  });

  it('ordena itens por SKU dentro de cada grupo', () => {
    const transportes = [criarTransporteComItem(24)];
    const config: GerarMapasConfigInput = {
      ...BASE_CONFIG,
      segregarPaleteFull: false,
      segregarUnidade: false,
    };
    const blocos = resolverBlocosBase(transportes, config);
    const separacao = montarGruposMapa(transportes, config);

    const resultado = montarGruposMapaConferencia(
      transportes,
      config,
      { ...config.opcoesConferencia, classificarPor: 'sku' },
      blocos,
      separacao,
    );

    const skus = resultado.grupos[0]?.itens.map((item) => item.sku) ?? [];
    expect(skus).toEqual(['SKU-A', 'SKU-B']);
  });

  it('replicar_separacao mantém blocos de segregação de clientes sem split palete', () => {
    const transportes = [criarTransporteComItem(120)];
    const configCliente: GerarMapasConfigInput = {
      ...BASE_CONFIG,
      segregarPaleteFull: false,
      segregarUnidade: false,
      agrupamento: {
        tiposAtivos: ['segregar_clientes'],
        clientesSegregados: ['C001'],
        grupos: [],
      },
    };

    const transporteBase = criarTransporteComItem(120);
    const transportesDoisClientes: TransporteParaMapa[] = [
      {
        ...transporteBase,
        remessas: [
          {
            ...transporteBase.remessas[0]!,
            itens: [
              transporteBase.remessas[0]!.itens[0]!,
              {
                ...transporteBase.remessas[0]!.itens[1]!,
                id: 'item-3',
                codCliente: 'C002',
                cliente: 'Cliente B',
                sku: 'SKU-C',
              },
            ],
          },
        ],
      },
    ];

    const separacaoPalete = montarGruposMapa(transportes, BASE_CONFIG);
    const conferenciaPalete = montarGruposMapaConferencia(
      transportes,
      BASE_CONFIG,
      BASE_CONFIG.opcoesConferencia,
      resolverBlocosBase(transportes, BASE_CONFIG),
      separacaoPalete,
    );

    const blocosClientes = resolverBlocosBase(transportesDoisClientes, configCliente);
    const separacaoClientes = montarGruposMapa(transportesDoisClientes, configCliente);
    const conferenciaClientes = montarGruposMapaConferencia(
      transportesDoisClientes,
      configCliente,
      configCliente.opcoesConferencia,
      blocosClientes,
      separacaoClientes,
    );

    expect(separacaoPalete.totalGrupos).toBeGreaterThan(conferenciaPalete.totalGrupos);
    expect(conferenciaPalete.totalGrupos).toBe(1);
    expect(conferenciaClientes.totalGrupos).toBe(blocosClientes.length);
    expect(
      [...conferenciaPalete.grupos, ...conferenciaClientes.grupos].every(
        (grupo) =>
          !grupo.titulo.includes('Paletes Completos') &&
          !grupo.titulo.includes('Unidades'),
      ),
    ).toBe(true);
  });

  it('apenas_transporte ignora segregação de clientes', () => {
    const transporteBase = criarTransporteComItem(120);
    const transportes: TransporteParaMapa[] = [
      {
        ...transporteBase,
        remessas: [
          {
            ...transporteBase.remessas[0]!,
            itens: [
              transporteBase.remessas[0]!.itens[0]!,
              {
                ...transporteBase.remessas[0]!.itens[1]!,
                id: 'item-3',
                codCliente: 'C002',
                cliente: 'Cliente B',
                sku: 'SKU-C',
              },
            ],
          },
        ],
      },
    ];
    const config: GerarMapasConfigInput = {
      ...BASE_CONFIG,
      agrupamento: {
        tiposAtivos: ['segregar_clientes'],
        clientesSegregados: ['C001'],
        grupos: [],
      },
    };

    const separacao = montarGruposMapa(transportes, config);
    const blocosSeparacao = resolverBlocosBase(transportes, config);
    const conferenciaReplicar = montarGruposMapaConferencia(
      transportes,
      config,
      { classificarPor: 'sku', agrupamento: 'replicar_separacao' },
      blocosSeparacao,
      separacao,
    );
    const conferenciaTransporte = montarGruposMapaConferencia(
      transportes,
      config,
      { classificarPor: 'sku', agrupamento: 'apenas_transporte' },
    );

    expect(conferenciaReplicar.totalGrupos).toBeGreaterThan(
      conferenciaTransporte.totalGrupos,
    );
  });

  it('replicar_separacao gera microUuid unico por grupo de conferencia', () => {
    const transporteBase = criarTransporteComItem(120);
    const transportes: TransporteParaMapa[] = [
      {
        ...transporteBase,
        remessas: [
          {
            ...transporteBase.remessas[0]!,
            itens: [
              transporteBase.remessas[0]!.itens[0]!,
              {
                ...transporteBase.remessas[0]!.itens[1]!,
                id: 'item-3',
                codCliente: 'C002',
                cliente: 'Cliente B',
                sku: 'SKU-C',
              },
            ],
          },
        ],
      },
    ];
    const config: GerarMapasConfigInput = {
      ...BASE_CONFIG,
      segregarPaleteFull: false,
      segregarUnidade: false,
      agrupamento: {
        tiposAtivos: ['segregar_clientes'],
        clientesSegregados: ['C001'],
        grupos: [],
      },
    };

    const separacao = montarGruposMapa(transportes, config);
    const blocos = resolverBlocosBase(transportes, config);
    const conferencia = montarGruposMapaConferencia(
      transportes,
      config,
      config.opcoesConferencia,
      blocos,
      separacao,
    );

    const microUuids = conferencia.grupos.map((grupo) => grupo.cabecalho.microUuid);
    expect(new Set(microUuids).size).toBe(microUuids.length);
  });
});
