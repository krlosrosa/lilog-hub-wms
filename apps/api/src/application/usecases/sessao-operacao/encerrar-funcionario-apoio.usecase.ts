import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

@Injectable()
export class EncerrarFuncionarioApoioUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  async execute(
    sessaoId: string,
    sessaoFuncionarioId: string,
    userId: number,
  ) {
    const sessao = await this.sessaoOperacaoRepository.findSessaoById(sessaoId);

    if (!sessao) {
      throw new NotFoundException(`Sessão "${sessaoId}" não encontrada`);
    }

    if (sessao.status !== 'aberta') {
      throw new BadRequestException('A sessão precisa estar aberta');
    }

    const sessaoFuncionario =
      await this.sessaoOperacaoRepository.findSessaoFuncionarioById(
        sessaoId,
        sessaoFuncionarioId,
      );

    if (!sessaoFuncionario) {
      throw new NotFoundException('Funcionário não encontrado na sessão');
    }

    try {
      return await this.sessaoOperacaoRepository.encerrarFuncionarioApoio(
        sessaoId,
        sessaoFuncionarioId,
        userId,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('Apoio ativo não encontrado')) {
        throw new NotFoundException(message);
      }

      throw error;
    }
  }
}
