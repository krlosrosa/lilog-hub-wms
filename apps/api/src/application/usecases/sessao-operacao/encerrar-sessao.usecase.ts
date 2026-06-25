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
export class EncerrarSessaoUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  async execute(id: string, userId: number) {
    const sessao = await this.sessaoOperacaoRepository.findSessaoById(id);

    if (!sessao) {
      throw new NotFoundException('Sessão não encontrada');
    }

    if (sessao.status !== 'aberta') {
      throw new BadRequestException(
        'Somente sessões abertas podem ser encerradas',
      );
    }

    const funcionarios =
      await this.sessaoOperacaoRepository.listSessaoFuncionarios(id);
    const pendentes = funcionarios.filter((f) => f.status === 'esperado');

    if (pendentes.length > 0) {
      throw new BadRequestException(
        `Não é possível encerrar a sessão com ${pendentes.length} funcionário(s) pendente(s). Marque a presença de todos antes de encerrar.`,
      );
    }

    const pausasAbertas =
      await this.sessaoOperacaoRepository.countPausasAbertasBySessaoId(id);

    if (pausasAbertas > 0) {
      throw new BadRequestException(
        `Não é possível encerrar a sessão com ${pausasAbertas} pausa(s) em andamento. Finalize todas as pausas antes de encerrar.`,
      );
    }

    return this.sessaoOperacaoRepository.encerrarSessao(id, userId);
  }
}
