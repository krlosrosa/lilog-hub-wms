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
export class CancelarSessaoUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  async execute(id: string) {
    const sessao = await this.sessaoOperacaoRepository.findSessaoById(id);

    if (!sessao) {
      throw new NotFoundException('Sessão não encontrada');
    }

    if (sessao.status !== 'planejada') {
      throw new BadRequestException(
        'Somente sessões planejadas podem ser canceladas',
      );
    }

    return this.sessaoOperacaoRepository.cancelarSessao(id);
  }
}
