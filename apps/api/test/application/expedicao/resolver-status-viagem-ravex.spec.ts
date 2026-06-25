import { describe, expect, it } from 'vitest';

import { resolverStatusViagemRavex } from '../../../src/application/services/expedicao/resolver-status-viagem-ravex.js';

describe('resolverStatusViagemRavex', () => {
  it('retorna em_viagem quando há início sem fim', () => {
    expect(
      resolverStatusViagemRavex(
        new Date('2026-06-22T06:32:01.583Z'),
        null,
      ),
    ).toBe('em_viagem');
  });

  it('retorna viagem_finalizada quando há fim', () => {
    expect(
      resolverStatusViagemRavex(
        new Date('2026-06-22T06:32:01.583Z'),
        new Date('2026-06-23T12:00:00'),
      ),
    ).toBe('viagem_finalizada');
  });

  it('retorna null quando viagem ainda não iniciou', () => {
    expect(resolverStatusViagemRavex(null, null)).toBeNull();
  });
});
