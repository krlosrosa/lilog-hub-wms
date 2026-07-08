import { and, eq, inArray, ne, sql } from 'drizzle-orm';

import type { GerarMapasResponse } from '../../../application/dtos/expedicao/gerar-mapas.dto.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  cortes,
  mapaGrupoItens,
  mapaGrupos,
  mapaLoteTransportes,
  mapaLotes,
  remessas,
  transporteRemessas,
  transportes,
} from '../providers/drizzle/config/migrations/schema.js';

export const PREFIXO_TITULO_MAPA_CONFERENCIA_REENTREGA = 'Conferência Reentrega';

type MapaGrupoPayload = GerarMapasResponse['grupos'][number];

type DrizzleTransaction = Parameters<Parameters<DrizzleClient['transaction']>[0]>[0];

export async function transportePossuiMapaConferenciaReentregaDb(
  db: DrizzleClient | DrizzleTransaction,
  input: {
    transporteId: string;
    remessaIds?: string[];
  },
): Promise<boolean> {
  const condicoes = [
    eq(mapaGrupos.transporteId, input.transporteId),
    eq(mapaGrupos.processo, 'conferencia'),
    sql`${mapaGrupos.titulo} ILIKE ${`${PREFIXO_TITULO_MAPA_CONFERENCIA_REENTREGA}%`}`,
  ];

  if (input.remessaIds != null && input.remessaIds.length > 0) {
    const rows = await db
      .select({ id: mapaGrupos.id })
      .from(mapaGrupos)
      .innerJoin(mapaGrupoItens, eq(mapaGrupoItens.mapaGrupoId, mapaGrupos.id))
      .innerJoin(remessas, eq(remessas.remessa, mapaGrupoItens.remessa))
      .innerJoin(
        transporteRemessas,
        and(
          eq(transporteRemessas.remessaId, remessas.id),
          eq(transporteRemessas.transporteId, input.transporteId),
        ),
      )
      .where(
        and(
          ...condicoes,
          inArray(remessas.id, input.remessaIds),
        ),
      )
      .limit(1);

    return rows.length > 0;
  }

  const rows = await db
    .select({ id: mapaGrupos.id })
    .from(mapaGrupos)
    .where(and(...condicoes))
    .limit(1);

  return rows.length > 0;
}

function condicoesGrupoConferenciaReentrega(transporteId: string) {
  return [
    eq(mapaGrupos.transporteId, transporteId),
    eq(mapaGrupos.processo, 'conferencia'),
    sql`${mapaGrupos.titulo} ILIKE ${`${PREFIXO_TITULO_MAPA_CONFERENCIA_REENTREGA}%`}`,
  ];
}

export async function listTransporteIdsComMapaConferenciaReentregaDb(
  db: DrizzleClient,
  unidadeId: string,
  transporteIds: string[],
): Promise<Set<string>> {
  if (transporteIds.length === 0) {
    return new Set();
  }

  const rows = await db
    .select({ transporteId: mapaGrupos.transporteId })
    .from(mapaGrupos)
    .innerJoin(mapaLotes, eq(mapaLotes.id, mapaGrupos.mapaLoteId))
    .where(
      and(
        eq(mapaLotes.unidadeId, unidadeId),
        inArray(mapaGrupos.transporteId, transporteIds),
        eq(mapaGrupos.processo, 'conferencia'),
        sql`${mapaGrupos.titulo} ILIKE ${`${PREFIXO_TITULO_MAPA_CONFERENCIA_REENTREGA}%`}`,
      ),
    );

  return new Set(rows.map((row) => row.transporteId));
}

export type ExcluirMapaConferenciaReentregaTransporteInput = {
  unidadeId: string;
  transporteId: string;
};

export type ExcluirMapaConferenciaReentregaTransporteResult = {
  transporteId: string;
  loteIdsExcluidos: string[];
};

export async function excluirMapaConferenciaReentregaTransporteDb(
  db: DrizzleClient,
  input: ExcluirMapaConferenciaReentregaTransporteInput,
): Promise<ExcluirMapaConferenciaReentregaTransporteResult | null> {
  return db.transaction(async (tx) => {
    const [transporte] = await tx
      .select({ id: transportes.numeroTransporte })
      .from(transportes)
      .where(
        and(
          eq(transportes.numeroTransporte, input.transporteId),
          eq(transportes.unidadeId, input.unidadeId),
        ),
      )
      .limit(1);

    if (!transporte) {
      return null;
    }

    const grupos = await tx
      .select({
        id: mapaGrupos.id,
        mapaLoteId: mapaGrupos.mapaLoteId,
        iniciadoEm: mapaGrupos.iniciadoEm,
      })
      .from(mapaGrupos)
      .innerJoin(mapaLotes, eq(mapaLotes.id, mapaGrupos.mapaLoteId))
      .where(
        and(
          eq(mapaLotes.unidadeId, input.unidadeId),
          ...condicoesGrupoConferenciaReentrega(input.transporteId),
        ),
      );

    if (grupos.length === 0) {
      return null;
    }

    const grupoIniciado = grupos.some((grupo) => grupo.iniciadoEm != null);

    if (grupoIniciado) {
      throw new Error(
        'Não é possível excluir: a conferência reentrega já foi iniciada.',
      );
    }

    const grupoIds = grupos.map((grupo) => grupo.id);

    const [corteAtivo] = await tx
      .select({ id: cortes.id })
      .from(cortes)
      .where(
        and(
          inArray(cortes.mapaGrupoId, grupoIds),
          ne(cortes.status, 'cancelado'),
        ),
      )
      .limit(1);

    if (corteAtivo) {
      throw new Error(
        'Não é possível excluir o mapa: existe corte operacional ativo vinculado.',
      );
    }

    const loteIdsExcluidos = [...new Set(grupos.map((grupo) => grupo.mapaLoteId))];

    await tx
      .delete(mapaLotes)
      .where(
        and(
          eq(mapaLotes.unidadeId, input.unidadeId),
          inArray(mapaLotes.id, loteIdsExcluidos),
        ),
      );

    return {
      transporteId: input.transporteId,
      loteIdsExcluidos,
    };
  });
}

async function inserirGrupoConferenciaReentrega(
  tx: DrizzleTransaction,
  input: {
    loteId: string;
    transporteId: string;
    grupo: MapaGrupoPayload;
    sequencia: number;
  },
): Promise<void> {
  const microUuid = input.grupo.cabecalho.microUuid;

  const [grupoInserido] = await tx
    .insert(mapaGrupos)
    .values({
      mapaLoteId: input.loteId,
      microUuid,
      processo: 'conferencia',
      transporteId: input.transporteId,
      titulo: input.grupo.titulo,
      subtitulo: input.grupo.subtitulo ?? null,
      cabecalho: {
        ...input.grupo.cabecalho,
        microUuid,
        nomeGrupo: input.grupo.titulo,
      },
      totalItens: input.grupo.totalItens,
      pesoTotal: input.grupo.pesoTotal.toFixed(3),
      sequencia: input.sequencia,
      tempoEsperado: 0,
    })
    .returning();

  if (!grupoInserido) {
    throw new Error('Falha ao criar grupo de conferência reentrega.');
  }

  if (input.grupo.itens.length > 0) {
    await tx.insert(mapaGrupoItens).values(
      input.grupo.itens.map((item) => ({
        mapaGrupoId: grupoInserido.id,
        sku: item.sku,
        descricao: item.descricao,
        remessa: item.remessa,
        cliente: item.cliente,
        codCliente: item.codCliente,
        empresa: item.empresa,
        categoria: item.categoria,
        lote: item.lote,
        dataFabricacao: item.dataFabricacao,
        faixa: item.faixa,
        quantidade: item.quantidade.toFixed(3),
        unidadeMedida: item.unidadeMedida,
        quantidadeNormalizadaUnidades:
          item.quantidadeNormalizadaUnidades.toFixed(3),
        peso: item.peso != null ? item.peso.toFixed(3) : null,
        quebraPalete: item.quebraPalete ?? false,
        breakdown: item.breakdown,
      })),
    );
  }
}

export type SalvarMapaConferenciaReentregaInput = {
  unidadeId: string;
  transporteId: string;
  grupos: MapaGrupoPayload[];
  configuracaoImpressaoId: string;
  criadoPor: number | null;
};

export async function salvarMapaConferenciaReentregaDb(
  db: DrizzleClient,
  input: SalvarMapaConferenciaReentregaInput,
): Promise<void> {
  if (input.grupos.length === 0) {
    return;
  }

  await db.transaction(async (tx) => {
    const lotesAnteriores = await tx
      .select({ mapaLoteId: mapaGrupos.mapaLoteId })
      .from(mapaGrupos)
      .where(
        and(
          eq(mapaGrupos.transporteId, input.transporteId),
          eq(mapaGrupos.processo, 'conferencia'),
          sql`${mapaGrupos.titulo} ILIKE ${`${PREFIXO_TITULO_MAPA_CONFERENCIA_REENTREGA}%`}`,
        ),
      );

    const loteIdsAnteriores = [
      ...new Set(lotesAnteriores.map((row) => row.mapaLoteId)),
    ];

    if (loteIdsAnteriores.length > 0) {
      await tx
        .delete(mapaLotes)
        .where(
          and(
            eq(mapaLotes.unidadeId, input.unidadeId),
            inArray(mapaLotes.id, loteIdsAnteriores),
          ),
        );
    }

    const payload = {
      tipo: 'conferencia_reentrega',
      transporteId: input.transporteId,
      grupos: input.grupos,
    };

    const [lote] = await tx
      .insert(mapaLotes)
      .values({
        unidadeId: input.unidadeId,
        config: payload,
        payload,
        resumo: {
          transportes: [
            {
              transporteId: input.transporteId,
              rota: input.transporteId,
            },
          ],
        },
        configuracaoImpressaoId: input.configuracaoImpressaoId,
        criadoPor: input.criadoPor,
      })
      .returning();

    if (!lote) {
      throw new Error('Falha ao criar lote de conferência reentrega.');
    }

    await tx.insert(mapaLoteTransportes).values({
      mapaLoteId: lote.id,
      transporteId: input.transporteId,
    });

    for (const [sequencia, grupo] of input.grupos.entries()) {
      await inserirGrupoConferenciaReentrega(tx, {
        loteId: lote.id,
        transporteId: input.transporteId,
        grupo,
        sequencia,
      });
    }
  });
}
