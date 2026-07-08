import type { DevolucaoAvariaDetalhe } from '@/features/devolucao/types/devolucao-buscar.schema';
import type { ConferenceItem } from '@/features/devolucao/types/devolucao-detalhes.schema';

export function resolveAvariasForItem(
  item: ConferenceItem,
  avarias: DevolucaoAvariaDetalhe[],
): DevolucaoAvariaDetalhe[] {
  return avarias.filter(
    (avaria) =>
      avaria.itemId === item.id ||
      avaria.itemSku === item.sku ||
      (avaria.skusAfetados?.includes(item.sku) ?? false),
  );
}

export function itemHasAvaria(
  item: ConferenceItem,
  avarias: DevolucaoAvariaDetalhe[],
): boolean {
  return item.condicao === 'avariado' || resolveAvariasForItem(item, avarias).length > 0;
}

export type QuantidadeAvariadaResumo = {
  caixa: number;
  unidade: number;
};

export function getQuantidadeAvariadaForItem(
  item: ConferenceItem,
  avarias: DevolucaoAvariaDetalhe[],
): QuantidadeAvariadaResumo {
  return resolveAvariasForItem(item, avarias).reduce(
    (acc, avaria) => ({
      caixa: acc.caixa + avaria.quantidadeCaixa,
      unidade: acc.unidade + avaria.quantidadeUnidade,
    }),
    { caixa: 0, unidade: 0 },
  );
}

export function formatQuantidadeAvariada(
  resumo: QuantidadeAvariadaResumo,
): string | null {
  const parts: string[] = [];

  if (resumo.caixa > 0) {
    parts.push(`${resumo.caixa} cx`);
  }

  if (resumo.unidade > 0) {
    parts.push(`${resumo.unidade} un`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}
