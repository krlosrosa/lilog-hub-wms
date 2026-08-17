import { ApiClientError } from '@/lib/offline/api-client';

export type RevisionConflictPayload = {
  code: 'REVISION_CONFLICT';
  baseRevision: number;
  currentRevision: number;
  message: string;
};

export function tryParseRevisionConflictPayload(
  value: unknown,
): RevisionConflictPayload | null {
  if (value == null) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    try {
      return tryParseRevisionConflictPayload(JSON.parse(trimmed));
    } catch {
      return trimmed.includes('REVISION_CONFLICT')
        ? {
            code: 'REVISION_CONFLICT',
            baseRevision: 0,
            currentRevision: 0,
            message: trimmed,
          }
        : null;
    }
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (record.code === 'REVISION_CONFLICT') {
      return {
        code: 'REVISION_CONFLICT',
        baseRevision: Number(record.baseRevision ?? 0),
        currentRevision: Number(record.currentRevision ?? 0),
        message: String(record.message ?? 'REVISION_CONFLICT'),
      };
    }

    if (typeof record.message === 'string') {
      return tryParseRevisionConflictPayload(record.message);
    }
  }

  return null;
}

export function isRevisionConflictError(err: unknown): boolean {
  if (err instanceof ApiClientError) {
    if (err.status !== 409) {
      return false;
    }

    return (
      tryParseRevisionConflictPayload(err.body) != null ||
      tryParseRevisionConflictPayload(err.message) != null
    );
  }

  if (err instanceof Error) {
    return tryParseRevisionConflictPayload(err.message) != null;
  }

  return false;
}
