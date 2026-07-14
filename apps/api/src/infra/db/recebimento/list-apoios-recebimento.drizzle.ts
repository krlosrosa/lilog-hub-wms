import { and, eq, inArray } from 'drizzle-orm';

import type {
  ApoioRecebimentoRecord,
  RecebimentoAlocacaoRecord,
} from '../../../domain/repositories/recebimento/recebimento-alocacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { funcionarios } from '../providers/drizzle/config/schemas/auth.schema.js';
import { recebimentoAlocacoes } from '../providers/drizzle/config/migrations/schema.js';
import {
  ALOCACAO_RECEBIMENTO_RETURNING,
  mapAlocacaoRecebimentoRow,
} from './map-alocacao-recebimento.drizzle.js';

export async function listApoiosByPreRecebimentoIdDb(
  db: DrizzleClient,
  preRecebimentoId: string,
): Promise<ApoioRecebimentoRecord[]> {
  const rows = await db
    .select({
      id: recebimentoAlocacoes.id,
      preRecebimentoId: recebimentoAlocacoes.preRecebimentoId,
      funcionarioId: recebimentoAlocacoes.funcionarioId,
      funcionarioNome: funcionarios.nome,
      funcionarioMatricula: funcionarios.matricula,
      status: recebimentoAlocacoes.status,
      atribuidoEm: recebimentoAlocacoes.atribuidoEm,
    })
    .from(recebimentoAlocacoes)
    .innerJoin(
      funcionarios,
      eq(funcionarios.id, recebimentoAlocacoes.funcionarioId),
    )
    .where(
      and(
        eq(recebimentoAlocacoes.preRecebimentoId, preRecebimentoId),
        eq(recebimentoAlocacoes.papel, 'apoio'),
        inArray(recebimentoAlocacoes.status, ['atribuida', 'iniciada']),
      ),
    )
    .orderBy(recebimentoAlocacoes.atribuidoEm);

  return rows.map((row) => ({
    id: row.id,
    preRecebimentoId: row.preRecebimentoId,
    funcionarioId: row.funcionarioId,
    funcionarioNome: row.funcionarioNome,
    funcionarioMatricula: row.funcionarioMatricula,
    status: row.status,
    atribuidoEm: row.atribuidoEm,
  }));
}

export async function listApoiosByFuncionarioDb(
  db: DrizzleClient,
  sessaoId: string,
  funcionarioId: number,
): Promise<RecebimentoAlocacaoRecord[]> {
  const rows = await db
    .select(ALOCACAO_RECEBIMENTO_RETURNING)
    .from(recebimentoAlocacoes)
    .where(
      and(
        eq(recebimentoAlocacoes.sessaoId, sessaoId),
        eq(recebimentoAlocacoes.funcionarioId, funcionarioId),
        eq(recebimentoAlocacoes.papel, 'apoio'),
        inArray(recebimentoAlocacoes.status, ['atribuida', 'iniciada']),
      ),
    );

  return rows.map(mapAlocacaoRecebimentoRow);
}

export async function findApoioAtivoDb(
  db: DrizzleClient,
  preRecebimentoId: string,
  funcionarioId: number,
): Promise<RecebimentoAlocacaoRecord | null> {
  const [row] = await db
    .select(ALOCACAO_RECEBIMENTO_RETURNING)
    .from(recebimentoAlocacoes)
    .where(
      and(
        eq(recebimentoAlocacoes.preRecebimentoId, preRecebimentoId),
        eq(recebimentoAlocacoes.funcionarioId, funcionarioId),
        eq(recebimentoAlocacoes.papel, 'apoio'),
        inArray(recebimentoAlocacoes.status, ['atribuida', 'iniciada']),
      ),
    )
    .limit(1);

  return row ? mapAlocacaoRecebimentoRow(row) : null;
}
