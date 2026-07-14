export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
  funcionarioId?: number | null;
  unidadeId: string | null;
};

export type ChangePasswordInput = {
  currentPassword?: string;
  newPassword: string;
  confirmNewPassword: string;
};

export type LoginInput = {
  id: number;
  password: string;
};

export type LoginResponse = {
  user: AuthUser;
};
