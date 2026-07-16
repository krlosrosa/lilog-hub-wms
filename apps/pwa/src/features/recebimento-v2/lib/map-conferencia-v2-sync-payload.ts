import type { LoteModo, QuantidadeModo } from '@/features/recebimento/types/recebimento.schema';
import type { ConferirItemPayload } from '@/features/recebimento/types/recebimento.api';

import type { ConferenceRecord } from '../local-db/schema';
import { resolveUnidadesPorCaixa } from './resolve-produto-conferencia-v2';

type ConferenceSyncMeta = {
  produtoId: string;
  unidadesPorCaixa: number;
  pesoVariavel: boolean;
  controlaLote: boolean;
  controlaValidade: boolean;
  quantidadeModo?: QuantidadeModo;
  controlaPalete?: boolean;
};

export function mapConferenciaV2SyncPayload(
  record: ConferenceRecord,
  meta: ConferenceSyncMeta,
  loteModo: LoteModo,
): ConferirItemPayload {
  const recebidaCaixa = record.recebidaCaixa ?? 0;
  const recebidaUnidade = record.recebidaUnidade ?? 0;
  const upc = resolveUnidadesPorCaixa(meta.unidadesPorCaixa);
  const caixaOnly =
    !meta.pesoVariavel &&
    recebidaCaixa > 0 &&
    recebidaUnidade === 0 &&
    (meta.quantidadeModo === 'caixa' || meta.quantidadeModo === undefined);

  const payload: ConferirItemPayload = {
    produtoId: meta.produtoId,
    quantidadeRecebida: meta.pesoVariavel
      ? 1
      : caixaOnly
        ? recebidaCaixa
        : recebidaCaixa * upc + recebidaUnidade,
    unidadeMedida: meta.pesoVariavel ? 'CX' : caixaOnly ? 'CX' : 'UN',
  };

  const enviaLote = loteModo === 'lote' || loteModo === 'ambos';
  const enviaValidade = loteModo === 'fabricacao' || loteModo === 'ambos';

  if (enviaLote && record.lote?.trim()) {
    payload.loteRecebido = record.lote.trim();
  }

  if (record.peso != null && record.peso > 0) {
    payload.pesoRecebido = record.peso;
  }

  if (record.etiquetaCodigo?.trim()) {
    payload.etiquetaCodigo = record.etiquetaCodigo.trim();
  }

  if (record.unitizadorCodigo?.trim()) {
    payload.unitizadorCodigo = record.unitizadorCodigo.trim();
  }

  if (meta.pesoVariavel) {
    payload.clientConferenceId = record.id;
  }

  const validade = record.validade ?? record.fabricacao;
  if (enviaValidade && validade) {
    payload.validade = new Date(validade).toISOString();
  } else if (meta.controlaValidade && loteModo === 'lote' && validade) {
    payload.validade = new Date(validade).toISOString();
  }

  return payload;
}
