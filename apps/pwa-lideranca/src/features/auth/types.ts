export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  funcionarioId?: number | null;
  unidadeId: string | null;
};

export type LoginInput = {
  id: number;
  password: string;
};

export type LoginResponse = {
  user: AuthUser;
};

export const LEADERSHIP_ROLES = ['admin', 'manager'] as const;

export type LeadershipRole = (typeof LEADERSHIP_ROLES)[number];

export function canAccessLeadershipApp(role: string): boolean {
  return LEADERSHIP_ROLES.includes(role as LeadershipRole);
}
