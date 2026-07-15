import { describe, expect, it } from 'vitest';

import {
  formatSyncIssueErrorMessage,
  hasConferenciaBloqueadaIssues,
  isConferenciaBloqueadaError,
} from './sync-conferencia-bloqueada';

describe('sync-conferencia-bloqueada', () => {
  it('detects conferencia bloqueada errors', () => {
    expect(
      isConferenciaBloqueadaError(
        'Conferência só é permitida com recebimento em andamento',
      ),
    ).toBe(true);
    expect(
      isConferenciaBloqueadaError(
        'Avarias só podem ser registradas durante a conferência',
      ),
    ).toBe(true);
    expect(isConferenciaBloqueadaError('Produto não encontrado')).toBe(false);
  });

  it('detects blocked issues in sync queue', () => {
    expect(
      hasConferenciaBloqueadaIssues([
        { errorMessage: 'Avarias só podem ser registradas durante a conferência' },
      ]),
    ).toBe(true);
    expect(
      hasConferenciaBloqueadaIssues([{ errorMessage: 'Outro erro' }]),
    ).toBe(false);
  });

  it('adds reopen hint to blocked error messages', () => {
    expect(
      formatSyncIssueErrorMessage(
        'Conferência só é permitida com recebimento em andamento',
      ),
    ).toContain('Reabra a conferência no servidor');
  });
});
