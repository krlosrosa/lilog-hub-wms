import { describe, expect, it } from 'vitest';

import {
  aplicarClientesEspeciaisNaConfig,
  clienteEstaNaListaSegregacao,
  montarMapaClientesEspeciaisPorCodigoRemessa,
} from '../../../src/application/services/expedicao/aplicar-clientes-especiais-mapa.js';
import {
  montarGruposMapa,
  resolverBlocosBase,
  type TransporteParaMapa,
} from '../../../src/application/services/expedicao/montar-grupos-mapa.js';
import type { GerarMapasConfigInput } from '../../../src/application/dtos/expedicao/gerar-mapas.dto.js';
import type { ClienteEspecialRecord } from '../../../src/domain/repositories/expedicao/cliente-especial.repository.js';

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

function criarClienteEspecial(
  overrides: Partial<ClienteEspecialRecord> = {},
): ClienteEspecialRecord {
  return {
    id: 'cliente-especial-1',
    unidadeId: 'unidade-1',
    codCliente: '000417',
    nomeCliente: 'Cliente Especial',
    ativo: true,
    exigeSegregacaoMapa: true,
    exigeSeparacaoEspecial: false,
    exigeCarregamentoEspecial: false,
    observacaoSeparacao: null,
    observacaoCarregamento: null,
    observacaoGeral: null,
    criadoPor: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function criarTransporteDoisClientes(): TransporteParaMapa[] {
  return [
    {
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
          codCliente: '000417',
          cliente: 'Cliente Especial',
          cidade: 'Fortaleza',
          peso: 10,
          volume: 1,
          itens: [
            {
              id: 'item-1',
              remessaId: 'remessa-1',
              numeroRemessa: '1001',
              codCliente: '000417',
              cliente: 'Cliente Especial',
              cidade: 'Fortaleza',
              sku: 'SKU-A',
              descricao: 'Produto A',
              produtoId: null,
              empresa: 'Empresa X',
              categoria: 'seco',
              lote: null,
              dataFabricacao: null,
              faixa: null,
              peso: 5,
              quantidade: 1,
              unidadeMedida: 'UN',
              quantidadeNormalizadaUnidades: 1,
              unidadesPorCaixa: null,
              caixasPorPalete: null,
              pesoBrutoUnidade: null,
              pesoBrutoCaixa: null,
              pesoBrutoPalete: null,
              pesoLiquidoUnidade: null,
              pesoLiquidoCaixa: null,
              pesoLiquidoPalete: null,
            },
          ],
        },
        {
          id: 'remessa-2',
          remessa: '1002',
          codCliente: 'C002',
          cliente: 'Cliente Normal',
          cidade: 'Fortaleza',
          peso: 10,
          volume: 1,
          itens: [
            {
              id: 'item-2',
              remessaId: 'remessa-2',
              numeroRemessa: '1002',
              codCliente: 'C002',
              cliente: 'Cliente Normal',
              cidade: 'Fortaleza',
              sku: 'SKU-B',
              descricao: 'Produto B',
              produtoId: null,
              empresa: 'Empresa X',
              categoria: 'seco',
              lote: null,
              dataFabricacao: null,
              faixa: null,
              peso: 5,
              quantidade: 1,
              unidadeMedida: 'UN',
              quantidadeNormalizadaUnidades: 1,
              unidadesPorCaixa: null,
              caixasPorPalete: null,
              pesoBrutoUnidade: null,
              pesoBrutoCaixa: null,
              pesoBrutoPalete: null,
              pesoLiquidoUnidade: null,
              pesoLiquidoCaixa: null,
              pesoLiquidoPalete: null,
            },
          ],
        },
      ],
    },
  ];
}

describe('aplicarClientesEspeciaisNaConfig', () => {
  it('usa o codigo da remessa quando o cadastro difere apenas por espacos', () => {
    const cliente = criarClienteEspecial({ codCliente: '000417 ' });
    const codClientesRemessa = ['000417', 'C002'];

    const config = aplicarClientesEspeciaisNaConfig(
      BASE_CONFIG,
      [cliente],
      codClientesRemessa,
    );

    expect(config.agrupamento.tiposAtivos).toContain('segregar_clientes');
    expect(config.agrupamento.clientesSegregados).toContain('000417');
    expect(clienteEstaNaListaSegregacao('000417', config.agrupamento.clientesSegregados)).toBe(true);
  });

  it('segrega automaticamente cliente especial em transporte misto', () => {
    const transportes = criarTransporteDoisClientes();
    const codClientes = ['000417', 'C002'];
    const clientesEspeciais = [criarClienteEspecial()];
    const mapa = montarMapaClientesEspeciaisPorCodigoRemessa(
      clientesEspeciais,
      codClientes,
    );
    const config = aplicarClientesEspeciaisNaConfig(
      BASE_CONFIG,
      clientesEspeciais,
      codClientes,
    );

    const blocos = resolverBlocosBase(transportes, config);
    const separacao = montarGruposMapa(
      transportes,
      config,
      undefined,
      mapa,
    );

    expect(blocos.length).toBeGreaterThan(1);
    expect(separacao.totalGrupos).toBeGreaterThan(1);
    expect(
      separacao.grupos.some((grupo) =>
        grupo.subtitulo?.includes('CLIENTE ESPECIAL'),
      ),
    ).toBe(true);
  });
});
