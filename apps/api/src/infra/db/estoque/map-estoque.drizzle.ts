import type { Deposito } from '../../../domain/model/estoque/deposito.model.js';
import type { ReservaEstoque } from '../../../domain/model/estoque/reserva-estoque.model.js';
import type { MotivoBloqueioSaldoResumo } from '../../../domain/model/estoque/saldo-endereco.model.js';
import type { SaldoEndereco } from '../../../domain/model/estoque/saldo-endereco.model.js';
import type {
  depositos,
  motivosBloqueioSaldo,
  reservasEstoque,
  saldosEndereco,
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

export function mapSaldoEnderecoRow(
  row: typeof saldosEndereco.$inferSelect,
  options?: {
    enderecoMascarado?: string;
    motivo?: typeof motivosBloqueioSaldo.$inferSelect | null;
  },
): SaldoEndereco {
  const motivoResumo: MotivoBloqueioSaldoResumo | null = options?.motivo
    ? {
        id: options.motivo.id,
        codigo: options.motivo.codigo,
        nome: options.motivo.nome,
      }
    : null;

  return {
    id: row.id,
    unidadeId: row.unidadeId,
    produtoId: row.produtoId,
    depositoId: row.depositoId,
    enderecoId: row.enderecoId,
    enderecoMascarado: options?.enderecoMascarado,
    lote: row.lote,
    validade: row.validade,
    numeroSerie: row.numeroSerie,
    natureza: row.natureza,
    status: row.status,
    motivoBloqueio: motivoResumo,
    observacaoBloqueio: row.observacaoBloqueio,
    bloqueadoEm: row.bloqueadoEm,
    bloqueadoPor: row.bloqueadoPor,
    quantidade: toQuantityNumber(row.quantidade),
    unidadeMedida: row.unidadeMedida,
    updatedAt: row.updatedAt,
  };
}

export function mapReservaEstoqueRow(
  row: typeof reservasEstoque.$inferSelect,
): ReservaEstoque {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    produtoId: row.produtoId,
    depositoId: row.depositoId,
    enderecoId: row.enderecoId,
    lote: row.lote,
    numeroSerie: row.numeroSerie,
    quantidade: toQuantityNumber(row.quantidade),
    quantidadeAtendida: toQuantityNumber(row.quantidadeAtendida),
    status: row.status,
    origem: row.origem,
    documentoRef: row.documentoRef,
    motivo: row.motivo,
    operatorId: row.operatorId,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
