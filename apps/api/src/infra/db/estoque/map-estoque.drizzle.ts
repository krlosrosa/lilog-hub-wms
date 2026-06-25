import type { Deposito } from '../../../domain/model/estoque/deposito.model.js';
import type { MovimentacaoEstoque } from '../../../domain/model/estoque/movimentacao-estoque.model.js';
import type { Saldo } from '../../../domain/model/estoque/saldo.model.js';
import type {
  depositos,
  movimentacoesEstoque,
  saldos,
} from '../providers/drizzle/config/migrations/schema.js';

export function normalizeLote(lote?: string | null): string {
  return lote?.trim() ?? '';
}

export function normalizeNumeroSerie(numeroSerie?: string | null): string {
  return numeroSerie?.trim() ?? '';
}

export function toQuantityNumber(value: string): number {
  return Number(value);
}

export function toQuantityString(value: number): string {
  return value.toFixed(4);
}

export function mapDepositoRow(
  row: typeof depositos.$inferSelect,
): Deposito {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    codigo: row.codigo,
    nome: row.nome,
    finalidade: row.finalidade,
    permiteVenda: row.permiteVenda,
    permitePicking: row.permitePicking,
    exigeEndereco: row.exigeEndereco,
    contaDisponivel: row.contaDisponivel,
    sistema: row.sistema,
    ativo: row.ativo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapSaldoRow(
  row: typeof saldos.$inferSelect,
  deposito?: Pick<typeof depositos.$inferSelect, 'codigo' | 'nome'>,
): Saldo {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    produtoId: row.produtoId,
    depositoId: row.depositoId,
    depositoCodigo: deposito?.codigo,
    depositoNome: deposito?.nome,
    lote: row.lote,
    validade: row.validade,
    numeroSerie: row.numeroSerie,
    natureza: row.natureza,
    quantidade: toQuantityNumber(row.quantidade),
    unidadeMedida: row.unidadeMedida,
    documentoRef: row.documentoRef || undefined,
    updatedAt: row.updatedAt,
  };
}

export function mapMovimentacaoRow(
  row: typeof movimentacoesEstoque.$inferSelect,
): MovimentacaoEstoque {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    produtoId: row.produtoId,
    depositoOrigemId: row.depositoOrigemId,
    depositoDestinoId: row.depositoDestinoId,
    tipoMovimento: row.tipoMovimento,
    quantidade: row.quantidade,
    unidadeMedida: row.unidadeMedida,
    lote: row.lote,
    validade: row.validade,
    numeroSerie: row.numeroSerie,
    natureza: row.natureza,
    documentoRef: row.documentoRef,
    motivo: row.motivo,
    operatorId: row.operatorId,
    occurredAt: row.occurredAt,
    createdAt: row.createdAt,
  };
}
