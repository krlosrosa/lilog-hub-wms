import { and, eq, isNull } from 'drizzle-orm';

import type { SessaoFuncionarioRecord } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  equipes,
  funcionarios,
  sessaoFuncionarios,
} from '../providers/drizzle/config/migrations/schema.js';

export async function encerrarFuncionarioApoioDb(
  db: DrizzleClient,
  sessaoId: string,
  sessaoFuncionarioId: string,
  _userId: number,
): Promise<SessaoFuncionarioRecord> {
  const now = new Date();

  const [updated] = await db
    .update(sessaoFuncionarios)
    .set({
      apoioFim: now,
      checkOut: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(sessaoFuncionarios.sessaoId, sessaoId),
        eq(sessaoFuncionarios.id, sessaoFuncionarioId),
        eq(sessaoFuncionarios.tipoVinculo, 'apoio'),
        isNull(sessaoFuncionarios.apoioFim),
      ),
    )
    .returning({ id: sessaoFuncionarios.id });

  if (!updated) {
    throw new Error('Apoio ativo não encontrado na sessão');
  }

  const [row] = await db
    .select({
      id: sessaoFuncionarios.id,
      funcionarioId: sessaoFuncionarios.funcionarioId,
      matricula: funcionarios.matricula,
      nome: funcionarios.nome,
      cargo: funcionarios.cargo,
      status: sessaoFuncionarios.status,
      checkIn: sessaoFuncionarios.checkIn,
      checkOut: sessaoFuncionarios.checkOut,
      observacao: sessaoFuncionarios.observacao,
      tipoVinculo: sessaoFuncionarios.tipoVinculo,
      equipeOrigemId: sessaoFuncionarios.equipeOrigemId,
      equipeOrigemNome: equipes.nome,
      apoioInicio: sessaoFuncionarios.apoioInicio,
      apoioFim: sessaoFuncionarios.apoioFim,
      createdAt: sessaoFuncionarios.createdAt,
      updatedAt: sessaoFuncionarios.updatedAt,
    })
    .from(sessaoFuncionarios)
    .innerJoin(
      funcionarios,
      eq(sessaoFuncionarios.funcionarioId, funcionarios.id),
    )
    .leftJoin(equipes, eq(sessaoFuncionarios.equipeOrigemId, equipes.id))
    .where(eq(sessaoFuncionarios.id, updated.id))
    .limit(1);

  if (!row) {
    throw new Error('Failed to load encerrado funcionario apoio');
  }

  return {
    id: row.id,
    funcionarioId: row.funcionarioId,
    matricula: row.matricula,
    nome: row.nome,
    cargo: row.cargo,
    status: row.status,
    checkIn: row.checkIn,
    checkOut: row.checkOut,
    observacao: row.observacao,
    tipoVinculo: row.tipoVinculo,
    equipeOrigemId: row.equipeOrigemId,
    equipeOrigemNome: row.equipeOrigemNome,
    apoioInicio: row.apoioInicio,
    apoioFim: row.apoioFim,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
