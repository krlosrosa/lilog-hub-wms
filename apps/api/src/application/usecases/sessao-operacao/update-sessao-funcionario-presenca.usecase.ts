import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { UpdateSessaoFuncionarioPresencaInput } from '../../../domain/model/sessao-operacao/sessao-operacao.model.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

@Injectable()
export class UpdateSessaoFuncionarioPresencaUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  async execute(
    sessaoId: string,
    funcionarioId: number,
    input: UpdateSessaoFuncionarioPresencaInput,
  ) {
    const sessao = await this.sessaoOperacaoRepository.findSessaoById(sessaoId);

    if (!sessao) {
      throw new NotFoundException('Sessão não encontrada');
    }

    if (sessao.status !== 'aberta') {
      throw new BadRequestException(
        'Presença só pode ser alterada em sessões abertas',
      );
    }

    return this.sessaoOperacaoRepository.updateSessaoFuncionarioPresenca(
      sessaoId,
      funcionarioId,
      input,
    );
  }
}
