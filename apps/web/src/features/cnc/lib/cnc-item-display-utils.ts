import { parseFabricacaoFromLote } from '@lilog/contracts';

import type { CncItem } from '@/features/cnc/types/cnc.schema';

export function resolverLoteItem(item: Pick<CncItem, 'loteRecebido' | 'loteEsperado'>) {
  return item.loteRecebido ?? item.loteEsperado ?? null;
}

export function resolverUnidadeMedidaItem(
  item: Pick<CncItem, 'subtipoOcorrencia' | 'unidadeMedida'>,
): string | null {
  if (item.subtipoOcorrencia === 'peso_divergente') {
    return 'Kg';
  }

  return item.unidadeMedida;
}

export function formatUnidadeMedidaItem(
  item: Pick<CncItem, 'subtipoOcorrencia' | 'unidadeMedida'>,
): string {
  return resolverUnidadeMedidaItem(item) ?? '—';
}

export function formatFabricacaoFromLote(lote: string | null): string {
  if (!lote) {
    return '—';
  }

  const parsed = parseFabricacaoFromLote(lote);
  return parsed.ok ? parsed.display : '—';
}

export function formatFabricacaoFromItem(
  item: Pick<CncItem, 'loteRecebido' | 'loteEsperado'>,
): string {
  return formatFabricacaoFromLote(resolverLoteItem(item));
}
