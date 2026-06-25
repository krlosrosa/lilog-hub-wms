import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  FUNCIONARIO_REPOSITORY,
  type IFuncionarioRepository,
} from '../../../domain/repositories/funcionario/funcionario.repository.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

@Injectable()
export class AddEquipeFuncionarioUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
    @Inject(FUNCIONARIO_REPOSITORY)
    private readonly funcionarioRepository: IFuncionarioRepository,
  ) {}

  async execute(equipeId: string, funcionarioId: number) {
    const equipe = await this.sessaoOperacaoRepository.findEquipeById(equipeId);

    if (!equipe) {
      throw new NotFoundException('Equipe não encontrada');
    }

    if (!equipe.ativo) {
      throw new BadRequestException('Equipe inativa');
    }

    const funcionario = await this.funcionarioRepository.findById(funcionarioId);

    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    if (funcionario.unidadeId !== equipe.unidadeId) {
      throw new BadRequestException(
        'Funcionário pertence a outra unidade operacional',
      );
    }

    return this.sessaoOperacaoRepository.addEquipeFuncionario(
      equipeId,
      funcionarioId,
    );
  }
}
