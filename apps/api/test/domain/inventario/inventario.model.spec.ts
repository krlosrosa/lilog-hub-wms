import { describe, expect, it } from 'vitest';

import {
  enderecosConferem,
  normalizeEndereco,
  parseRackSegment,
  rackInRange,
} from '../../../src/domain/model/inventario/inventario.model.js';

describe('inventario address helpers', () => {
  it('parses rack segment from endereco mascarado', () => {
    expect(parseRackSegment('CD01-ZNA-R01-BL01-NV01-AP01')).toBe('R01');
    expect(parseRackSegment('INVALID')).toBeNull();
  });

  it('filters rack range lexicographically', () => {
    expect(rackInRange('R05', 'R01', 'R10')).toBe(true);
    expect(rackInRange('R11', 'R01', 'R10')).toBe(false);
    expect(rackInRange('R05')).toBe(true);
  });

  it('normalizes and compares enderecos', () => {
    expect(
      enderecosConferem(' cd01-zna-r01 ', 'CD01-ZNA-R01-BL01-NV01-AP01'),
    ).toBe(false);
    expect(
      enderecosConferem('CD01-ZNA-R01-BL01-NV01-AP01', 'cd01-zna-r01-bl01-nv01-ap01'),
    ).toBe(true);
    expect(normalizeEndereco(' a b ')).toBe('AB');
  });
});
