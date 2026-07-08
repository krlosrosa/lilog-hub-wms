import type { DepositoCodigo } from '../model/estoque/deposito.model.js';
import type { StatusSaldoArmazenagem } from '../model/armazenagem/armazenagem.model.js';
import type { TipoDivergencia } from '../model/recebimento/recebimento.model.js';
import type { RecebimentoAvariaRecord } from '../repositories/recebimento/recebimento-avaria.repository.js';
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
  statusSaldo?: StatusSaldoArmazenagem;
};

type BuildItensAguardandoArmazenagemInput = {
  itensConferidos: ItemRecebimentoRecord[];
  divergenciasPorProduto: Map<
    string,
    Array<{ tipoDivergencia: TipoDivergencia }>
  >;
  unidadesPorCaixaMap: Map<string, number>;
  depositoDestinoOverridesPorProduto?: Map<string, DepositoCodigo>;
  depositoDestinoOverridesPorItemId?: Map<string, DepositoCodigo>;
  destinosElegiveis?: DepositoCodigo[];
  avarias?: RecebimentoAvariaRecord[];
};

const DESTINOS_AGUARDANDO_ARMAZENAGEM_PADRAO: DepositoCodigo[] = ['AGUARD_ARM'];

export const DESTINOS_ESTOQUE_FISICO_ETIQUETAS: DepositoCodigo[] = [
  'AGUARD_ARM',
  'QUARENTENA',
];

function normalizeLote(lote: string | null | undefined): string {
  return (lote ?? '').trim();
}

function groupKey(
  item: Pick<
    ItemRecebimentoRecord,
    'unitizadorId' | 'produtoId' | 'loteRecebido' | 'validade' | 'numeroSerie'
  >,
): string {
  return [
    item.unitizadorId ?? '',
    item.produtoId,
    normalizeLote(item.loteRecebido),
    item.validade?.toISOString() ?? '',
    item.numeroSerie ?? '',
  ].join('|');
}

function produtoLoteKey(
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

function calcularAvariaEmUn(
  avaria: RecebimentoAvariaRecord,
  unidadesPorCaixa: number,
): number {
  const caixasEmUn = toBaseUnits(
    avaria.quantidadeCaixas,
    'CX',
    unidadesPorCaixa,
  );

  return caixasEmUn + avaria.quantidadeUnidades;
}

function buildAvariaRestanteMap(
  avarias: RecebimentoAvariaRecord[],
  unidadesPorCaixaMap: Map<string, number>,
): Map<string, number> {
  const map = new Map<string, number>();

  for (const avaria of avarias) {
    if (!avaria.produtoId) {
      continue;
    }

    const unidadesPorCaixa = unidadesPorCaixaMap.get(avaria.produtoId) ?? 1;
    const quantidadeUN = calcularAvariaEmUn(avaria, unidadesPorCaixa);

    if (quantidadeUN <= 0) {
      continue;
    }

    const key = produtoLoteKey(
      avaria.produtoId,
      avaria.lote,
      avaria.validade,
      avaria.numeroSerie,
    );

    map.set(key, (map.get(key) ?? 0) + quantidadeUN);
  }

  return map;
}

function resolveAvariaRestanteKey(
  item: Pick<
    ItemRecebimentoRecord,
    'produtoId' | 'loteRecebido' | 'validade' | 'numeroSerie'
  >,
  avariaRestante: Map<string, number>,
): string | null {
  const specificKey = produtoLoteKey(
    item.produtoId,
    item.loteRecebido,
    item.validade,
    item.numeroSerie,
  );

  if ((avariaRestante.get(specificKey) ?? 0) > 0) {
    return specificKey;
  }

  const produtoSemLoteKey = produtoLoteKey(item.produtoId, null, null, null);

  if ((avariaRestante.get(produtoSemLoteKey) ?? 0) > 0) {
    return produtoSemLoteKey;
  }

  return null;
}

function subtrairAvariaDaQuantidade(
  quantidadeUN: number,
  item: Pick<
    ItemRecebimentoRecord,
    'produtoId' | 'loteRecebido' | 'validade' | 'numeroSerie'
  >,
  avariaRestante: Map<string, number>,
): number {
  const avariaKey = resolveAvariaRestanteKey(item, avariaRestante);

  if (!avariaKey) {
    return quantidadeUN;
  }

  const restante = avariaRestante.get(avariaKey) ?? 0;
  const subtracao = Math.min(quantidadeUN, restante);
  avariaRestante.set(avariaKey, restante - subtracao);

  return quantidadeUN - subtracao;
}

export type ItemAguardandoArmazenagem = ItemAguardandoArmazenagemGroup;

export function buildItensAguardandoArmazenagem(
  input: BuildItensAguardandoArmazenagemInput,
): ItemAguardandoArmazenagemGroup[] {
  const groups = new Map<string, ItemAguardandoArmazenagemGroup>();
  const destinosElegiveis =
    input.destinosElegiveis ?? DESTINOS_AGUARDANDO_ARMAZENAGEM_PADRAO;
  const avariaRestante = buildAvariaRestanteMap(
    input.avarias ?? [],
    input.unidadesPorCaixaMap,
  );

  for (const item of input.itensConferidos) {
    const tiposDivergencia = (
      input.divergenciasPorProduto.get(item.produtoId) ?? []
    ).map((divergencia) => divergencia.tipoDivergencia);
    const destino =
      input.depositoDestinoOverridesPorItemId?.get(item.id) ??
      input.depositoDestinoOverridesPorProduto?.get(item.produtoId) ??
      resolverDepositoDestinoFisico(tiposDivergencia);

    if (!destinosElegiveis.includes(destino)) {
      continue;
    }

    const unidadesPorCaixa = input.unidadesPorCaixaMap.get(item.produtoId) ?? 1;
    const quantidadeUN = subtrairAvariaDaQuantidade(
      toBaseUnits(
        item.quantidadeRecebida,
        item.unidadeMedida,
        unidadesPorCaixa,
      ),
      item,
      avariaRestante,
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

type BuildItensPaletesBipadosInput = {
  itensConferidos: ItemRecebimentoRecord[];
  unidadesPorCaixaMap: Map<string, number>;
  avarias?: RecebimentoAvariaRecord[];
};

export function buildItensAguardandoArmazenagemDePaletesBipados(
  input: BuildItensPaletesBipadosInput,
): ItemAguardandoArmazenagemGroup[] {
  const groups = new Map<string, ItemAguardandoArmazenagemGroup>();
  const avariaRestante = buildAvariaRestanteMap(
    input.avarias ?? [],
    input.unidadesPorCaixaMap,
  );

  for (const item of input.itensConferidos) {
    if (!item.unitizadorId) {
      continue;
    }

    const unidadesPorCaixa = input.unidadesPorCaixaMap.get(item.produtoId) ?? 1;
    const quantidadeUN = subtrairAvariaDaQuantidade(
      toBaseUnits(
        item.quantidadeRecebida,
        item.unidadeMedida,
        unidadesPorCaixa,
      ),
      item,
      avariaRestante,
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
