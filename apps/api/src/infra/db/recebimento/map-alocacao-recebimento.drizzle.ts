import type { RecebimentoAlocacaoRecord } from '../../../domain/repositories/recebimento/recebimento-alocacao.repository.js';
import { recebimentoAlocacoes } from '../providers/drizzle/config/migrations/schema.js';

type AlocacaoRow = Pick<
  typeof recebimentoAlocacoes.$inferSelect,
  | 'id'
  | 'preRecebimentoId'
  | 'sessaoId'
  | 'sessaoFuncionarioId'
  | 'funcionarioId'
  | 'papel'
  | 'status'
  | 'atribuidoEm'
  | 'inicioEm'
  | 'canceladoEm'
  | 'encerradoEm'
>;

export function mapAlocacaoRecebimentoRow(row: AlocacaoRow): RecebimentoAlocacaoRecord {
  return {
    id: row.id,
    preRecebimentoId: row.preRecebimentoId,
    sessaoId: row.sessaoId,
    sessaoFuncionarioId: row.sessaoFuncionarioId,
    funcionarioId: row.funcionarioId,
    papel: row.papel,
    status: row.status,
    atribuidoEm: row.atribuidoEm,
    inicioEm: row.inicioEm,
    canceladoEm: row.canceladoEm,
    encerradoEm: row.encerradoEm,
  };
}

export const ALOCACAO_RECEBIMENTO_RETURNING = {
  id: recebimentoAlocacoes.id,
  preRecebimentoId: recebimentoAlocacoes.preRecebimentoId,
  sessaoId: recebimentoAlocacoes.sessaoId,
  sessaoFuncionarioId: recebimentoAlocacoes.sessaoFuncionarioId,
  funcionarioId: recebimentoAlocacoes.funcionarioId,
  papel: recebimentoAlocacoes.papel,
  status: recebimentoAlocacoes.status,
  atribuidoEm: recebimentoAlocacoes.atribuidoEm,
  inicioEm: recebimentoAlocacoes.inicioEm,
  canceladoEm: recebimentoAlocacoes.canceladoEm,
  encerradoEm: recebimentoAlocacoes.encerradoEm,
} as const;
