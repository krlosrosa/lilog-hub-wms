import type { CreateOperacaoDocaInput } from '../../../domain/model/doca/doca.model.js';
import type {
  OperacaoDocaRecord,
  UpdateOperacaoDocaData,
} from '../../../domain/repositories/operacao-doca/operacao-doca.repository.js';
import type { operacoesDoca } from '../providers/drizzle/config/migrations/schema.js';

type OperacaoDocaRow = typeof operacoesDoca.$inferSelect;

export function mapOperacaoDocaRow(row: OperacaoDocaRow): OperacaoDocaRecord {
  return {
    id: row.id,
    docaId: row.docaId,
    tipoOperacao: row.tipoOperacao,
    veiculoId: row.veiculoId,
    transportadoraId: row.transportadoraId,
    motorista: row.motorista,
    dataPrevista: row.dataPrevista,
    dataInicio: row.dataInicio,
    dataFim: row.dataFim,
    situacao: row.situacao,
    prioridade: row.prioridade,
    observacao: row.observacao,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toOperacaoDocaInsertValues(data: CreateOperacaoDocaInput) {
  return {
    docaId: data.docaId,
    tipoOperacao: data.tipoOperacao as OperacaoDocaRow['tipoOperacao'],
    veiculoId: data.veiculoId,
    transportadoraId: data.transportadoraId,
    motorista: data.motorista ?? null,
    dataPrevista: data.dataPrevista ?? null,
    situacao: 'agendada' as OperacaoDocaRow['situacao'],
    prioridade: (data.prioridade ?? 'normal') as OperacaoDocaRow['prioridade'],
    observacao: data.observacao ?? null,
  };
}

export function toOperacaoDocaUpdateValues(data: UpdateOperacaoDocaData) {
  const values: Partial<typeof operacoesDoca.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.situacao !== undefined) {
    values.situacao = data.situacao as OperacaoDocaRow['situacao'];
  }
  if (data.dataInicio !== undefined) values.dataInicio = data.dataInicio;
  if (data.dataFim !== undefined) values.dataFim = data.dataFim;
  if (data.observacao !== undefined) values.observacao = data.observacao;

  return values;
}
