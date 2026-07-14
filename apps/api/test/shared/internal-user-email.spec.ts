import { describe, expect, it } from 'vitest';

import {
  buildInternalUserEmail,
  isInternalUserEmail,
  resolveInternalUserEmail,
} from '../../src/shared/utils/internal-user-email.js';

describe('internal-user-email', () => {
  it('buildInternalUserEmail gera padrão id@internal.lilog', () => {
    expect(buildInternalUserEmail(421931)).toBe('421931@internal.lilog');
  });

  it('resolveInternalUserEmail usa sintético quando email ausente', () => {
    expect(resolveInternalUserEmail(421931)).toBe('421931@internal.lilog');
  });

  it('resolveInternalUserEmail preserva email informado', () => {
    expect(resolveInternalUserEmail(421931, 'Real@Empresa.com')).toBe(
      'real@empresa.com',
    );
  });

  it('isInternalUserEmail identifica emails sintéticos', () => {
    expect(isInternalUserEmail('421931@internal.lilog')).toBe(true);
    expect(isInternalUserEmail('admin@portal.local')).toBe(false);
  });
});
