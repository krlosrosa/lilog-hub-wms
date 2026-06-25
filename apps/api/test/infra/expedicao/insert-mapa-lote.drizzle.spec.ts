import { describe, expect, it, vi } from 'vitest';

import { insertMapaLoteDb } from '../../../src/infra/db/expedicao/insert-mapa-lote.drizzle.js';
import {
  mapaGrupoItens,
  mapaGrupos,
  mapaLoteTransportes,
  mapaLotes,
} from '../../../src/infra/db/providers/drizzle/config/migrations/schema.js';

const configBase = {
  tipoDadosBasicos: 'transporte' as const,
  quebraPalete: { ativo: false, tipo: 'linhas' as const, valor: 10 },
  exibirClienteCabecalho: true,
  segregarPaleteFull: false,
  segregarUnidade: false,
  agrupamento: {
    tiposAtivos: [] as const,
    clientesSegregados: [],
    grupos: [],
  },
  opcoesConferencia: {
    classificarPor: 'sku' as const,
    agrupamento: 'replicar_separacao' as const,
  },
};

const etapaPayloadBase = {
  agrupamento: 'Por transporte',
  tipoDadosBasicos: 'transporte' as const,
  totalGrupos: 1,
  grupos: [
    {
      id: 'micro-uuid-1',
      titulo: 'Rota A',
      totalItens: 1,
      pesoTotal: 12.5,
      tempoEsperado: 330,
      cabecalho: {
        transporte: 'Rota A',
        placa: null,
        transportadora: null,
        codPrimeiroCliente: 'C1',
        primeiroCliente: 'Cliente',
        codTodosClientes: 'C1',
        todosClientes: 'Cliente',
        pesoTotal: 12.5,
        totalCaixas: 1,
        totalUnidades: 0,
        totalPaletes: 0,
        nomeGrupo: 'Rota A',
        quantidadeLinhas: 1,
        categoria: 'seco',
        empresa: 'Empresa',
        microUuid: 'micro-uuid-1',
      },
      itens: [
        {
          sku: 'SKU1',
          descricao: 'Produto teste A',
          remessa: 'NF1',
          cliente: 'Cliente',
          codCliente: 'C1',
          empresa: 'Empresa',
          categoria: 'seco',
          lote: null,
          dataFabricacao: null,
          faixa: null,
          quantidade: 1,
          unidadeMedida: 'UN',
          quantidadeNormalizadaUnidades: 1,
          peso: 12.5,
          breakdown: null,
        },
      ],
    },
  ],
};

const payloadBase = {
  ...etapaPayloadBase,
  separacao: etapaPayloadBase,
  conferencia: etapaPayloadBase,
  opcoesConferencia: {
    classificarPor: 'sku' as const,
    agrupamento: 'replicar_separacao' as const,
  },
  carregamento: {
    totalMinutas: 1,
    minutas: [
      {
        transporteId: 'transporte-1',
        cabecalho: {
          transporte: 'Rota A',
          placa: 'ABC-1234',
          transportadora: 'TransLog',
          codPrimeiroCliente: 'C1',
          primeiroCliente: 'Cliente',
          codTodosClientes: 'C1',
          todosClientes: 'Cliente',
          pesoTotal: 12.5,
          totalCaixas: 1,
          totalUnidades: 0,
          totalPaletes: 0,
          nomeGrupo: 'Rota A',
          quantidadeLinhas: 2,
          categoria: 'seco',
          empresa: 'Empresa',
          microUuid: 'micro-carregamento-1',
        },
        tabelaEmpresa: [
          {
            empresa: 'Empresa',
            categoria: 'seco',
            quantidadeUnidade: 0,
            quantidadeCaixa: 1,
            quantidadePalete: 0,
            pesoKg: 12.5,
          },
        ],
        tabelaClientes: [
          {
            codCliente: 'C1',
            cliente: 'Cliente',
            cidade: 'Fortaleza',
            pesoKg: 12.5,
            volumeM3: 1.2,
            quantidadeUnidade: 0,
            quantidadeCaixa: 1,
            quantidadePalete: 0,
          },
        ],
        totais: {
          pesoKg: 12.5,
          volumeM3: 1.2,
          quantidadeUnidade: 0,
          quantidadeCaixa: 1,
          quantidadePalete: 0,
        },
      },
    ],
  },
};

describe('insertMapaLoteDb', () => {
  it('persiste grupos de separacao e conferencia com processo no grupo', async () => {
    const loteRow = {
      id: 'lote-1',
      unidadeId: 'unidade-1',
      config: configBase,
      payload: payloadBase,
      resumo: {},
      configuracaoImpressaoId: null,
      templatesHtml: null,
      criadoPor: 1,
      createdAt: new Date(),
    };

    const itensInseridos: unknown[] = [];
    const gruposInseridos: unknown[] = [];

    const returningLote = vi.fn().mockResolvedValue([loteRow]);
    const returningGrupo = vi
      .fn()
      .mockResolvedValueOnce([{ id: 'grupo-sep' }])
      .mockResolvedValueOnce([{ id: 'grupo-conf' }])
      .mockResolvedValueOnce([{ id: 'grupo-carreg' }]);

    const insert = vi.fn().mockImplementation((table: unknown) => {
      if (table === mapaLotes) {
        return { values: vi.fn().mockReturnValue({ returning: returningLote }) };
      }

      if (table === mapaLoteTransportes) {
        return { values: vi.fn().mockResolvedValue(undefined) };
      }

      if (table === mapaGrupos) {
        return {
          values: vi.fn().mockImplementation((row: unknown) => {
            gruposInseridos.push(row);
            return { returning: returningGrupo };
          }),
        };
      }

      if (table === mapaGrupoItens) {
        return {
          values: vi.fn().mockImplementation((rows: unknown[]) => {
            itensInseridos.push(...rows);
            return Promise.resolve(undefined);
          }),
        };
      }

      return { values: vi.fn().mockResolvedValue(undefined) };
    });

    const updateSet = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });

    const selectFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ id: 'transporte-1' }]),
    });

    const tx = {
      select: vi.fn().mockReturnValue({ from: selectFrom }),
      insert,
      update: vi.fn().mockReturnValue({ set: updateSet }),
    };

    const db = {
      transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    const result = await insertMapaLoteDb(db as never, {
      unidadeId: 'unidade-1',
      transporteIds: ['transporte-1'],
      config: configBase,
      payload: payloadBase,
      resumo: {
        totalTransportes: 1,
        totalGrupos: 1,
        totalItens: 1,
        pesoTotalKg: 12.5,
        transportes: [],
        configResumo: {
          tipoDadosBasicos: 'transporte',
          segregarPaleteFull: false,
          segregarUnidade: false,
          quebraPaleteAtivo: false,
        },
      },
      criadoPor: 1,
      transportesPorRota: new Map([['Rota A', 'transporte-1']]),
    });

    expect(result.id).toBe('lote-1');
    expect(gruposInseridos).toHaveLength(3);
    expect(gruposInseridos[0]).toMatchObject({
      microUuid: 'micro-uuid-1',
      processo: 'separacao',
      sequencia: 0,
      tempoEsperado: 330,
    });
    expect(gruposInseridos[1]).toMatchObject({
      microUuid: 'micro-uuid-1',
      processo: 'conferencia',
      sequencia: 1,
      tempoEsperado: 0,
    });
    expect(gruposInseridos[2]).toMatchObject({
      microUuid: 'micro-carregamento-1',
      processo: 'carregamento',
      transporteId: 'transporte-1',
      sequencia: 2,
      totalItens: 2,
      tempoEsperado: 0,
    });
    expect(itensInseridos).toHaveLength(2);
    expect(itensInseridos[0]).toMatchObject({
      sku: 'SKU1',
      descricao: 'Produto teste A',
      mapaGrupoId: 'grupo-sep',
    });
    expect(itensInseridos[1]).toMatchObject({
      mapaGrupoId: 'grupo-conf',
    });
  });

  it('persiste minuta de carregamento sem mapa_grupo_itens', async () => {
    const loteRow = {
      id: 'lote-1',
      unidadeId: 'unidade-1',
      config: configBase,
      payload: payloadBase,
      resumo: {},
      configuracaoImpressaoId: null,
      templatesHtml: null,
      criadoPor: 1,
      createdAt: new Date(),
    };

    const gruposInseridos: Array<{ processo: string }> = [];
    let insertGrupoItensCalls = 0;

    const returningLote = vi.fn().mockResolvedValue([loteRow]);
    const returningGrupo = vi
      .fn()
      .mockResolvedValueOnce([{ id: 'grupo-sep' }])
      .mockResolvedValueOnce([{ id: 'grupo-conf' }])
      .mockResolvedValueOnce([{ id: 'grupo-carreg' }]);

    const insert = vi.fn().mockImplementation((table: unknown) => {
      if (table === mapaLotes) {
        return { values: vi.fn().mockReturnValue({ returning: returningLote }) };
      }

      if (table === mapaLoteTransportes) {
        return { values: vi.fn().mockResolvedValue(undefined) };
      }

      if (table === mapaGrupos) {
        return {
          values: vi.fn().mockImplementation((row: { processo: string }) => {
            gruposInseridos.push(row);
            return { returning: returningGrupo };
          }),
        };
      }

      if (table === mapaGrupoItens) {
        return {
          values: vi.fn().mockImplementation(() => {
            insertGrupoItensCalls += 1;
            return Promise.resolve(undefined);
          }),
        };
      }

      return { values: vi.fn().mockResolvedValue(undefined) };
    });

    const tx = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: 'transporte-1' }]),
        }),
      }),
      insert,
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    };

    const db = {
      transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    await insertMapaLoteDb(db as never, {
      unidadeId: 'unidade-1',
      transporteIds: ['transporte-1'],
      config: configBase,
      payload: payloadBase,
      resumo: {
        totalTransportes: 1,
        totalGrupos: 3,
        totalItens: 1,
        pesoTotalKg: 12.5,
        transportes: [],
        configResumo: {
          tipoDadosBasicos: 'transporte',
          segregarPaleteFull: false,
          segregarUnidade: false,
          quebraPaleteAtivo: false,
        },
      },
      criadoPor: 1,
      transportesPorRota: new Map([['Rota A', 'transporte-1']]),
    });

    expect(gruposInseridos.some((grupo) => grupo.processo === 'carregamento')).toBe(
      true,
    );
    expect(insertGrupoItensCalls).toBe(2);
  });

  it('rejeita quando transporte nao pertence a unidade', async () => {
    const tx = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
      insert: vi.fn(),
      update: vi.fn(),
    };

    const db = {
      transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    await expect(
      insertMapaLoteDb(db as never, {
        unidadeId: 'unidade-1',
        transporteIds: ['transporte-1'],
        config: configBase,
        payload: payloadBase,
        resumo: {
          totalTransportes: 1,
          totalGrupos: 1,
          totalItens: 1,
          pesoTotalKg: 12.5,
          transportes: [],
          configResumo: {
            tipoDadosBasicos: 'transporte',
            segregarPaleteFull: false,
            segregarUnidade: false,
            quebraPaleteAtivo: false,
          },
        },
        criadoPor: 1,
        transportesPorRota: new Map(),
      }),
    ).rejects.toThrow('transportes não pertencem');
  });
});
