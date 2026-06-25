import type { ClienteEspecialRecord } from '../../../domain/repositories/expedicao/cliente-especial.repository.js';
import type { clientesEspeciais } from '../providers/drizzle/config/migrations/schema.js';

export function mapClienteEspecialRow(
  row: typeof clientesEspeciais.$inferSelect,
): ClienteEspecialRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    codCliente: row.codCliente,
    nomeCliente: row.nomeCliente,
    ativo: row.ativo,
    exigeSegregacaoMapa: row.exigeSegregacaoMapa,
    exigeSeparacaoEspecial: row.exigeSeparacaoEspecial,
    exigeCarregamentoEspecial: row.exigeCarregamentoEspecial,
    observacaoSeparacao: row.observacaoSeparacao,
    observacaoCarregamento: row.observacaoCarregamento,
    observacaoGeral: row.observacaoGeral,
    criadoPor: row.criadoPor,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
