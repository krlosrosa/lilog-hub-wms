import { and, eq, isNull, or, sql } from 'drizzle-orm';

import type { SessaoFuncionarioRecord } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  equipes,
  funcionarios,
  sessaoFuncionarios,
} from '../providers/drizzle/config/migrations/schema.js';

function mapRow(row: {
  id: string;
  funcionarioId: number;
  matricula: string;
  nome: string;
  cargo: string;
  status: SessaoFuncionarioRecord['status'];
  checkIn: Date | null;
  checkOut: Date | null;
  observacao: string | null;
  tipoVinculo: SessaoFuncionarioRecord['tipoVinculo'];
  equipeOrigemId: string | null;
  equipeOrigemNome: string | null;
  apoioInicio: Date | null;
  apoioFim: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): SessaoFuncionarioRecord {
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

export async function listSessaoFuncionariosDb(
  db: DrizzleClient,
  sessaoId: string,
): Promise<SessaoFuncionarioRecord[]> {
  const rows = await db
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
    .where(
      and(
        eq(sessaoFuncionarios.sessaoId, sessaoId),
        or(
          eq(sessaoFuncionarios.tipoVinculo, 'titular'),
          and(
            eq(sessaoFuncionarios.tipoVinculo, 'apoio'),
            isNull(sessaoFuncionarios.apoioFim),
          ),
        ),
      ),
    )
    .orderBy(funcionarios.nome);

  return rows.map(mapRow);
}
