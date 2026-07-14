export function canAccessLiderancaPwa(role: string | undefined | null): boolean {
  return role === 'leader' || role === 'admin' || role === 'manager';
}
