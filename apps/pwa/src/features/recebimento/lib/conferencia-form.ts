import type { UseFormReturn } from 'react-hook-form';

import type {
  DetalheItemForm,
  LoteConferido,
  ParametrosRecebimentoConferencia,
} from '../types/recebimento.schema';
import { parseFabricacaoFromLote } from '@lilog/contracts';

export const EMPTY_DETALHE_ITEM_FORM: DetalheItemForm = {
  sku: '',
  idPalete: '',
  lote: '',
  recebidaCaixa: '',
  recebidaUnidade: '',
  peso: '',
  etiqueta: '',
  validade: '',
};

export function buildFormForLoteEntry(
  sku: string,
  idPalete = '',
  preserve?: Partial<Pick<DetalheItemForm, 'lote' | 'validade'>>,
): DetalheItemForm {
  return {
    ...EMPTY_DETALHE_ITEM_FORM,
    sku,
    idPalete,
    lote: preserve?.lote ?? '',
    validade: preserve?.validade ?? '',
  };
}

export function resolveMaintainedLoteContext(
  values: Pick<DetalheItemForm, 'lote' | 'validade'>,
  existingLotes: Pick<LoteConferido, 'lote' | 'validade'>[],
  options?: { ignoreExisting?: boolean },
): { lote: string; validade: string } {
  const sourceLotes = options?.ignoreExisting ? [] : existingLotes;

  const lote =
    values.lote?.trim() ||
    [...sourceLotes].reverse().find((entry) => entry.lote?.trim())?.lote?.trim() ||
    '';

  let validade =
    values.validade?.trim() ||
    [...sourceLotes]
      .reverse()
      .find((entry) => entry.validade?.trim())
      ?.validade?.trim() ||
    '';

  if (!validade && lote) {
    const parsed = parseFabricacaoFromLote(lote);
    if (parsed.ok) {
      validade = parsed.isoDate;
    }
  }

  return { lote, validade };
}

export function resolveFirstFormError(
  errors: Record<string, { message?: string } | undefined>,
): string | null {
  for (const field of [
    'peso',
    'lote',
    'validade',
    'etiqueta',
    'recebidaCaixa',
    'recebidaUnidade',
    'sku',
    'idPalete',
  ]) {
    const message = errors[field]?.message;
    if (message) {
      return message;
    }
  }

  return null;
}

export function validatePvarBoxDraft(
  values: Pick<DetalheItemForm, 'lote' | 'validade' | 'peso'>,
  options: {
    existingLotes: Pick<LoteConferido, 'lote' | 'validade'>[];
    ignoreMaintainedLote: boolean;
    controlaLote: boolean;
    controlaValidade: boolean;
    loteModo: ParametrosRecebimentoConferencia['loteModo'];
  },
): string | null {
  const needsLote = options.loteModo === 'lote' || options.loteModo === 'ambos';
  const needsFabricacao =
    options.loteModo === 'fabricacao' || options.loteModo === 'ambos';
  const maintained = resolveMaintainedLoteContext(values, options.existingLotes, {
    ignoreExisting: options.ignoreMaintainedLote,
  });

  if (options.controlaLote && needsLote && !maintained.lote) {
    return 'Informe o lote na primeira caixa';
  }

  if (options.controlaValidade && needsFabricacao && !maintained.validade) {
    return 'Informe a fabricação na primeira caixa';
  }

  const peso = Number(values.peso || 0);
  if (!values.peso?.trim() || Number.isNaN(peso) || peso <= 0) {
    return 'Informe o peso da caixa';
  }

  return null;
}

export function syncMaintainedLoteFieldsForSubmit(
  form: Pick<UseFormReturn<DetalheItemForm>, 'getValues' | 'setValue'>,
  existingLotes: Pick<LoteConferido, 'lote' | 'validade'>[],
  ignoreMaintainedLote: boolean,
) {
  if (ignoreMaintainedLote) {
    return;
  }

  const values = form.getValues();
  const maintained = resolveMaintainedLoteContext(values, existingLotes);

  if (maintained.lote && !values.lote?.trim()) {
    form.setValue('lote', maintained.lote, { shouldValidate: false });
  }

  if (maintained.validade && !values.validade?.trim()) {
    form.setValue('validade', maintained.validade, { shouldValidate: false });
  }
}

export function hasPendingLoteDraftValues(
  values: Pick<
    DetalheItemForm,
    'lote' | 'validade' | 'recebidaCaixa' | 'recebidaUnidade' | 'peso'
  >,
  parametros: Pick<
    ParametrosRecebimentoConferencia,
    'quantidadeModo' | 'loteModo'
  >,
  options?: {
    pesoVariavel?: boolean;
    existingLotes?: Pick<LoteConferido, 'lote' | 'validade'>[];
    ignoreExistingLotes?: boolean;
  },
): boolean {
  const { quantidadeModo, loteModo } = parametros;
  const pesoVariavel = options?.pesoVariavel ?? false;
  const existingLotes = options?.ignoreExistingLotes
    ? []
    : (options?.existingLotes ?? []);
  const needsLote = loteModo === 'lote' || loteModo === 'ambos';
  const needsFabricacao = loteModo === 'fabricacao' || loteModo === 'ambos';

  if (pesoVariavel) {
    const maintained = resolveMaintainedLoteContext(values, existingLotes);
    const hasIdentificador = needsLote
      ? !!maintained.lote
      : needsFabricacao
        ? !!maintained.validade
        : true;

    return hasIdentificador && Number(values.peso || 0) > 0;
  }

  const hasIdentificador = needsLote
    ? !!values.lote?.trim()
    : needsFabricacao
      ? !!values.validade?.trim()
      : false;

  if (!hasIdentificador) {
    return false;
  }

  const caixa = Number(values.recebidaCaixa || 0);
  const unidade = Number(values.recebidaUnidade || 0);

  if (quantidadeModo === 'caixa') {
    return caixa > 0;
  }

  if (quantidadeModo === 'unidade') {
    return unidade > 0;
  }

  return caixa > 0 || unidade > 0;
}
