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
export class FinalizarSessaoFuncionarioPausaUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  async execute(sessaoId: string, funcionarioId: number, userId: number) {
    const sessao = await this.sessaoOperacaoRepository.findSessaoById(sessaoId);

    if (!sessao) {
      throw new NotFoundException('Sessão não encontrada');
    }

    if (sessao.status !== 'aberta') {
      throw new BadRequestException(
        'Pausas só podem ser finalizadas em sessões abertas',
      );
    }

    const funcionario = await this.sessaoOperacaoRepository.findSessaoFuncionario(
      sessaoId,
      funcionarioId,
    );

    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado na sessão');
    }

    const pausas = await this.sessaoOperacaoRepository.listSessaoFuncionarioPausas(
      sessaoId,
      funcionarioId,
    );

    if (!pausas.emPausaAgora) {
      throw new BadRequestException('Não há pausa em andamento para este funcionário');
    }

    return this.sessaoOperacaoRepository.finalizarSessaoFuncionarioPausa(
      sessaoId,
      funcionarioId,
      userId,
    );
  }
}
