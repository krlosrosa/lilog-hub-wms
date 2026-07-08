import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';

import type { CreateRegraEnderecamentoInput } from '../../../domain/model/armazenagem/regra-enderecamento.model.js';
import type {
  ListRegrasEnderecamentoFilter,
  RegraEnderecamentoDestinoRecord,
  RegraEnderecamentoRecord,
} from '../../../domain/repositories/armazenagem/regra-enderecamento.repository.js';
import type { DrizzleClient, DrizzleExecutor } from '../providers/drizzle/drizzle.provider.js';
import {
  enderecos,
  regrasEnderecamento,
  regrasEnderecamentoDestinos,
} from '../providers/drizzle/config/migrations/schema.js';

type DestinoRow = typeof regrasEnderecamentoDestinos.$inferSelect & {
  enderecoLabel: string | null;
};

function mapDestino(row: DestinoRow): RegraEnderecamentoDestinoRecord {
  return {
    id: row.id,
    regraId: row.regraId,
    prioridade: row.prioridade,
    tipo: row.tipo,
    zona: row.zona,
    rua: row.rua,
    enderecoId: row.enderecoId,
    enderecoLabel: row.enderecoLabel,
    ativo: row.ativo,
  };
}

function mapRegra(
  row: typeof regrasEnderecamento.$inferSelect,
  destinos: RegraEnderecamentoDestinoRecord[],
): RegraEnderecamentoRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    nome: row.nome,
    criterioTipo: row.criterioTipo,
    criterioValor: row.criterioValor,
    prioridade: row.prioridade,
    ativo: row.ativo,
    destinos,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function loadDestinosByRegraIds(
  db: DrizzleExecutor,
  regraIds: string[],
): Promise<Map<string, RegraEnderecamentoDestinoRecord[]>> {
  if (regraIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      destino: regrasEnderecamentoDestinos,
      enderecoLabel: enderecos.enderecoMascarado,
    })
    .from(regrasEnderecamentoDestinos)
    .leftJoin(
      enderecos,
      eq(regrasEnderecamentoDestinos.enderecoId, enderecos.id),
    )
    .where(inArray(regrasEnderecamentoDestinos.regraId, regraIds))
    .orderBy(asc(regrasEnderecamentoDestinos.prioridade));

  const grouped = new Map<string, RegraEnderecamentoDestinoRecord[]>();

  for (const row of rows) {
    const mapped = mapDestino({
      ...row.destino,
      enderecoLabel: row.enderecoLabel,
    });
    const current = grouped.get(row.destino.regraId) ?? [];
    current.push(mapped);
    grouped.set(row.destino.regraId, current);
  }

  return grouped;
}

export async function createRegraEnderecamentoDb(
  db: DrizzleClient,
  input: CreateRegraEnderecamentoInput,
): Promise<RegraEnderecamentoRecord> {
  return db.transaction(async (tx) => {
    const [regra] = await tx
      .insert(regrasEnderecamento)
      .values({
        unidadeId: input.unidadeId,
        nome: input.nome,
        criterioTipo: input.criterioTipo,
        criterioValor: input.criterioValor,
        prioridade: input.prioridade,
        ativo: input.ativo,
      })
      .returning();

    if (!regra) {
      throw new Error('Failed to create regra enderecamento');
    }

    await tx.insert(regrasEnderecamentoDestinos).values(
      input.destinos.map((destino) => ({
        regraId: regra.id,
        prioridade: destino.prioridade,
        tipo: destino.tipo,
        zona: destino.tipo === 'zona' ? destino.zona : null,
        rua: destino.tipo === 'zona' ? destino.rua : null,
        enderecoId: destino.tipo === 'endereco' ? destino.enderecoId : null,
        ativo: destino.ativo,
      })),
    );

    const created = await findRegraEnderecamentoByIdDb(tx, regra.id);

    if (!created) {
      throw new Error('Failed to load created regra enderecamento');
    }

    return created;
  });
}

export async function findRegraEnderecamentoByIdDb(
  db: DrizzleExecutor,
  id: string,
): Promise<RegraEnderecamentoRecord | null> {
  const [regra] = await db
    .select()
    .from(regrasEnderecamento)
    .where(eq(regrasEnderecamento.id, id))
    .limit(1);

  if (!regra) {
    return null;
  }

  const destinosMap = await loadDestinosByRegraIds(db, [regra.id]);
  const destinos = destinosMap.get(regra.id) ?? [];

  return mapRegra(regra, destinos);
}

export async function listRegrasEnderecamentoDb(
  db: DrizzleClient,
  filter: ListRegrasEnderecamentoFilter,
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [eq(regrasEnderecamento.unidadeId, filter.unidadeId)];

  if (filter.criterioTipo) {
    conditions.push(eq(regrasEnderecamento.criterioTipo, filter.criterioTipo));
  }

  if (filter.ativo !== undefined) {
    conditions.push(eq(regrasEnderecamento.ativo, filter.ativo));
  }

  if (filter.search?.trim()) {
    const term = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(regrasEnderecamento.nome, term),
        ilike(regrasEnderecamento.criterioValor, term),
      )!,
    );
  }

  const whereClause = and(...conditions);

  const rows = await db
    .select()
    .from(regrasEnderecamento)
    .where(whereClause)
    .orderBy(
      asc(regrasEnderecamento.prioridade),
      desc(regrasEnderecamento.createdAt),
    )
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(regrasEnderecamento)
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;
  const destinosMap = await loadDestinosByRegraIds(
    db,
    rows.map((row) => row.id),
  );

  return {
    items: rows.map((row) => mapRegra(row, destinosMap.get(row.id) ?? [])),
    total,
    page,
    limit,
  };
}

export async function listRegrasAtivasByUnidadeDb(
  db: DrizzleClient,
  unidadeId: string,
): Promise<RegraEnderecamentoRecord[]> {
  const rows = await db
    .select()
    .from(regrasEnderecamento)
    .where(
      and(
        eq(regrasEnderecamento.unidadeId, unidadeId),
        eq(regrasEnderecamento.ativo, true),
      ),
    )
    .orderBy(asc(regrasEnderecamento.prioridade));

  const destinosMap = await loadDestinosByRegraIds(
    db,
    rows.map((row) => row.id),
  );

  return rows.map((row) => mapRegra(row, destinosMap.get(row.id) ?? []));
}

export async function updateRegraEnderecamentoDb(
  db: DrizzleClient,
  id: string,
  input: {
    nome?: string;
    criterioTipo?: CreateRegraEnderecamentoInput['criterioTipo'];
    criterioValor?: string;
    prioridade?: number;
    ativo?: boolean;
    destinos?: CreateRegraEnderecamentoInput['destinos'];
  },
): Promise<RegraEnderecamentoRecord | null> {
  return db.transaction(async (tx) => {
    const patch: Partial<typeof regrasEnderecamento.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.nome !== undefined) {
      patch.nome = input.nome;
    }

    if (input.criterioTipo !== undefined) {
      patch.criterioTipo = input.criterioTipo;
    }

    if (input.criterioValor !== undefined) {
      patch.criterioValor = input.criterioValor;
    }

    if (input.prioridade !== undefined) {
      patch.prioridade = input.prioridade;
    }

    if (input.ativo !== undefined) {
      patch.ativo = input.ativo;
    }

    const [updated] = await tx
      .update(regrasEnderecamento)
      .set(patch)
      .where(eq(regrasEnderecamento.id, id))
      .returning();

    if (!updated) {
      return null;
    }

    if (input.destinos) {
      await tx
        .delete(regrasEnderecamentoDestinos)
        .where(eq(regrasEnderecamentoDestinos.regraId, id));

      await tx.insert(regrasEnderecamentoDestinos).values(
        input.destinos.map((destino) => ({
          regraId: id,
          prioridade: destino.prioridade,
          tipo: destino.tipo,
          zona: destino.tipo === 'zona' ? destino.zona : null,
          rua: destino.tipo === 'zona' ? destino.rua : null,
          enderecoId: destino.tipo === 'endereco' ? destino.enderecoId : null,
          ativo: destino.ativo,
        })),
      );
    }

    return findRegraEnderecamentoByIdDb(tx, id);
  });
}

export async function deleteRegraEnderecamentoDb(
  db: DrizzleClient,
  id: string,
): Promise<void> {
  await db
    .delete(regrasEnderecamento)
    .where(eq(regrasEnderecamento.id, id));
}
