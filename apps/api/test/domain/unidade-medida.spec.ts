import { describe, expect, it } from 'vitest';

import { toBaseUnits } from '../../src/domain/services/unidade-medida.js';

describe('toBaseUnits', () => {
  it('multiplies CX by unidadesPorCaixa', () => {
    expect(toBaseUnits(1, 'CX', 12)).toBe(12);
    expect(toBaseUnits(2, 'CX', 12)).toBe(24);
  });

  it('keeps UN unchanged', () => {
    expect(toBaseUnits(7, 'UN', 12)).toBe(7);
  });
});
