import { describe, expect, it } from 'vitest';

import { normalizePersonName } from '../../src/shared/utils/normalize-person-name.js';

describe('normalizePersonName', () => {
  it('normaliza maiúsculas e espaços extras', () => {
    expect(normalizePersonName('  JOÃO   DA  silva  ')).toBe('João da Silva');
    expect(normalizePersonName('MARIA SOUZA')).toBe('Maria Souza');
  });

  it('mantém partículas em minúsculo exceto na primeira palavra', () => {
    expect(normalizePersonName('ana de souza')).toBe('Ana de Souza');
    expect(normalizePersonName('pedro dos santos')).toBe('Pedro dos Santos');
    expect(normalizePersonName('maria e josé')).toBe('Maria e José');
    expect(normalizePersonName('da silva')).toBe('Da Silva');
  });

  it('retorna string vazia para entrada vazia ou só espaços', () => {
    expect(normalizePersonName('')).toBe('');
    expect(normalizePersonName('   ')).toBe('');
  });

  it('normaliza nome simples', () => {
    expect(normalizePersonName('carlos')).toBe('Carlos');
  });
});
