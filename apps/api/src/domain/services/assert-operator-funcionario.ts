import { BadRequestException } from '@nestjs/common';

type UserOperadorContext = {
  role: string;
  funcionarioId: number | null;
};

export function assertOperatorHasFuncionario(user: UserOperadorContext): void {
  if (user.role === 'operator' && user.funcionarioId == null) {
    throw new BadRequestException(
      'Usuário operador deve ter um funcionário vinculado. Contate o administrador.',
    );
  }
}

export function resolveOperatorFuncionarioId(
  user: UserOperadorContext,
): number | undefined {
  if (user.role !== 'operator') {
    return user.funcionarioId ?? undefined;
  }

  assertOperatorHasFuncionario(user);
  return user.funcionarioId ?? undefined;
}
