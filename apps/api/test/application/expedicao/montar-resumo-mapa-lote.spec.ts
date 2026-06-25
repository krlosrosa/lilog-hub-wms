import { describe, expect, it } from 'vitest';

import { montarResumoMapaLote } from '../../../src/application/services/expedicao/montar-resumo-mapa-lote.js';
import type { GerarMapasResponse } from '../../../src/application/dtos/expedicao/gerar-mapas.dto.js';
import { emptyCarregamentoPayload } from '../../../src/application/dtos/expedicao/gerar-mapas.dto.js';
import type { GerarMapasConfigInput } from '../../../src/application/dtos/expedicao/gerar-mapas.dto.js';

const config: GerarMapasConfigInput = {
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

const etapaPayload = {
  agrupamento: 'Por transporte',
  tipoDadosBasicos: 'transporte' as const,
  totalGrupos: 2,
  grupos: [
    {
      id: 'rota-a-abc',
      titulo: 'Rota A',
      totalItens: 3,
      pesoTotal: 120,
      cabecalho: {
        transporte: 'Rota A',
        placa: 'ABC-1234',
        transportadora: 'TransLog',
        codPrimeiroCliente: 'C001',
        primeiroCliente: 'Cliente A',
        codTodosClientes: 'C001',
        todosClientes: 'Cliente A',
        pesoTotal: 60,
        totalCaixas: 2,
        totalUnidades: 0,
        totalPaletes: 0,
        nomeGrupo: 'Rota A',
        quantidadeLinhas: 2,
        categoria: 'seco',
        empresa: 'Empresa X',
        microUuid: 'rota-a-grupo-1',
      },
      itens: [],
    },
    {
      id: 'rota-a-def',
      titulo: 'Rota A · Palete',
      totalItens: 2,
      pesoTotal: 60,
      cabecalho: {
        transporte: 'Rota A',
        placa: 'ABC-1234',
        transportadora: 'TransLog',
        codPrimeiroCliente: 'C002',
        primeiroCliente: 'Cliente B',
        codTodosClientes: 'C002',
        todosClientes: 'Cliente B',
        pesoTotal: 60,
        totalCaixas: 1,
        totalUnidades: 0,
        totalPaletes: 1,
        nomeGrupo: 'Rota A · Palete',
        quantidadeLinhas: 1,
        categoria: 'seco',
        empresa: 'Empresa X',
        microUuid: 'rota-a-grupo-2',
      },
      itens: [],
    },
  ],
};

const payload: GerarMapasResponse = {
  ...etapaPayload,
  separacao: etapaPayload,
  conferencia: etapaPayload,
  opcoesConferencia: {
    classificarPor: 'sku',
    agrupamento: 'replicar_separacao',
  },
  carregamento: emptyCarregamentoPayload(),
};

describe('montarResumoMapaLote', () => {
  it('calcula totais e breakdown por transporte', () => {
    const mapaGeradoEm = new Date('2026-06-01T10:00:00.000Z');

    const resumo = montarResumoMapaLote({
      payload,
      config,
      transportes: [
        {
          id: 'transporte-1',
          rota: 'Rota A',
          placa: 'ABC-1234',
          transportadora: 'TransLog',
          mapaGeradoEm,
          ultimoMapaLoteId: 'lote-anterior',
        },
      ],
      transportesPorRota: new Map([['Rota A', 'transporte-1']]),
    });

    expect(resumo.totalTransportes).toBe(1);
    expect(resumo.totalGrupos).toBe(4);
    expect(resumo.totalItens).toBe(5);
    expect(resumo.pesoTotalKg).toBe(180);
    expect(resumo.transportes[0]?.totalGrupos).toBe(2);
    expect(resumo.transportes[0]?.mapaGeradoEmAnterior).toBe(
      mapaGeradoEm.toISOString(),
    );
    expect(resumo.configResumo.quebraPaleteAtivo).toBe(false);
  });

  it('expõe aviso de substituicao via mapaGeradoEmAnterior', () => {
    const resumo = montarResumoMapaLote({
      payload,
      config,
      transportes: [
        {
          id: 'transporte-1',
          rota: 'Rota A',
          placa: null,
          transportadora: null,
          mapaGeradoEm: null,
          ultimoMapaLoteId: null,
        },
      ],
      transportesPorRota: new Map([['Rota A', 'transporte-1']]),
    });

    expect(resumo.transportes[0]?.mapaGeradoEmAnterior).toBeNull();
  });
});
