import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

@Injectable()
export class ListSessaoFuncionarioPausasUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  async execute(sessaoId: string, funcionarioId: number) {
    const sessao = await this.sessaoOperacaoRepository.findSessaoById(sessaoId);

    if (!sessao) {
      throw new NotFoundException('Sessão não encontrada');
    }

    const funcionario = await this.sessaoOperacaoRepository.findSessaoFuncionario(
      sessaoId,
      funcionarioId,
    );

    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado na sessão');
    }

    return this.sessaoOperacaoRepository.listSessaoFuncionarioPausas(
      sessaoId,
      funcionarioId,
    );
  }
}
