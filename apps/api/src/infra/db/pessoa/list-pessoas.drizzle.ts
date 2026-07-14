import { and, count, eq, ilike, isNotNull, isNull, or, sql } from 'drizzle-orm';

import type {
  ListPessoasFilter,
  ListPessoasResult,
  PessoaRecord,
} from '../../../domain/repositories/pessoa/pessoa.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  equipeFuncionarios,
  equipes,
  funcionarios,
  users,
} from '../providers/drizzle/config/migrations/schema.js';

const equipeAtualSubquery = sql<string | null>`(
  SELECT ${equipes.id}::text
  FROM ${equipeFuncionarios}
  INNER JOIN ${equipes} ON ${equipes.id} = ${equipeFuncionarios.equipeId}
  WHERE ${equipeFuncionarios.funcionarioId} = ${funcionarios.id}
  ORDER BY ${equipeFuncionarios.createdAt} DESC
  LIMIT 1
)`;

const equipeNomeSubquery = sql<string | null>`(
  SELECT ${equipes.nome}
  FROM ${equipeFuncionarios}
  INNER JOIN ${equipes} ON ${equipes.id} = ${equipeFuncionarios.equipeId}
  WHERE ${equipeFuncionarios.funcionarioId} = ${funcionarios.id}
  ORDER BY ${equipeFuncionarios.createdAt} DESC
  LIMIT 1
)`;

function buildWhere(filter: ListPessoasFilter) {
  const conditions = [];

  if (filter.unidadeId) {
    conditions.push(eq(funcionarios.unidadeId, filter.unidadeId));
  }

  if (filter.situacao) {
    conditions.push(eq(funcionarios.situacao, filter.situacao));
  }

  if (filter.cargo) {
    conditions.push(eq(funcionarios.cargo, filter.cargo));
  }

  if (filter.funcionarioId) {
    conditions.push(eq(funcionarios.id, filter.funcionarioId));
  }

  if (filter.search?.trim()) {
    const term = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(funcionarios.nome, term),
        ilike(funcionarios.matricula, term),
      ),
    );
  }

  if (filter.temAcesso === true) {
    conditions.push(isNotNull(users.id));
  }

  if (filter.temAcesso === false) {
    conditions.push(isNull(users.id));
  }

  if (filter.equipeId) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${equipeFuncionarios}
        WHERE ${equipeFuncionarios.funcionarioId} = ${funcionarios.id}
          AND ${equipeFuncionarios.equipeId} = ${filter.equipeId}
      )`,
    );
  }

  if (filter.semEquipe) {
    conditions.push(
      sql`NOT EXISTS (
        SELECT 1 FROM ${equipeFuncionarios}
        WHERE ${equipeFuncionarios.funcionarioId} = ${funcionarios.id}
      )`,
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function mapRow(row: {
  funcionario: typeof funcionarios.$inferSelect;
  user: typeof users.$inferSelect | null;
  equipeId: string | null;
  equipeNome: string | null;
}): PessoaRecord {
  return {
    funcionarioId: row.funcionario.id,
    matricula: row.funcionario.matricula,
    nome: row.funcionario.nome,
    cargo: row.funcionario.cargo,
    situacao: row.funcionario.situacao as PessoaRecord['situacao'],
    unidadeId: row.funcionario.unidadeId,
    dataAdmissao: new Date(row.funcionario.dataAdmissao),
    equipeId: row.equipeId,
    equipeNome: row.equipeNome,
    userId: row.user?.id ?? null,
    userStatus: (row.user?.status as PessoaRecord['userStatus']) ?? null,
    userRole: (row.user?.role as PessoaRecord['userRole']) ?? null,
    mustChangePassword: row.user?.mustChangePassword ?? null,
    userEmail: row.user?.email ?? null,
  };
}

export async function listPessoasDb(
  db: DrizzleClient,
  filter: ListPessoasFilter,
): Promise<ListPessoasResult> {
  const where = buildWhere(filter);
  const offset = (filter.page - 1) * filter.limit;

  const [totalRow] = await db
    .select({ total: count() })
    .from(funcionarios)
    .leftJoin(users, eq(users.funcionarioId, funcionarios.id))
    .where(where);

  const rows = await db
    .select({
      funcionario: funcionarios,
      user: users,
      equipeId: equipeAtualSubquery.as('equipe_id'),
      equipeNome: equipeNomeSubquery.as('equipe_nome'),
    })
    .from(funcionarios)
    .leftJoin(users, eq(users.funcionarioId, funcionarios.id))
    .where(where)
    .orderBy(sql`${funcionarios.nome} asc`)
    .limit(filter.limit)
    .offset(offset);

  return {
    items: rows.map(mapRow),
    total: Number(totalRow?.total ?? 0),
    page: filter.page,
    limit: filter.limit,
  };
}
