import { describe, expect, it } from 'vitest';

import type { DetalheItemForm } from '@/features/recebimento/types/recebimento.schema';

import { resolveNonPvarLoteOnSubmit, applyNonPvarLoteResolution } from './resolve-non-pvar-lote-on-submit';

const baseForm: DetalheItemForm = {
  sku: '640100482',
  lote: '',
  validade: '',
  recebidaCaixa: 1,
  recebidaUnidade: 0,
  peso: '',
  etiqueta: '',
};

const LOTE_GS1 = '(15)261213(11)260616(7030)674(10)401126031209';

describe('resolveNonPvarLoteOnSubmit', () => {
  it('extrai lote e validade de GS1 de rastreabilidade', () => {
    const { form, error } = resolveNonPvarLoteOnSubmit({
      ...baseForm,
      lote: LOTE_GS1,
    });

    expect(error).toBeUndefined();
    expect(form.lote).toBe('4011260312');
    expect(form.validade).toBe('2026-06-16');
  });

  it('mantém lote digitado e extrai fabricação de lote numérico longo', () => {
    const { form, error } = resolveNonPvarLoteOnSubmit({
      ...baseForm,
      lote: '5001251010',
    });

    expect(error).toBeUndefined();
    expect(form.lote).toBe('5001251010');
    expect(form.validade).toBe('2025-10-10');
  });

  it('mantém lote curto sem conversão', () => {
    const { form, error } = resolveNonPvarLoteOnSubmit({
      ...baseForm,
      lote: '401126',
    });

    expect(error).toBeUndefined();
    expect(form.lote).toBe('401126');
    expect(form.validade).toBe('');
  });

  it('retorna erro quando GS1 parece válido mas não parseia', () => {
    const { error } = resolveNonPvarLoteOnSubmit({
      ...baseForm,
      lote: '(11)999999(10)',
    });

    expect(error).toBe('Código GS1 de lote inválido ou incompleto');
  });

  it('não altera form quando lote está vazio', () => {
    const { form, error } = resolveNonPvarLoteOnSubmit(baseForm);

    expect(error).toBeUndefined();
    expect(form).toEqual(baseForm);
  });
});

describe('applyNonPvarLoteResolution', () => {
  it('marca changed quando GS1 é convertido', () => {
    const { form, changed, error } = applyNonPvarLoteResolution({
      ...baseForm,
      lote: LOTE_GS1,
    });

    expect(error).toBeUndefined();
    expect(changed).toBe(true);
    expect(form.lote).toBe('4011260312');
    expect(form.validade).toBe('2026-06-16');
  });

  it('não marca changed para lote numérico curto', () => {
    const { changed, error } = applyNonPvarLoteResolution({
      ...baseForm,
      lote: '401126',
    });

    expect(error).toBeUndefined();
    expect(changed).toBe(false);
  });
});
