import { describe, expect, it } from 'vitest';

import { getReferenciaOciosidadeRecebimentoIso } from '../../../../src/application/services/recebimento/referencia-ociosidade-recebimento.js';

describe('referencia-ociosidade-recebimento', () => {
  it('usa ultima missao finalizada quando existir', () => {
    expect(
      getReferenciaOciosidadeRecebimentoIso(
        '2026-07-13T08:00:00.000Z',
        '2026-07-13T12:30:00.000Z',
      ),
    ).toBe('2026-07-13T12:30:00.000Z');
  });

  it('usa check-in quando nunca finalizou demanda', () => {
    expect(
      getReferenciaOciosidadeRecebimentoIso(
        '2026-07-13T08:00:00.000Z',
        null,
      ),
    ).toBe('2026-07-13T08:00:00.000Z');
  });
});
