import type { ConferenciaItemMeta, MappedConferenciaContext } from './map-conferencia-itens';
import { mergeSkuConferenciaIntoContext } from './merge-conferencia-sku-save';
import {
  listRecebimentoConferenciaRascunhos,
  type RecebimentoConferenciaRascunhoEntry,
} from './recebimento-conferencia-rascunho';
import type { ProdutoConferenciaConfigForm } from '../types/recebimento.schema';

const DEFAULT_CONFIG: ProdutoConferenciaConfigForm = {
  controlaLote: false,
  controlaValidade: false,
  controlaPeso: false,
  pesoVariavel: false,
  exigirEtiquetaPesoVariavel: false,
  controlaNumeroSerie: false,
};

function resolveMetaForRascunho(
  context: MappedConferenciaContext,
  rascunho: RecebimentoConferenciaRascunhoEntry,
): ConferenciaItemMeta {
  const normalizedSku = rascunho.sku.toLowerCase();
  const existing = context.itemMetaBySku[normalizedSku];
  if (existing) {
    return existing;
  }

  for (const meta of Object.values(context.itemMetaBySku)) {
    if (meta.produtoId === rascunho.produtoId) {
      return { ...meta, sku: rascunho.sku };
    }
  }

  return {
    produtoId: rascunho.produtoId,
    sku: rascunho.sku,
    descricao: rascunho.sku,
    unidadeMedida: 'UN',
    unidadesPorCaixa: 1,
    config: DEFAULT_CONFIG,
  };
}

export async function applyRascunhosToConferenciaContext(
  context: MappedConferenciaContext,
  demandId: string,
): Promise<MappedConferenciaContext> {
  const rascunhos = await listRecebimentoConferenciaRascunhos(demandId);
  if (rascunhos.length === 0) {
    return context;
  }

  let next = context;

  for (const rascunho of rascunhos) {
    if (rascunho.lotes.length === 0) {
      continue;
    }

    next = mergeSkuConferenciaIntoContext(next, {
      sku: rascunho.sku,
      meta: resolveMetaForRascunho(next, rascunho),
      lotes: rascunho.lotes,
      removing: false,
    });
  }

  return next;
}
