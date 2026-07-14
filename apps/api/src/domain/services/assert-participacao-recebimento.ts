import { ForbiddenException } from '@nestjs/common';

export type RecebimentoParticipacaoContext = {
  responsavelId: number;
};

export type UserParticipacaoContext = {
  role: string;
  funcionarioId?: number | null;
};

export function shouldEnforceOperatorParticipacao(user: UserParticipacaoContext): boolean {
  return user.role === 'operator';
}

export function assertResponsavelRecebimento(
  recebimento: RecebimentoParticipacaoContext,
  funcionarioId: number | null | undefined,
): void {
  if (funcionarioId == null) {
    throw new ForbiddenException('Operador sem funcionário vinculado');
  }

  if (recebimento.responsavelId !== funcionarioId) {
    throw new ForbiddenException(
      'Apenas o responsável da carga pode executar esta ação',
    );
  }
}

export function assertResponsavelOuApoioRecebimento(
  recebimento: RecebimentoParticipacaoContext,
  funcionarioId: number | null | undefined,
  apoioFuncionarioIds: number[],
): void {
  if (funcionarioId == null) {
    throw new ForbiddenException('Operador sem funcionário vinculado');
  }

  if (recebimento.responsavelId === funcionarioId) {
    return;
  }

  if (apoioFuncionarioIds.includes(funcionarioId)) {
    return;
  }

  throw new ForbiddenException(
    'Você não está alocado como responsável ou apoio desta carga',
  );
}

export function resolveRecebimentoCapabilities(input: {
  funcionarioId: number | null | undefined;
  responsavelId: number | null | undefined;
  apoioFuncionarioIds: number[];
}): {
  papelDoUsuario: 'responsavel' | 'apoio' | null;
  capabilities: {
    canEditChecklist: boolean;
    canRegistrarTemperatura: boolean;
    canFinalizar: boolean;
    canGerenciarPaletes: boolean;
    canConferirItens: boolean;
  };
} {
  const { funcionarioId, responsavelId, apoioFuncionarioIds } = input;

  if (funcionarioId == null) {
    return {
      papelDoUsuario: null,
      capabilities: {
        canEditChecklist: false,
        canRegistrarTemperatura: false,
        canFinalizar: false,
        canGerenciarPaletes: false,
        canConferirItens: false,
      },
    };
  }

  const isResponsavel =
    responsavelId != null && responsavelId === funcionarioId;
  const isApoio = apoioFuncionarioIds.includes(funcionarioId);

  const papelDoUsuario = isResponsavel
    ? 'responsavel'
    : isApoio
      ? 'apoio'
      : null;

  const canParticipate = isResponsavel || isApoio;

  return {
    papelDoUsuario,
    capabilities: {
      canEditChecklist: isResponsavel,
      canRegistrarTemperatura: isResponsavel,
      canFinalizar: isResponsavel,
      canGerenciarPaletes: canParticipate,
      canConferirItens: canParticipate,
    },
  };
}
