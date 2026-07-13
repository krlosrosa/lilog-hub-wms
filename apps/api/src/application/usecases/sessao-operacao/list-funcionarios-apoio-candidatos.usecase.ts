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
export class ListFuncionariosApoioCandidatosUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  async execute(sessaoId: string) {
    const sessao = await this.sessaoOperacaoRepository.findSessaoById(sessaoId);

    if (!sessao) {
      throw new NotFoundException(`Sessão "${sessaoId}" não encontrada`);
    }

    if (sessao.status !== 'aberta') {
      throw new BadRequestException('A sessão precisa estar aberta');
    }

    const items =
      await this.sessaoOperacaoRepository.listFuncionariosApoioCandidatos(
        sessao.unidadeId,
        sessaoId,
      );

    return { items };
  }
}
