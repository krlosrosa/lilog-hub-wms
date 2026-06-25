import type { ItemAguardandoArmazenagemGroup } from './build-itens-aguardando-armazenagem.js';

export type TransferenciaAguardArmazenagem = {
  produtoId: string;
  quantidade: number;
  lote: string;
  numeroSerie: string;
};

function normalizeLote(lote?: string | null): string {
  return lote?.trim() ?? '';
}

function normalizeNumeroSerie(numeroSerie?: string | null): string {
  return numeroSerie?.trim() ?? '';
}

function groupKey(
  produtoId: string,
  lote?: string | null,
  numeroSerie?: string | null,
): string {
  return [
    produtoId,
    normalizeLote(lote),
    normalizeNumeroSerie(numeroSerie),
  ].join('|');
}

function loteOuSerieVazio(lote?: string | null, numeroSerie?: string | null): boolean {
  return normalizeLote(lote) === '' && normalizeNumeroSerie(numeroSerie) === '';
}

export function mergeItensAguardandoComDistribuicaoReal(
  itensConferidos: ItemAguardandoArmazenagemGroup[],
  transferidoParaAguard: TransferenciaAguardArmazenagem[],
): ItemAguardandoArmazenagemGroup[] {
  const saldoPorChave = new Map<string, number>();
  const saldoPorProduto = new Map<string, number>();

  for (const transferencia of transferidoParaAguard) {
    const key = groupKey(
      transferencia.produtoId,
      transferencia.lote,
      transferencia.numeroSerie,
    );
    saldoPorChave.set(
      key,
      (saldoPorChave.get(key) ?? 0) + transferencia.quantidade,
    );
    saldoPorProduto.set(
      transferencia.produtoId,
      (saldoPorProduto.get(transferencia.produtoId) ?? 0) +
        transferencia.quantidade,
    );
  }

  const result: ItemAguardandoArmazenagemGroup[] = [];

  for (const item of itensConferidos) {
    const key = groupKey(item.produtoId, item.lote, item.numeroSerie);
    const usarSaldoPorProduto = loteOuSerieVazio(item.lote, item.numeroSerie);
    const disponivel = usarSaldoPorProduto
      ? (saldoPorProduto.get(item.produtoId) ?? 0)
      : (saldoPorChave.get(key) ?? 0);

    if (disponivel <= 0) {
      continue;
    }

    const quantidade = Math.min(item.quantidade, disponivel);

    if (usarSaldoPorProduto) {
      saldoPorProduto.set(item.produtoId, disponivel - quantidade);
    } else {
      saldoPorChave.set(key, disponivel - quantidade);
    }

    if (quantidade > 0) {
      result.push({ ...item, quantidade });
    }
  }

  return result;
}
