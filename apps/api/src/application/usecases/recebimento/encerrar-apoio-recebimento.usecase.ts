import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { AlocacaoRecebimentoDto } from '../../dtos/recebimento/recursos-recebimento-sessao.dto.js';
import {
  RECEBIMENTO_ALOCACAO_REPOSITORY,
  type IRecebimentoAlocacaoRepository,
} from '../../../domain/repositories/recebimento/recebimento-alocacao.repository.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';
import { resolveOperatorFuncionarioId } from '../../../domain/services/assert-operator-funcionario.js';

function mapAlocacaoToDto(
  alocacao: Awaited<
    ReturnType<IRecebimentoAlocacaoRepository['encerrarApoio']>
  >,
): AlocacaoRecebimentoDto {
  return {
    id: alocacao.id,
    preRecebimentoId: alocacao.preRecebimentoId,
    sessaoId: alocacao.sessaoId,
    sessaoFuncionarioId: alocacao.sessaoFuncionarioId,
    funcionarioId: alocacao.funcionarioId,
    papel: alocacao.papel,
    status: alocacao.status,
    atribuidoEm: alocacao.atribuidoEm.toISOString(),
    inicioEm: alocacao.inicioEm?.toISOString() ?? null,
    canceladoEm: alocacao.canceladoEm?.toISOString() ?? null,
    encerradoEm: alocacao.encerradoEm?.toISOString() ?? null,
  };
}

@Injectable()
export class EncerrarApoioRecebimentoUseCase {
  constructor(
    @Inject(RECEBIMENTO_ALOCACAO_REPOSITORY)
    private readonly recebimentoAlocacaoRepository: IRecebimentoAlocacaoRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: string, userId: number): Promise<AlocacaoRecebimentoDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const funcionarioId = resolveOperatorFuncionarioId(user);

    if (funcionarioId == null) {
      throw new ForbiddenException('Usuário não possui funcionário vinculado');
    }

    try {
      const alocacao = await this.recebimentoAlocacaoRepository.encerrarApoio(
        id,
        funcionarioId,
      );

      return mapAlocacaoToDto(alocacao);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao encerrar apoio';

      if (message.includes('não encontrado')) {
        throw new NotFoundException(message);
      }

      if (
        message.includes('Somente o operador') ||
        message.includes('não possui')
      ) {
        throw new ForbiddenException(message);
      }

      throw new BadRequestException(message);
    }
  }
}
