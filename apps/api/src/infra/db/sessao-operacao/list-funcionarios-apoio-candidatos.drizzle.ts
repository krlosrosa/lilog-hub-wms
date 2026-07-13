import { and, eq, inArray, isNull, ne, notInArray, or } from 'drizzle-orm';

import type { FuncionarioApoioCandidatoRecord } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  equipes,
  funcionarios,
  sessaoFuncionarios,
  sessoesTrabalho,
} from '../providers/drizzle/config/migrations/schema.js';

export async function listFuncionariosApoioCandidatosDb(
  db: DrizzleClient,
  unidadeId: string,
  sessaoDestinoId: string,
): Promise<FuncionarioApoioCandidatoRecord[]> {
  const destinoRows = await db
    .select({ funcionarioId: sessaoFuncionarios.funcionarioId })
    .from(sessaoFuncionarios)
    .where(
      and(
        eq(sessaoFuncionarios.sessaoId, sessaoDestinoId),
        or(
          eq(sessaoFuncionarios.tipoVinculo, 'titular'),
          and(
            eq(sessaoFuncionarios.tipoVinculo, 'apoio'),
            isNull(sessaoFuncionarios.apoioFim),
          ),
        ),
      ),
    );

  const destinoFuncionarioIds = destinoRows.map((row) => row.funcionarioId);

  const rows = await db
    .select({
      funcionarioId: sessaoFuncionarios.funcionarioId,
      matricula: funcionarios.matricula,
      nome: funcionarios.nome,
      cargo: funcionarios.cargo,
      sessaoOrigemId: sessoesTrabalho.id,
      equipeOrigemId: equipes.id,
      equipeOrigemNome: equipes.nome,
      equipeOrigemArea: equipes.area,
      statusPresenca: sessaoFuncionarios.status,
    })
    .from(sessaoFuncionarios)
    .innerJoin(
      sessoesTrabalho,
      eq(sessaoFuncionarios.sessaoId, sessoesTrabalho.id),
    )
    .innerJoin(equipes, eq(sessoesTrabalho.equipeId, equipes.id))
    .innerJoin(
      funcionarios,
      eq(sessaoFuncionarios.funcionarioId, funcionarios.id),
    )
    .where(
      and(
        eq(sessoesTrabalho.unidadeId, unidadeId),
        eq(sessoesTrabalho.status, 'aberta'),
        ne(sessoesTrabalho.id, sessaoDestinoId),
        eq(sessaoFuncionarios.tipoVinculo, 'titular'),
        inArray(sessaoFuncionarios.status, ['presente', 'atraso']),
        destinoFuncionarioIds.length > 0
          ? notInArray(sessaoFuncionarios.funcionarioId, destinoFuncionarioIds)
          : undefined,
      ),
    )
    .orderBy(funcionarios.nome);

  return rows.map((row) => ({
    funcionarioId: row.funcionarioId,
    matricula: row.matricula,
    nome: row.nome,
    cargo: row.cargo,
    sessaoOrigemId: row.sessaoOrigemId,
    equipeOrigemId: row.equipeOrigemId,
    equipeOrigemNome: row.equipeOrigemNome,
    equipeOrigemArea: row.equipeOrigemArea,
    statusPresenca: row.statusPresenca,
  }));
}
