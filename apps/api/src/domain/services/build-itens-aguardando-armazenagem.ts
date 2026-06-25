import type { TipoDivergencia } from '../model/recebimento/recebimento.model.js';
import type { ItemRecebimentoRecord } from '../repositories/recebimento/recebimento.repository.js';
import { resolverDepositoDestinoFisico } from './resolver-deposito-divergencia.js';
import { toBaseUnits } from './unidade-medida.js';

export type ItemAguardandoArmazenagemGroup = {
  unitizadorId: string | null;
  produtoId: string;
  quantidade: number;
  unidadeMedida: string;
  lote: string | null;
  validade: Date | null;
  numeroSerie: string | null;
};

type BuildItensAguardandoArmazenagemInput = {
  itensConferidos: ItemRecebimentoRecord[];
  divergenciasPorProduto: Map<
    string,
    Array<{ tipoDivergencia: TipoDivergencia }>
  >;
  unidadesPorCaixaMap: Map<string, number>;
};

function groupKey(
  item: Pick<
    ItemRecebimentoRecord,
    'unitizadorId' | 'produtoId' | 'loteRecebido' | 'validade' | 'numeroSerie'
  >,
): string {
  return [
    item.unitizadorId ?? '',
    item.produtoId,
    item.loteRecebido ?? '',
    item.validade?.toISOString() ?? '',
    item.numeroSerie ?? '',
  ].join('|');
}

export function buildItensAguardandoArmazenagem(
  input: BuildItensAguardandoArmazenagemInput,
): ItemAguardandoArmazenagemGroup[] {
  const groups = new Map<string, ItemAguardandoArmazenagemGroup>();

  for (const item of input.itensConferidos) {
    const tiposDivergencia = (
      input.divergenciasPorProduto.get(item.produtoId) ?? []
    ).map((divergencia) => divergencia.tipoDivergencia);
    const destino = resolverDepositoDestinoFisico(tiposDivergencia);

    if (destino !== 'AGUARD_ARM') {
      continue;
    }

    const unidadesPorCaixa = input.unidadesPorCaixaMap.get(item.produtoId) ?? 1;
    const quantidadeUN = toBaseUnits(
      item.quantidadeRecebida,
      item.unidadeMedida,
      unidadesPorCaixa,
    );

    if (quantidadeUN <= 0) {
      continue;
    }

    const key = groupKey(item);
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        unitizadorId: item.unitizadorId,
        produtoId: item.produtoId,
        quantidade: quantidadeUN,
        unidadeMedida: 'UN',
        lote: item.loteRecebido,
        validade: item.validade,
        numeroSerie: item.numeroSerie,
      });
      continue;
    }

    existing.quantidade += quantidadeUN;
  }

  return [...groups.values()];
}
