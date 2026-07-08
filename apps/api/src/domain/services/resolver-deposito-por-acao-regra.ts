import type { AcaoRegra } from '../model/regra-processo/regra-processo.model.js';
import type { DepositoCodigo } from '../model/estoque/deposito.model.js';

const ZONA_TO_DEPOSITO: Record<string, DepositoCodigo> = {
  quarentena: 'QUARENTENA',
  'depósito a': 'AGUARD_ARM',
  'deposito a': 'AGUARD_ARM',
  'depósito b': 'AGUARD_ARM',
  'deposito b': 'AGUARD_ARM',
  'área de bloqueio': 'QUARENTENA',
  'area de bloqueio': 'QUARENTENA',
  'staging expedição': 'AGUARD_ARM',
  'staging expedicao': 'AGUARD_ARM',
};

export function resolverDepositoPorAcaoRegra(
  acao: AcaoRegra,
): DepositoCodigo | null {
  if (acao.tipo === 'quarentena') {
    return 'QUARENTENA';
  }

  if (acao.tipo !== 'mover_deposito') {
    return null;
  }

  if (acao.parametros.depositoCodigo) {
    return acao.parametros.depositoCodigo as DepositoCodigo;
  }

  const zona = acao.parametros.zonaDestino?.trim().toLowerCase();
  if (!zona) {
    return null;
  }

  return ZONA_TO_DEPOSITO[zona] ?? null;
}

export function resolverDepositoPorAcoesRegra(
  acoes: AcaoRegra[],
): DepositoCodigo | null {
  for (const acao of acoes) {
    const deposito = resolverDepositoPorAcaoRegra(acao);
    if (deposito) {
      return deposito;
    }
  }

  return null;
}
