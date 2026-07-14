export const INTERNAL_USER_EMAIL_DOMAIN = 'internal.lilog';

export function buildInternalUserEmail(userId: number): string {
  return `${userId}@${INTERNAL_USER_EMAIL_DOMAIN}`;
}

export function isInternalUserEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${INTERNAL_USER_EMAIL_DOMAIN}`);
}

export function resolveInternalUserEmail(
  userId: number,
  email?: string | null,
): string {
  const normalized = email?.trim().toLowerCase();

  if (normalized) {
    return normalized;
  }

  return buildInternalUserEmail(userId);
}
