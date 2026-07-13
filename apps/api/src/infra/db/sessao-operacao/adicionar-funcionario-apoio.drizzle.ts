import { and, eq, isNotNull } from 'drizzle-orm';

import type { AdicionarFuncionarioApoioInput } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { SessaoFuncionarioRecord } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  equipes,
  funcionarios,
  sessaoFuncionarios,
} from '../providers/drizzle/config/migrations/schema.js';

async function loadSessaoFuncionarioRecord(
  db: DrizzleClient,
  sessaoFuncionarioId: string,
): Promise<SessaoFuncionarioRecord> {
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
    .where(eq(sessaoFuncionarios.id, sessaoFuncionarioId))
    .limit(1);

  if (!row) {
    throw new Error('Failed to load funcionario apoio');
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

export async function adicionarFuncionarioApoioDb(
  db: DrizzleClient,
  input: AdicionarFuncionarioApoioInput,
): Promise<SessaoFuncionarioRecord> {
  const now = new Date();

  const [existing] = await db
    .select({ id: sessaoFuncionarios.id })
    .from(sessaoFuncionarios)
    .where(
      and(
        eq(sessaoFuncionarios.sessaoId, input.sessaoId),
        eq(sessaoFuncionarios.funcionarioId, input.funcionarioId),
        eq(sessaoFuncionarios.tipoVinculo, 'apoio'),
        isNotNull(sessaoFuncionarios.apoioFim),
      ),
    )
    .limit(1);

  if (existing) {
    const [reactivated] = await db
      .update(sessaoFuncionarios)
      .set({
        status: 'presente',
        checkIn: now,
        checkOut: null,
        equipeOrigemId: input.equipeOrigemId,
        sessaoOrigemId: input.sessaoOrigemId,
        apoioInicio: now,
        apoioFim: null,
        apoioRegistradoPorUserId: input.userId,
        updatedAt: now,
      })
      .where(eq(sessaoFuncionarios.id, existing.id))
      .returning({ id: sessaoFuncionarios.id });

    if (!reactivated) {
      throw new Error('Failed to reactivate funcionario apoio');
    }

    return loadSessaoFuncionarioRecord(db, reactivated.id);
  }

  const [inserted] = await db
    .insert(sessaoFuncionarios)
    .values({
      sessaoId: input.sessaoId,
      funcionarioId: input.funcionarioId,
      status: 'presente',
      checkIn: now,
      tipoVinculo: 'apoio',
      equipeOrigemId: input.equipeOrigemId,
      sessaoOrigemId: input.sessaoOrigemId,
      apoioInicio: now,
      apoioRegistradoPorUserId: input.userId,
    })
    .returning({ id: sessaoFuncionarios.id });

  if (!inserted) {
    throw new Error('Failed to add funcionario apoio');
  }

  return loadSessaoFuncionarioRecord(db, inserted.id);
}
