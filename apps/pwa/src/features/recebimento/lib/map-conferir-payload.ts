import type { ConferirItemPayload } from '../types/recebimento.api';
import type {
  DetalheItemForm,
  LoteConferido,
  LoteModo,
} from '../types/recebimento.schema';
import type { ConferenciaItemMeta } from './map-conferencia-itens';

function buildConferirPayload(
  meta: ConferenciaItemMeta,
  loteModo: LoteModo,
  input: {
    lote?: string;
    recebidaCaixa: number;
    recebidaUnidade: number;
    peso?: number;
    validade?: string;
    idPalete?: string;
    etiquetaCodigo?: string;
  },
  incluirPalete = false,
): ConferirItemPayload {
  const totalUnidades =
    input.recebidaCaixa * meta.unidadesPorCaixa + input.recebidaUnidade;

  const payload: ConferirItemPayload = {
    produtoId: meta.produtoId,
    quantidadeRecebida: totalUnidades,
    unidadeMedida: 'UN',
  };

  if (meta.config.pesoVariavel) {
    payload.quantidadeRecebida = 1;
    payload.unidadeMedida = 'CX';
  }

  const enviaLote = loteModo === 'lote' || loteModo === 'ambos';
  const enviaValidade = loteModo === 'fabricacao' || loteModo === 'ambos';

  if (enviaLote && meta.config.controlaLote && input.lote?.trim()) {
    payload.loteRecebido = input.lote.trim();
  }

  if (meta.config.pesoVariavel && input.peso) {
    payload.pesoRecebido = input.peso;
  }

  if (input.etiquetaCodigo?.trim()) {
    payload.etiquetaCodigo = input.etiquetaCodigo.trim();
  }

  if (enviaValidade && input.validade) {
    payload.validade = new Date(input.validade).toISOString();
  } else if (
    meta.config.controlaValidade &&
    loteModo === 'lote' &&
    input.validade
  ) {
    payload.validade = new Date(input.validade).toISOString();
  }

  const palete = input.idPalete?.trim();
  if (incluirPalete && palete) {
    payload.unitizadorCodigo = palete;
  }

  return payload;
}

export function mapConferirPayload(
  form: DetalheItemForm,
  meta: ConferenciaItemMeta,
  loteModo: LoteModo = 'lote',
  validade?: Date,
  incluirPalete = false,
): ConferirItemPayload {
  return buildConferirPayload(
    meta,
    loteModo,
    {
      lote: form.lote,
      recebidaCaixa: Number(form.recebidaCaixa) || 0,
      recebidaUnidade: Number(form.recebidaUnidade) || 0,
      peso: form.peso ? Number(form.peso) : undefined,
      etiquetaCodigo: form.etiqueta,
      validade: validade?.toISOString() ?? form.validade,
      idPalete: form.idPalete,
    },
    incluirPalete,
  );
}

export function mapConferirPayloadFromLote(
  lote: LoteConferido,
  meta: ConferenciaItemMeta,
  loteModo: LoteModo = 'lote',
  fallbackIdPalete?: string,
  incluirPalete = false,
): ConferirItemPayload {
  return buildConferirPayload(
    meta,
    loteModo,
    {
      lote: lote.lote,
      recebidaCaixa: lote.recebidaCaixa,
      recebidaUnidade: lote.recebidaUnidade,
      peso: lote.peso,
      etiquetaCodigo: lote.etiquetaCodigo,
      validade: lote.validade,
      idPalete: lote.idPalete || fallbackIdPalete,
    },
    incluirPalete,
  );
}