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
export class AddEscalaFuncionarioUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
    @Inject(FUNCIONARIO_REPOSITORY)
    private readonly funcionarioRepository: IFuncionarioRepository,
  ) {}

  async execute(escalaId: string, funcionarioIds: number[]) {
    const escala = await this.sessaoOperacaoRepository.findEscalaById(escalaId);

    if (!escala) {
      throw new NotFoundException('Escala não encontrada');
    }

    const uniqueIds = [...new Set(funcionarioIds)];

    if (uniqueIds.length === 0) {
      throw new BadRequestException('Selecione ao menos um funcionário');
    }

    for (const funcionarioId of uniqueIds) {
      const funcionario =
        await this.funcionarioRepository.findById(funcionarioId);

      if (!funcionario) {
        throw new NotFoundException(
          `Funcionário ${funcionarioId} não encontrado`,
        );
      }

      if (funcionario.unidadeId !== escala.unidadeId) {
        throw new BadRequestException(
          `Funcionário ${funcionario.nome} pertence a outra unidade`,
        );
      }
    }

    const items = await this.sessaoOperacaoRepository.addEquipeFuncionarios(
      escala.equipeId,
      uniqueIds,
    );

    return {
      items,
      adicionados: items.length,
    };
  }
}
