import type { ItemConferidoView } from '@lilog/contracts';

import type { ConferenceRecord } from '@/features/recebimento-v2/local-db/schema';

/**
 * Detects whether an ItemConferidoView is still an optimistic (client-only) record
 * that has not yet been confirmed by the server via push + pull.
 *
 * The Replicache client mutator sets descricao = 'Conferindo...' for optimistic items.
 * After pull the server replaces this with the real description.
 */
function isOptimisticItemConferido(item: ItemConferidoView): boolean {
  return item.descricao === 'Conferindo...';
}

export function mapItemConferidoToConference(
  item: ItemConferidoView,
  demandId: string,
): ConferenceRecord {
  const validade = item.validade?.slice(0, 10) ?? undefined;
  const pesagemId = item.pesagemId?.trim() || undefined;
  const syncStatus = isOptimisticItemConferido(item) ? 'pending' : 'confirmed';

  if (pesagemId) {
    return {
      id: pesagemId,
      demandId,
      sku: item.sku,
      lote: item.loteRecebido ?? undefined,
      validade,
      quantity: 1,
      recebidaCaixa: 1,
      peso: item.pesoRecebido ?? undefined,
      etiquetaCodigo: item.etiquetaCodigo ?? undefined,
      unitizadorCodigo: item.unitizadorCodigo ?? undefined,
      isPvarBox: true,
      conferidoAt: item.validade ?? new Date().toISOString(),
      syncStatus,
      serverItemId: item.recebimentoItemId,
      serverPesagemId: pesagemId,
      updatedAt: Date.now(),
    };
  }

  const isCaixa = item.unidadeMedida.toUpperCase() === 'CX';

  return {
    id: item.id,
    demandId,
    sku: item.sku,
    lote: item.loteRecebido ?? undefined,
    validade,
    quantity: item.quantidadeRecebida,
    recebidaCaixa: isCaixa ? item.quantidadeRecebida : undefined,
    recebidaUnidade: !isCaixa ? item.quantidadeRecebida : undefined,
    peso: item.pesoRecebido ?? undefined,
    etiquetaCodigo: item.etiquetaCodigo ?? undefined,
    unitizadorCodigo: item.unitizadorCodigo ?? undefined,
    isPvarBox: item.pesoRecebido != null,
    conferidoAt: item.validade ?? new Date().toISOString(),
    syncStatus,
    serverItemId: item.recebimentoItemId,
    serverPesagemId: undefined,
    updatedAt: Date.now(),
  };
}

export function mapItensConferidosToConferences(
  items: ItemConferidoView[],
  demandId: string,
): ConferenceRecord[] {
  return items.map((item) => mapItemConferidoToConference(item, demandId));
}
