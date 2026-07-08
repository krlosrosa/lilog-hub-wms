import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';

import type { CreateRegraProcessoInput } from '../../../domain/model/regra-processo/regra-processo.model.js';
import type {
  AcaoRegra,
  ArvoreCondicoes,
  GatilhoRegra,
  ModoAvaliacaoRegra,
} from '../../../domain/model/regra-processo/regra-processo.model.js';
import type {
  ListRegrasProcessoFilter,
  RegraProcessoRecord,
} from '../../../domain/repositories/regra-processo/regra-processo.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { regrasProcesso } from '../providers/drizzle/config/migrations/schema.js';

function mapRegra(row: typeof regrasProcesso.$inferSelect): RegraProcessoRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    nome: row.nome,
    descricao: row.descricao,
    gatilho: row.gatilho as GatilhoRegra,
    prioridade: row.prioridade,
    modoAvaliacao: row.modoAvaliacao as ModoAvaliacaoRegra,
    arvoreCondicoes: row.arvoreCondicoes as ArvoreCondicoes,
    acoes: row.acoes as AcaoRegra[],
    ativo: row.ativo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createRegraProcessoDb(
  db: DrizzleClient,
  input: CreateRegraProcessoInput,
): Promise<RegraProcessoRecord> {
  const [created] = await db
    .insert(regrasProcesso)
    .values({
      unidadeId: input.unidadeId,
      nome: input.nome,
      descricao: input.descricao ?? null,
      gatilho: input.gatilho,
      prioridade: input.prioridade,
      modoAvaliacao: input.modoAvaliacao,
      arvoreCondicoes: input.arvoreCondicoes,
      acoes: input.acoes,
      ativo: input.ativo,
    })
    .returning();

  if (!created) {
    throw new Error('Failed to create regra processo');
  }

  return mapRegra(created);
}

export async function findRegraProcessoByIdDb(
  db: DrizzleClient,
  id: string,
): Promise<RegraProcessoRecord | null> {
  const [row] = await db
    .select()
    .from(regrasProcesso)
    .where(eq(regrasProcesso.id, id))
    .limit(1);

  return row ? mapRegra(row) : null;
}

export async function findRegraProcessoByNomeDb(
  db: DrizzleClient,
  unidadeId: string,
  gatilho: GatilhoRegra,
  nome: string,
): Promise<RegraProcessoRecord | null> {
  const [row] = await db
    .select()
    .from(regrasProcesso)
    .where(
      and(
        eq(regrasProcesso.unidadeId, unidadeId),
        eq(regrasProcesso.gatilho, gatilho),
        eq(regrasProcesso.nome, nome),
      ),
    )
    .limit(1);

  return row ? mapRegra(row) : null;
}

export async function listRegrasProcessoDb(
  db: DrizzleClient,
  filter: ListRegrasProcessoFilter,
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;
  const conditions = [eq(regrasProcesso.unidadeId, filter.unidadeId)];

  if (filter.gatilho) {
    conditions.push(eq(regrasProcesso.gatilho, filter.gatilho));
  }

  if (filter.ativo !== undefined) {
    conditions.push(eq(regrasProcesso.ativo, filter.ativo));
  }

  if (filter.search?.trim()) {
    const term = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(regrasProcesso.nome, term),
        ilike(regrasProcesso.descricao, term),
      )!,
    );
  }

  const whereClause = and(...conditions);

  const rows = await db
    .select()
    .from(regrasProcesso)
    .where(whereClause)
    .orderBy(asc(regrasProcesso.prioridade), desc(regrasProcesso.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(regrasProcesso)
    .where(whereClause);

  return {
    items: rows.map(mapRegra),
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  };
}

export async function listRegrasAtivasPorGatilhoDb(
  db: DrizzleClient,
  unidadeId: string,
  gatilho: GatilhoRegra,
): Promise<RegraProcessoRecord[]> {
  const rows = await db
    .select()
    .from(regrasProcesso)
    .where(
      and(
        eq(regrasProcesso.unidadeId, unidadeId),
        eq(regrasProcesso.gatilho, gatilho),
        eq(regrasProcesso.ativo, true),
      ),
    )
    .orderBy(asc(regrasProcesso.prioridade));

  return rows.map(mapRegra);
}

export async function updateRegraProcessoDb(
  db: DrizzleClient,
  id: string,
  input: {
    nome?: string;
    descricao?: string | null;
    gatilho?: GatilhoRegra;
    prioridade?: number;
    modoAvaliacao?: ModoAvaliacaoRegra;
    arvoreCondicoes?: ArvoreCondicoes;
    acoes?: AcaoRegra[];
    ativo?: boolean;
  },
): Promise<RegraProcessoRecord | null> {
  const patch: Partial<typeof regrasProcesso.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.nome !== undefined) patch.nome = input.nome;
  if (input.descricao !== undefined) patch.descricao = input.descricao;
  if (input.gatilho !== undefined) patch.gatilho = input.gatilho;
  if (input.prioridade !== undefined) patch.prioridade = input.prioridade;
  if (input.modoAvaliacao !== undefined) patch.modoAvaliacao = input.modoAvaliacao;
  if (input.arvoreCondicoes !== undefined) {
    patch.arvoreCondicoes = input.arvoreCondicoes;
  }
  if (input.acoes !== undefined) patch.acoes = input.acoes;
  if (input.ativo !== undefined) patch.ativo = input.ativo;

  const [updated] = await db
    .update(regrasProcesso)
    .set(patch)
    .where(eq(regrasProcesso.id, id))
    .returning();

  return updated ? mapRegra(updated) : null;
}

export async function deleteRegraProcessoDb(
  db: DrizzleClient,
  id: string,
): Promise<void> {
  await db.delete(regrasProcesso).where(eq(regrasProcesso.id, id));
}

export async function countRegrasProcessoStatsDb(
  db: DrizzleClient,
  unidadeId: string,
) {
  const [result] = await db
    .select({
      total: sql<number>`count(*)::int`,
      ativas: sql<number>`count(*) filter (where ${regrasProcesso.ativo} = true)::int`,
      inativas: sql<number>`count(*) filter (where ${regrasProcesso.ativo} = false)::int`,
    })
    .from(regrasProcesso)
    .where(eq(regrasProcesso.unidadeId, unidadeId));

  return {
    total: result?.total ?? 0,
    ativas: result?.ativas ?? 0,
    inativas: result?.inativas ?? 0,
  };
}
