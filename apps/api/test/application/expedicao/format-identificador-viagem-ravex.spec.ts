import { describe, expect, it } from 'vitest';

import { formatIdentificadorViagemRavex } from '../../../src/application/services/expedicao/format-identificador-viagem-ravex.js';

describe('formatIdentificadorViagemRavex', () => {
  it('preenche com zeros à esquerda até 10 dígitos', () => {
    expect(formatIdentificadorViagemRavex('53590365')).toBe('0053590365');
  });

  it('mantém identificador com 10 dígitos', () => {
    expect(formatIdentificadorViagemRavex('0053590365')).toBe('0053590365');
  });

  it('remove caracteres não numéricos antes do padding', () => {
    expect(formatIdentificadorViagemRavex('DT-123')).toBe('0000000123');
  });
});
