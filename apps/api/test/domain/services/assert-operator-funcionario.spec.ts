import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import {
  assertOperatorHasFuncionario,
  resolveOperatorFuncionarioId,
} from '../../../src/domain/services/assert-operator-funcionario.js';

describe('assert-operator-funcionario', () => {
  it('throws when operator has no funcionarioId', () => {
    expect(() =>
      assertOperatorHasFuncionario({ role: 'operator', funcionarioId: null }),
    ).toThrow(BadRequestException);
  });

  it('allows manager without funcionarioId', () => {
    expect(() =>
      assertOperatorHasFuncionario({ role: 'manager', funcionarioId: null }),
    ).not.toThrow();
  });

  it('resolves funcionarioId for operator', () => {
    expect(
      resolveOperatorFuncionarioId({ role: 'operator', funcionarioId: 10 }),
    ).toBe(10);
  });

  it('returns undefined for manager without funcionarioId', () => {
    expect(
      resolveOperatorFuncionarioId({ role: 'manager', funcionarioId: null }),
    ).toBeUndefined();
  });
});
