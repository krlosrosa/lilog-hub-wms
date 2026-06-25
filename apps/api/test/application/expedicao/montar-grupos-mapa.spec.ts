import { describe, expect, it } from 'vitest';

import {
  montarGruposMapa,
  type TransporteParaMapa,
} from '../../../src/application/services/expedicao/montar-grupos-mapa.js';
import type { GerarMapasConfigInput } from '../../../src/application/dtos/expedicao/gerar-mapas.dto.js';

const BASE_CONFIG: GerarMapasConfigInput = {
  tipoDadosBasicos: 'transporte',
  quebraPalete: { ativo: false, tipo: 'linhas', valor: 10 },
  exibirClienteCabecalho: true,
  segregarPaleteFull: false,
  segregarUnidade: false,
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
            sku: 'SKU001',
            descricao: 'Produto teste A',
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
        ],
      },
    ],
  };
}

describe('montarGruposMapa pickway', () => {
  it('ordena itens por pickway antes do split de paletes', () => {
    const transporte = criarTransporteComItem(120);
    transporte.remessas[0]!.itens = [
      {
        ...criarTransporteComItem(120).remessas[0]!.itens[0]!,
        id: 'item-b',
        sku: 'SKU-B',
        endereco: 'B 0002 002 02',
        zona: 'B',
        rua: '2',
        posicao: '2',
        nivel: '2',
      },
      {
        ...criarTransporteComItem(120).remessas[0]!.itens[0]!,
        id: 'item-a',
        sku: 'SKU-A',
        endereco: 'A 0001 001 01',
        zona: 'A',
        rua: '1',
        posicao: '1',
        nivel: '1',
      },
    ];

    const resultado = montarGruposMapa([transporte], {
      ...BASE_CONFIG,
      segregarPaleteFull: true,
    });

    const grupoPaletes = resultado.grupos.find((grupo) =>
      grupo.titulo.includes('Paletes Completos'),
    );

    expect(grupoPaletes?.itens.map((item) => item.sku)).toEqual(['SKU-A', 'SKU-B']);
    expect(grupoPaletes?.itens[0]?.endereco).toBe('A 0001 001 01');
  });
});

describe('montarGruposMapa segregacao', () => {
  it('segrega palete completo em grupo separado', () => {
    const transportes = [
      criarTransporteComItem(120),
      {
        ...criarTransporteComItem(25),
        id: 'transporte-2',
        rota: 'Rota B',
        remessas: [
          {
            ...criarTransporteComItem(25).remessas[0]!,
            itens: [
              {
                ...criarTransporteComItem(25).remessas[0]!.itens[0]!,
                id: 'item-2',
                sku: 'SKU002',
              },
            ],
          },
        ],
      },
    ];

    const resultado = montarGruposMapa(transportes, {
      ...BASE_CONFIG,
      segregarPaleteFull: true,
    });

    const grupoPaletes = resultado.grupos.find((grupo) =>
      grupo.titulo.includes('Paletes Completos'),
    );
    const grupoNormal = resultado.grupos.find(
      (grupo) => !grupo.titulo.includes('Paletes Completos'),
    );

    expect(grupoPaletes).toBeDefined();
    expect(grupoPaletes?.itens.some((item) => item.sku === 'SKU001')).toBe(true);
    expect(grupoPaletes?.itens[0]?.breakdown?.paletes).toBe(1);
    expect(grupoNormal?.itens.some((item) => item.sku === 'SKU001')).toBe(false);
    expect(grupoNormal?.itens.some((item) => item.sku === 'SKU002')).toBe(true);
  });

  it('nao segrega quando flag desativada', () => {
    const transportes = [criarTransporteComItem(120)];

    const resultado = montarGruposMapa(transportes, BASE_CONFIG);

    expect(resultado.grupos).toHaveLength(1);
    expect(resultado.grupos[0]?.titulo).not.toContain('Paletes Completos');
    expect(resultado.grupos[0]?.itens[0]?.breakdown?.paletes).toBe(1);
  });

  it('propaga descricao do produto nos itens do grupo', () => {
    const resultado = montarGruposMapa([criarTransporteComItem(120)], BASE_CONFIG);

    expect(resultado.grupos[0]?.itens[0]?.descricao).toBe('Produto teste A');
  });
});

describe('montarGruposMapa quebraPalete', () => {
  it('divide grupo normal em sub-grupos por linhas', () => {
    const transporte = criarTransporteComItem(12);
    transporte.remessas[0]!.itens = Array.from({ length: 4 }, (_, index) => ({
      ...criarTransporteComItem(12).remessas[0]!.itens[0]!,
      id: `item-${index}`,
      sku: `SKU${index}`,
    }));

    const resultado = montarGruposMapa([transporte], {
      ...BASE_CONFIG,
      quebraPalete: { ativo: true, tipo: 'linhas', valor: 2 },
    });

    const grupoParte1 = resultado.grupos.find((grupo) =>
      grupo.titulo.includes('Parte 1'),
    );
    const grupoParte2 = resultado.grupos.find((grupo) =>
      grupo.titulo.includes('Parte 2'),
    );

    expect(grupoParte1).toBeDefined();
    expect(grupoParte2).toBeDefined();
    expect(resultado.grupos).toHaveLength(2);
  });

  it('nao aplica quebra em grupo de paletes completos', () => {
    const transporte = criarTransporteComItem(120);
    transporte.remessas[0]!.itens.push({
      ...criarTransporteComItem(12).remessas[0]!.itens[0]!,
      id: 'item-2',
      sku: 'SKU002',
      quantidadeNormalizadaUnidades: 24,
      quantidade: 24,
    });

    const resultado = montarGruposMapa([transporte], {
      ...BASE_CONFIG,
      segregarPaleteFull: true,
      quebraPalete: { ativo: true, tipo: 'linhas', valor: 1 },
    });

    const grupoPaletes = resultado.grupos.find((grupo) =>
      grupo.titulo.includes('Paletes Completos'),
    );

    expect(grupoPaletes).toBeDefined();
    expect(grupoPaletes?.titulo).not.toContain('Parte');
    expect(grupoPaletes?.id).not.toContain('-parte-');
  });
});

describe('montarGruposMapa cabecalho', () => {
  it('inclui cabecalho em cada grupo com metadados de transporte', () => {
    const transportes = [criarTransporteComItem(120)];

    const resultado = montarGruposMapa(transportes, BASE_CONFIG);
    const grupo = resultado.grupos[0];

    expect(grupo?.cabecalho).toBeDefined();
    expect(grupo?.cabecalho.transporte).toBe('Rota A');
    expect(grupo?.cabecalho.placa).toBe('ABC-1234');
    expect(grupo?.cabecalho.transportadora).toBe('TransLog');
    expect(grupo?.cabecalho.codPrimeiroCliente).toBe('C001');
    expect(grupo?.cabecalho.primeiroCliente).toBe('Cliente A');
    expect(grupo?.cabecalho.empresa).toBe('Empresa X');
    expect(grupo?.cabecalho.categoria).toBe('seco');
    expect(grupo?.cabecalho.quantidadeLinhas).toBe(1);
    expect(grupo?.id).toBe(grupo?.cabecalho.microUuid);
    expect(grupo?.cabecalho.microUuid).toMatch(
      /^Rota-A-[A-Za-z0-9_-]{21}$/,
    );
  });
});
