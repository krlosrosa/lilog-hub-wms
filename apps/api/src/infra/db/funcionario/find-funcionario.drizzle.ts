import { and, eq } from 'drizzle-orm';

import type { FuncionarioRecord } from '../../../domain/repositories/funcionario/funcionario.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { funcionarios } from '../providers/drizzle/config/migrations/schema.js';
import { mapFuncionarioRow } from './map-funcionario.drizzle.js';

export async function findFuncionarioByIdDb(
  db: DrizzleClient,
  id: number,
): Promise<FuncionarioRecord | null> {
  const [row] = await db
    .select()
    .from(funcionarios)
    .where(eq(funcionarios.id, id))
    .limit(1);

  return row ? mapFuncionarioRow(row) : null;
}

export async function findFuncionarioByMatriculaDb(
  db: DrizzleClient,
  unidadeId: string,
  matricula: string,
): Promise<FuncionarioRecord | null> {
  const [row] = await db
    .select()
    .from(funcionarios)
    .where(
      and(
        eq(funcionarios.unidadeId, unidadeId),
        eq(funcionarios.matricula, matricula),
      ),
    )
    .limit(1);

  return row ? mapFuncionarioRow(row) : null;
}
