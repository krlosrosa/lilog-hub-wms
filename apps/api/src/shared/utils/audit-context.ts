const AUDIT_BEFORE_KEY = '_auditBefore';

export function setAuditBefore(request: unknown, data: unknown): void {
  if (request && typeof request === 'object') {
    (request as Record<string, unknown>)[AUDIT_BEFORE_KEY] = data;
  }
}

export function getAuditBefore(
  request: unknown,
): Record<string, unknown> | null {
  if (!request || typeof request !== 'object') {
    return null;
  }

  const value = (request as Record<string, unknown>)[AUDIT_BEFORE_KEY];

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}
