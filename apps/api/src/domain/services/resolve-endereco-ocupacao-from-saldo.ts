import type { EnderecoStatus } from '../model/endereco/endereco.model.js';
import type { EnderecoRecord } from '../repositories/endereco/endereco.repository.js';

const STATUSES_PRESERVADOS: EnderecoStatus[] = [
  'bloqueado',
  'inventario',
  'inativo',
];

export function resolveEffectiveEnderecoStatus(
  dbStatus: EnderecoStatus,
  totalSaldoQuantidade: number,
): EnderecoStatus {
  if (STATUSES_PRESERVADOS.includes(dbStatus)) {
    return dbStatus;
  }

  return totalSaldoQuantidade > 0 ? 'ocupado' : 'disponivel';
}

export function resolveEffectiveOcupacaoPercent(
  dbOcupacaoPercent: string | number,
  totalSaldoQuantidade: number,
): string {
  if (totalSaldoQuantidade <= 0) {
    return '0';
  }

  const stored = Number(dbOcupacaoPercent ?? 0);
  if (stored > 0) {
    return String(stored);
  }

  return '100';
}

export function applyOcupacaoFromSaldoToEndereco(
  endereco: EnderecoRecord,
  totalSaldoQuantidade: number,
): EnderecoRecord {
  return {
    ...endereco,
    status: resolveEffectiveEnderecoStatus(
      endereco.status,
      totalSaldoQuantidade,
    ),
    ocupacaoPercent: resolveEffectiveOcupacaoPercent(
      endereco.ocupacaoPercent,
      totalSaldoQuantidade,
    ),
  };
}
