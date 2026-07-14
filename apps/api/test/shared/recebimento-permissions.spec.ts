import { describe, expect, it } from 'vitest';

import {
  RECEBIMENTO_PERMISSION,
  resolveRecebimentoRolePermissions,
} from '../../src/shared/constants/recebimento-permissions.js';

describe('resolveRecebimentoRolePermissions', () => {
  it('grants finalize permission to operators', () => {
    const permissions = resolveRecebimentoRolePermissions('operator');

    expect(permissions).toContain(RECEBIMENTO_PERMISSION.CONFERIR);
    expect(permissions).toContain(RECEBIMENTO_PERMISSION.FINALIZAR);
  });

  it('grants finalize permission to leaders and managers', () => {
    for (const role of ['leader', 'manager'] as const) {
      const permissions = resolveRecebimentoRolePermissions(role);
      expect(permissions).toContain(RECEBIMENTO_PERMISSION.FINALIZAR);
    }
  });

  it('does not grant conferir permission to leaders', () => {
    const permissions = resolveRecebimentoRolePermissions('leader');

    expect(permissions).not.toContain(RECEBIMENTO_PERMISSION.CONFERIR);
  });
});
