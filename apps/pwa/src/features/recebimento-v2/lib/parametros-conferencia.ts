import {
  DEFAULT_CONDICOES_CHECKLIST,
  DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA,
  type ParametrosRecebimentoConferencia,
} from '@/features/recebimento/types/recebimento.schema';

export function normalizeParametrosConferenciaV2(
  raw: Record<string, unknown> | ParametrosRecebimentoConferencia | null | undefined,
): ParametrosRecebimentoConferencia {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA };
  }

  const quantidadeModo =
    raw.quantidadeModo === 'caixa' ||
    raw.quantidadeModo === 'unidade' ||
    raw.quantidadeModo === 'ambos'
      ? raw.quantidadeModo
      : DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA.quantidadeModo;

  const loteModo =
    raw.loteModo === 'lote' || raw.loteModo === 'fabricacao' || raw.loteModo === 'ambos'
      ? raw.loteModo
      : DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA.loteModo;

  const condicoesChecklist = Array.isArray(raw.condicoesChecklist)
    ? raw.condicoesChecklist.filter(
        (item): item is ParametrosRecebimentoConferencia['condicoesChecklist'][number] =>
          typeof item === 'object' &&
          item != null &&
          typeof (item as { id?: unknown }).id === 'string' &&
          typeof (item as { label?: unknown }).label === 'string',
      )
    : DEFAULT_CONDICOES_CHECKLIST;

  return {
    quantidadeModo,
    loteModo,
    controlaPalete: Boolean(raw.controlaPalete ?? false),
    solicitarPesoPvar: raw.solicitarPesoPvar !== false,
    exigirEtiquetaPesoVariavel: Boolean(raw.exigirEtiquetaPesoVariavel ?? false),
    condicoesChecklist:
      condicoesChecklist.length > 0 ? condicoesChecklist : DEFAULT_CONDICOES_CHECKLIST,
  };
}
