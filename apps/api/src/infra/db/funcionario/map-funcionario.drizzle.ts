import type { FuncionarioRecord } from '../../../domain/repositories/funcionario/funcionario.repository.js';
import type { funcionarios } from '../providers/drizzle/config/migrations/schema.js';

export function mapFuncionarioRow(
  row: typeof funcionarios.$inferSelect,
): FuncionarioRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    matricula: row.matricula,
    nome: row.nome,
    cargo: row.cargo as FuncionarioRecord['cargo'],
    situacao: row.situacao as FuncionarioRecord['situacao'],
    dataAdmissao: new Date(row.dataAdmissao),
    telefone: row.telefone,
    email: row.email,
    observacao: row.observacao,
    createdAt: row.createdAt,
  };
}
