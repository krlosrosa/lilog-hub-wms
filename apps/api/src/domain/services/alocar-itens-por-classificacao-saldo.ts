import type { ItemArmazenagemInput } from '../model/armazenagem/armazenagem.model.js';
import type { StatusSaldoArmazenagem } from '../model/armazenagem/armazenagem.model.js';
import type { LinhaSaldoRecebimentoClassificada } from './classificar-linhas-saldo-recebimento.js';

export type ItemParaAlocacaoSaldo = Pick<
  ItemArmazenagemInput,
  | 'produtoId'
  | 'quantidade'
  | 'unidadeMedida'
  | 'lote'
  | 'validade'
  | 'numeroSerie'
>;

export type ItemAlocadoPorSaldo = ItemParaAlocacaoSaldo & {
  statusSaldo: StatusSaldoArmazenagem;
};

type SaldoDisponivelPorChave = {
  liberado: number;
  bloqueado: number;
};

function normalizeLote(lote: string | null | undefined): string {
  return (lote ?? '').trim();
}

function groupKey(
  produtoId: string,
  lote: string | null | undefined,
  validade: Date | null | undefined,
  numeroSerie: string | null | undefined,
): string {
  return [
    produtoId,
    normalizeLote(lote),
    validade?.toISOString() ?? '',
    numeroSerie ?? '',
  ].join('|');
}

function buildSaldoDisponivelMap(
  linhas: LinhaSaldoRecebimentoClassificada[],
): Map<string, SaldoDisponivelPorChave> {
  const map = new Map<string, SaldoDisponivelPorChave>();

  for (const linha of linhas) {
    const key = groupKey(
      linha.produtoId,
      linha.lote,
      linha.validade,
      linha.numeroSerie,
    );
    const current = map.get(key) ?? { liberado: 0, bloqueado: 0 };

    if (linha.status === 'liberado') {
      current.liberado += linha.quantidade;
    } else {
      current.bloqueado += linha.quantidade;
    }

    map.set(key, current);
  }

  return map;
}

export type AlocadorSaldoClassificado = {
  alocar(item: ItemParaAlocacaoSaldo): ItemAlocadoPorSaldo[];
};

export function createAlocadorSaldoClassificado(
  linhas: LinhaSaldoRecebimentoClassificada[],
): AlocadorSaldoClassificado {
  const saldoDisponivel = buildSaldoDisponivelMap(linhas);

  return {
    alocar(item: ItemParaAlocacaoSaldo): ItemAlocadoPorSaldo[] {
      const key = groupKey(
        item.produtoId,
        item.lote,
        item.validade,
        item.numeroSerie,
      );
      const saldo = saldoDisponivel.get(key) ?? { liberado: 0, bloqueado: 0 };
      let remaining = item.quantidade;
      const result: ItemAlocadoPorSaldo[] = [];

      if (saldo.liberado > 0 && remaining > 0) {
        const quantidade = Math.min(remaining, saldo.liberado);
        result.push({
          ...item,
          quantidade,
          statusSaldo: 'liberado',
        });
        saldo.liberado -= quantidade;
        remaining -= quantidade;
      }

      if (saldo.bloqueado > 0 && remaining > 0) {
        const quantidade = Math.min(remaining, saldo.bloqueado);
        result.push({
          ...item,
          quantidade,
          statusSaldo: 'bloqueado',
        });
        saldo.bloqueado -= quantidade;
        remaining -= quantidade;
      }

      if (remaining > 0) {
        result.push({
          ...item,
          quantidade: remaining,
          statusSaldo: 'liberado',
        });
      }

      saldoDisponivel.set(key, saldo);
      return result;
    },
  };
}
