import type { DepositoCodigo } from '../model/estoque/deposito.model.js';
import type { TipoDivergencia } from '../model/recebimento/recebimento.model.js';

const DIVERGENCIA_DEPOSITO_MAP: Record<TipoDivergencia, DepositoCodigo> = {
  quantidade_menor: 'DEB_TRANSP',
  produto_ausente: 'DEB_TRANSP',
  produto_nao_esperado: 'QUARENTENA',
  divergencia_lote: 'QUARENTENA',
  divergencia_validade: 'QUARENTENA',
  divergencia_peso: 'QUARENTENA',
  quantidade_maior: 'AGUARD_ARM',
};

export function resolverDepositoPorDivergencia(
  tipo: TipoDivergencia,
): DepositoCodigo {
  return DIVERGENCIA_DEPOSITO_MAP[tipo];
}

export function requerQuarentena(divergencias: TipoDivergencia[]): boolean {
  return divergencias.some((tipo) =>
    [
      'produto_nao_esperado',
      'divergencia_lote',
      'divergencia_validade',
      'divergencia_peso',
    ].includes(tipo),
  );
}

export function calcularFaltaSemFisico(
  divergencias: Array<{
    tipoDivergencia: TipoDivergencia;
    quantidadeEsperada: number | null;
    quantidadeRecebida: number | null;
  }>,
): number {
  let total = 0;

  for (const divergencia of divergencias) {
    if (divergencia.tipoDivergencia === 'produto_ausente') {
      total += divergencia.quantidadeEsperada ?? 0;
      continue;
    }

    if (divergencia.tipoDivergencia === 'quantidade_menor') {
      const esperado = divergencia.quantidadeEsperada ?? 0;
      const recebido = divergencia.quantidadeRecebida ?? 0;
      total += Math.max(0, esperado - recebido);
    }
  }

  return total;
}

export function resolverDepositoDestinoFisico(
  divergencias: TipoDivergencia[],
): DepositoCodigo {
  if (requerQuarentena(divergencias)) {
    return 'QUARENTENA';
  }

  return 'AGUARD_ARM';
}
