import type { RecebimentoAvariaRecord } from '../repositories/recebimento/recebimento-avaria.repository.js';
import type { LinhaSaldoRecebimentoClassificada } from './classificar-linhas-saldo-recebimento.js';

function normalizeLote(lote: string | null | undefined): string {
  return (lote ?? '').trim();
}

function avariaKey(produtoId: string, lote: string | null | undefined): string {
  return `${produtoId}|${normalizeLote(lote)}`;
}

export function buildAvariaBloqueioKeys(
  avarias: RecebimentoAvariaRecord[],
): Set<string> {
  const keys = new Set<string>();

  for (const avaria of avarias) {
    if (!avaria.produtoId) {
      continue;
    }

    keys.add(avariaKey(avaria.produtoId, avaria.lote));
  }

  return keys;
}

export function linhaMatchesAvariaBloqueio(
  linha: Pick<LinhaSaldoRecebimentoClassificada, 'produtoId' | 'lote'>,
  avariaKeys: Set<string>,
): boolean {
  const loteNormalizado = normalizeLote(linha.lote);

  if (avariaKeys.has(avariaKey(linha.produtoId, loteNormalizado))) {
    return true;
  }

  return avariaKeys.has(avariaKey(linha.produtoId, null));
}

export function aplicarBloqueioAvariaNasLinhasSaldo(
  linhas: LinhaSaldoRecebimentoClassificada[],
  avarias: RecebimentoAvariaRecord[],
): LinhaSaldoRecebimentoClassificada[] {
  if (avarias.length === 0) {
    return linhas;
  }

  const avariaKeys = buildAvariaBloqueioKeys(avarias);

  return linhas.map((linha) => {
    if (linha.status === 'bloqueado') {
      return linha;
    }

    if (!linhaMatchesAvariaBloqueio(linha, avariaKeys)) {
      return linha;
    }

    return {
      ...linha,
      status: 'bloqueado',
      tipoAnomalia: 'avaria',
    };
  });
}
