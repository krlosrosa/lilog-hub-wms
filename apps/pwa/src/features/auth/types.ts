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
