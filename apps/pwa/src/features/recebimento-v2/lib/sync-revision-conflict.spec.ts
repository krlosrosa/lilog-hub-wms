import { describe, expect, it } from 'vitest';

import { ApiClientError } from '@/lib/offline/api-client';

import {
  isRevisionConflictError,
  tryParseRevisionConflictPayload,
} from './sync-revision-conflict';

describe('sync-revision-conflict', () => {
  it('parses REVISION_CONFLICT payload from JSON string', () => {
    const payload = tryParseRevisionConflictPayload(
      JSON.stringify({
        code: 'REVISION_CONFLICT',
        baseRevision: 28,
        currentRevision: 30,
        message: 'Dados foram modificados desde a última sincronização. Atualize e tente novamente.',
      }),
    );

    expect(payload?.code).toBe('REVISION_CONFLICT');
    expect(payload?.baseRevision).toBe(28);
    expect(payload?.currentRevision).toBe(30);
  });

  it('parses REVISION_CONFLICT from NestJS error body', () => {
    const payload = tryParseRevisionConflictPayload({
      statusCode: 409,
      message: JSON.stringify({
        code: 'REVISION_CONFLICT',
        baseRevision: 28,
        currentRevision: 30,
        message: 'conflict',
      }),
    });

    expect(payload?.code).toBe('REVISION_CONFLICT');
  });

  it('detects ApiClientError with status 409 and REVISION_CONFLICT body', () => {
    const err = new ApiClientError(
      JSON.stringify({
        code: 'REVISION_CONFLICT',
        baseRevision: 28,
        currentRevision: 30,
        message: 'conflict',
      }),
      409,
      {
        statusCode: 409,
        message: JSON.stringify({
          code: 'REVISION_CONFLICT',
          baseRevision: 28,
          currentRevision: 30,
          message: 'conflict',
        }),
      },
    );

    expect(isRevisionConflictError(err)).toBe(true);
  });

  it('returns false for non-revision 409 errors', () => {
    const err = new ApiClientError('Outro conflito', 409, {
      statusCode: 409,
      message: 'Outro conflito',
    });

    expect(isRevisionConflictError(err)).toBe(false);
  });
});
