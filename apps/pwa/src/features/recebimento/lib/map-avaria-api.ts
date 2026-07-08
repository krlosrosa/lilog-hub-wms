import type { RecebimentoAvariaApi } from '../types/recebimento.api';
import type { AvariaRegistro } from '../types/recebimento.schema';
import { getConferenciaContextStore } from './conferencia-context-store';

function resolveSkuFromProdutoId(
  demandId: string,
  produtoId: string | null,
): string | undefined {
  if (!produtoId) return undefined;

  const context = getConferenciaContextStore(demandId);
  if (!context) return undefined;

  for (const meta of Object.values(context.itemMetaBySku)) {
    if (meta.produtoId === produtoId) {
      return meta.sku;
    }
  }

  return undefined;
}

export function mapAvariaApiToRegistro(
  item: RecebimentoAvariaApi,
  demandId?: string,
): AvariaRegistro {
  const sku = demandId ? resolveSkuFromProdutoId(demandId, item.produtoId) : undefined;

  return {
    id: item.id,
    produtoId: item.produtoId ?? undefined,
    sku,
    lote: item.lote ?? undefined,
    quantidadeCaixa: item.quantidadeCaixas,
    quantidadeUnidade: item.quantidadeUnidades,
    tipo: item.tipo,
    natureza: item.natureza,
    causa: item.causa,
    photoCount: item.photoCount,
    replicado: item.replicado,
  };
}
