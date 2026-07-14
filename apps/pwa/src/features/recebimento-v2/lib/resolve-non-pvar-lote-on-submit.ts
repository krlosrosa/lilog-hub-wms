import {
  looksLikeGs1TraceabilityBarcode,
  resolveLoteFieldInput,
} from '@/features/recebimento/lib/parse-gs1-barcode';
import type { DetalheItemForm } from '@/features/recebimento/types/recebimento.schema';

export function resolveNonPvarLoteOnSubmit(form: DetalheItemForm): {
  form: DetalheItemForm;
  error?: string;
} {
  const rawLote = form.lote?.trim() ?? '';
  if (!rawLote) {
    return { form };
  }

  const resolved = resolveLoteFieldInput(rawLote);

  if (
    looksLikeGs1TraceabilityBarcode(rawLote) &&
    !resolved.lote &&
    !resolved.validade
  ) {
    return { form, error: 'Código GS1 de lote inválido ou incompleto' };
  }

  return {
    form: {
      ...form,
      lote: resolved.lote || form.lote,
      validade: resolved.validade ?? form.validade,
    },
  };
}

export function applyNonPvarLoteResolution(form: DetalheItemForm): {
  form: DetalheItemForm;
  changed: boolean;
  error?: string;
} {
  const { form: resolved, error } = resolveNonPvarLoteOnSubmit(form);
  if (error) {
    return { form, changed: false, error };
  }

  const changed =
    resolved.lote !== form.lote || resolved.validade !== (form.validade ?? '');

  return { form: resolved, changed };
}
