import type { SessaoFuncionarioPausaRecord } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { sessaoFuncionarioPausas } from '../providers/drizzle/config/migrations/schema.js';

type PausaRow = typeof sessaoFuncionarioPausas.$inferSelect;

export function mapSessaoPausaRow(row: PausaRow): SessaoFuncionarioPausaRecord {
  return {
    id: row.id,
    sessaoFuncionarioId: row.sessaoFuncionarioId,
    tipo: row.tipo,
    inicio: row.inicio,
    fim: row.fim,
    registradoPorUserId: row.registradoPorUserId,
    observacao: row.observacao,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function calcularTotalPausasMinutos(
  items: SessaoFuncionarioPausaRecord[],
  now = new Date(),
): number {
  const totalMs = items.reduce((acc, item) => {
    const fim = item.fim ?? now;
    return acc + (fim.getTime() - item.inicio.getTime());
  }, 0);

  return Math.round(totalMs / 60_000);
}
