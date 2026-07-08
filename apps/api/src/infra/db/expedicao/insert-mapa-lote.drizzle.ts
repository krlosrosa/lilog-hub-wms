import { and, eq, inArray, sql } from 'drizzle-orm';

import type {
  InsertMapaLoteInput,
  MapaLoteRecord,
} from '../../../domain/repositories/expedicao/mapa-lote.repository.js';
import type {
  GerarMapasConfigInput,
  GerarMapasResponse,
  MinutaCarregamento,
} from '../../../application/dtos/expedicao/gerar-mapas.dto.js';
import type { MapaLoteResumo } from '../../../application/dtos/expedicao/salvar-mapas.dto.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  mapaGrupoItens,
  mapaGrupos,
  mapaLoteTransportes,
  mapaLotes,
  transportes,
} from '../providers/drizzle/config/migrations/schema.js';

type MapaGrupoPayload = GerarMapasResponse['grupos'][number];
type MapaGrupoProcesso = 'separacao' | 'conferencia' | 'carregamento';

function mapMapaLoteRecord(row: typeof mapaLotes.$inferSelect): MapaLoteRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    config: row.config as GerarMapasConfigInput,
    payload: row.payload as MapaLoteRecord['payload'],
    resumo: row.resumo as MapaLoteResumo,
    configuracaoImpressaoId: row.configuracaoImpressaoId,
    templatesHtml: row.templatesHtml,
    criadoPor: row.criadoPor,
    createdAt: row.createdAt,
  };
}

function resolverGruposSeparacao(payload: GerarMapasResponse): MapaGrupoPayload[] {
  return payload.separacao?.grupos ?? payload.grupos;
}

function resolverGruposConferencia(payload: GerarMapasResponse): MapaGrupoPayload[] {
  return payload.conferencia?.grupos ?? [];
}

function resolverMinutasCarregamento(payload: GerarMapasResponse): MinutaCarregamento[] {
  return payload.carregamento?.minutas ?? [];
}

function resolverTransporteIdGrupo(
  rotaCabecalho: string,
  transportesPorRota: Map<string, string>,
  transporteIds: string[],
): string {
  const byRota = transportesPorRota.get(rotaCabecalho);
  if (byRota) {
    return byRota;
  }

  return transporteIds[0]!;
}

type DrizzleTransaction = Parameters<Parameters<DrizzleClient['transaction']>[0]>[0];

async function inserirGrupoMapa(
  tx: DrizzleTransaction,
  input: {
    loteId: string;
    grupo: MapaGrupoPayload;
    sequencia: number;
    processo: MapaGrupoProcesso;
    transportesPorRota: Map<string, string>;
    transporteIds: string[];
  },
): Promise<void> {
  const microUuid = input.grupo.cabecalho.microUuid;
  const transporteId = resolverTransporteIdGrupo(
    input.grupo.cabecalho.transporte,
    input.transportesPorRota,
    input.transporteIds,
  );

  const cabecalho = {
    ...input.grupo.cabecalho,
    microUuid,
    nomeGrupo: input.grupo.titulo,
  };

  const [grupoInserido] = await tx
    .insert(mapaGrupos)
    .values({
      mapaLoteId: input.loteId,
      microUuid,
      processo: input.processo,
      transporteId,
      titulo: input.grupo.titulo,
      subtitulo: input.grupo.subtitulo ?? null,
      cabecalho,
      totalItens: input.grupo.totalItens,
      pesoTotal: input.grupo.pesoTotal.toFixed(3),
      sequencia: input.sequencia,
      tempoEsperado:
        input.processo === 'separacao'
          ? (input.grupo.tempoEsperado ?? 0)
          : 0,
    })
    .returning();

  if (!grupoInserido) {
    throw new Error('Failed to create mapa grupo');
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

async function inserirMinutaCarregamento(
  tx: DrizzleTransaction,
  input: {
    loteId: string;
    minuta: MinutaCarregamento;
    sequencia: number;
  },
): Promise<void> {
  const microUuid = input.minuta.cabecalho.microUuid;
  const totalLinhasResumo =
    input.minuta.tabelaEmpresa.length + input.minuta.tabelaClientes.length;

  const cabecalho = {
    ...input.minuta.cabecalho,
    microUuid,
    nomeGrupo: input.minuta.cabecalho.transporte,
  };

  const [grupoInserido] = await tx
    .insert(mapaGrupos)
    .values({
      mapaLoteId: input.loteId,
      microUuid,
      processo: 'carregamento',
      transporteId: input.minuta.transporteId,
      titulo: input.minuta.cabecalho.transporte,
      subtitulo: null,
      cabecalho,
      totalItens: totalLinhasResumo,
      pesoTotal: input.minuta.totais.pesoKg.toFixed(3),
      sequencia: input.sequencia,
      tempoEsperado: 0,
    })
    .returning();

  if (!grupoInserido) {
    throw new Error('Failed to create mapa grupo de carregamento');
  }
}

export async function insertMapaLoteDb(
  db: DrizzleClient,
  input: InsertMapaLoteInput,
): Promise<MapaLoteRecord> {
  return db.transaction(async (tx) => {
    const transportesValidos = await tx
      .select({ id: transportes.numeroTransporte })
      .from(transportes)
      .where(
        and(
          eq(transportes.unidadeId, input.unidadeId),
          inArray(transportes.numeroTransporte, input.transporteIds),
        ),
      );

    if (transportesValidos.length !== input.transporteIds.length) {
      throw new Error(
        'Um ou mais transportes não pertencem à unidade informada.',
      );
    }

    const gruposSeparacao = resolverGruposSeparacao(input.payload);
    const gruposConferencia = resolverGruposConferencia(input.payload);
    const minutasCarregamento = resolverMinutasCarregamento(input.payload);

    if (gruposSeparacao.length === 0 && gruposConferencia.length === 0) {
      throw new Error('Nenhum grupo de mapa foi gerado para persistir.');
    }

    const [lote] = await tx
      .insert(mapaLotes)
      .values({
        unidadeId: input.unidadeId,
        config: input.config,
        payload: input.payload,
        resumo: input.resumo,
        configuracaoImpressaoId: input.configuracaoImpressaoId ?? null,
        templatesHtml: input.templatesHtml ?? null,
        criadoPor: input.criadoPor,
      })
      .returning();

    if (!lote) {
      throw new Error('Failed to create mapa lote');
    }

    await tx.insert(mapaLoteTransportes).values(
      input.transporteIds.map((transporteId) => ({
        mapaLoteId: lote.id,
        transporteId,
      })),
    );

    let sequencia = 0;

    for (const grupo of gruposSeparacao) {
      await inserirGrupoMapa(tx, {
        loteId: lote.id,
        grupo,
        sequencia,
        processo: 'separacao',
        transportesPorRota: input.transportesPorRota,
        transporteIds: input.transporteIds,
      });
      sequencia += 1;
    }

    for (const grupo of gruposConferencia) {
      await inserirGrupoMapa(tx, {
        loteId: lote.id,
        grupo,
        sequencia,
        processo: 'conferencia',
        transportesPorRota: input.transportesPorRota,
        transporteIds: input.transporteIds,
      });
      sequencia += 1;
    }

    for (const minuta of minutasCarregamento) {
      await inserirMinutaCarregamento(tx, {
        loteId: lote.id,
        minuta,
        sequencia,
      });
      sequencia += 1;
    }

    await tx
      .update(transportes)
      .set({
        mapaGeradoEm: sql`now()`,
        ultimoMapaLoteId: lote.id,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(transportes.unidadeId, input.unidadeId),
          inArray(transportes.numeroTransporte, input.transporteIds),
        ),
      );

    return mapMapaLoteRecord(lote);
  });
}
