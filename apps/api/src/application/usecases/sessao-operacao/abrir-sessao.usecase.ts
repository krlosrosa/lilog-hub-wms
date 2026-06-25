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
export class AbrirSessaoUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  async execute(id: string, userId: number) {
    const sessao = await this.sessaoOperacaoRepository.findSessaoById(id);

    if (!sessao) {
      throw new NotFoundException('Sessão não encontrada');
    }

    if (sessao.status !== 'planejada') {
      throw new BadRequestException(
        'Somente sessões planejadas podem ser abertas',
      );
    }

    return this.sessaoOperacaoRepository.abrirSessao(id, userId);
  }
}
